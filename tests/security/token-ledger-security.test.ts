import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { dalStore, AuthenticatedSession } from '@/lib/dal';

describe('GATE-03R Security Suite: Token Ledger, RLS & Zero Phase Leakage', () => {
  const userA: AuthenticatedSession = {
    userId: 'usr-docora-owner-01',
    email: 'owner@docora.studio',
    displayName: 'Owner A',
    planTier: 'free',
    role: 'authenticated',
  };

  const anonCaller: AuthenticatedSession = {
    userId: '',
    email: '',
    displayName: 'Anonymous',
    planTier: 'free',
    role: 'anon',
  };

  beforeEach(() => {
    dalStore.resetToDefault();
  });

  it('enforces Zero Phase Leakage: only 0001..0004 migrations exist in supabase/migrations/', () => {
    const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    expect(files).toEqual([
      '0001_iam_and_profiles.sql',
      '0002_entitlements_and_token_ledger.sql',
      '0003_documents_and_cdm_versions.sql',
      '0004_pgmq_export_jobs.sql',
    ]);
  });

  it('verifies 0002_entitlements_and_token_ledger.sql uses SECURITY DEFINER SET search_path = "" and revokes PUBLIC/anon', () => {
    const sqlPath = path.resolve(
      process.cwd(),
      'supabase/migrations/0002_entitlements_and_token_ledger.sql'
    );
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    expect(sql).toContain("SECURITY DEFINER\nSET search_path = ''");
    expect(sql).toContain('v_user_id := auth.uid();');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain(
      'REVOKE ALL ON FUNCTION public.reserve_tokens(INT, TEXT, TEXT) FROM PUBLIC, anon;'
    );
    expect(sql).toContain(
      'REVOKE ALL ON FUNCTION public.settle_token_reservation(UUID, INT, INT) FROM PUBLIC, anon, authenticated;'
    );
    expect(sql).toContain(
      'GRANT EXECUTE ON FUNCTION public.settle_token_reservation(UUID, INT, INT) TO service_role;'
    );
  });

  it('rejects unauthenticated (anon) token reservation attempts', async () => {
    await expect(
      dalStore.reserveTokens(anonCaller, {
        estimatedTokens: 500,
        idempotencyKey: 'idem-anon-attempt-01',
      })
    ).rejects.toThrow(/Unauthorized/);
  });

  it('prevents client spoofing of another tenant user_id during token reservation', async () => {
    await expect(
      dalStore.reserveTokens(userA, {
        estimatedTokens: 500,
        idempotencyKey: 'idem-spoof-attempt-01',
        spoofedUserId: 'usr-victim-tenant-02',
      })
    ).rejects.toThrow(/Security Violation/);

    // Verify victim balance is completely untouched
    const serviceSession: AuthenticatedSession = {
      ...userA,
      role: 'service_role',
    };
    const victimRecord = dalStore.getEntitlement(
      serviceSession,
      'usr-victim-tenant-02'
    );
    expect(victimRecord.tokensReserved).toBe(0);
    expect(victimRecord.tokensUsed).toBe(12000);
  });

  it('blocks Free Tier users from reserving gemini-4-argon (ADR-003)', async () => {
    await expect(
      dalStore.reserveTokens(userA, {
        estimatedTokens: 1000,
        idempotencyKey: 'idem-argon-free-tier',
        modelId: 'gemini-4-argon',
      })
    ).rejects.toThrow(/not available on the Free Tier/);
  });

  it('returns the existing transaction idempotently when the same idempotency_key is retried', async () => {
    const first = await dalStore.reserveTokens(userA, {
      estimatedTokens: 1500,
      idempotencyKey: 'idem-retry-key-001',
    });
    const second = await dalStore.reserveTokens(userA, {
      estimatedTokens: 1500,
      idempotencyKey: 'idem-retry-key-001',
    });

    expect(second.id).toBe(first.id);
    const entitlement = dalStore.getEntitlement(userA);
    expect(entitlement.tokensReserved).toBe(1500);
  });

  it('prevents concurrent double-spend when 5 parallel requests compete for the remaining quota', async () => {
    // Set remaining quota to 2000 tokens (48,000 used out of 50,000)
    dalStore.setEntitlementForTest({
      userId: userA.userId,
      planTier: 'free',
      monthlyTokenLimit: 50000,
      tokensUsed: 48000,
      tokensReserved: 0,
      updatedAt: new Date().toISOString(),
    });

    // Fire 5 concurrent requests each asking for 1200 tokens -> only 1 can succeed!
    const attempts = Array.from({ length: 5 }, (_, idx) =>
      dalStore.reserveTokens(userA, {
        estimatedTokens: 1200,
        idempotencyKey: `idem-race-concurrent-${idx + 1}`,
      })
    );

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(4);

    const afterEntitlement = dalStore.getEntitlement(userA);
    expect(afterEntitlement.tokensReserved).toBe(1200);
    expect(
      afterEntitlement.tokensUsed + afterEntitlement.tokensReserved
    ).toBeLessThanOrEqual(afterEntitlement.monthlyTokenLimit);
  });

  it('blocks authenticated client from calling service_role settlement directly, and settles/refunds accurately via service_role', async () => {
    const tx = await dalStore.reserveTokens(userA, {
      estimatedTokens: 2000,
      idempotencyKey: 'idem-settle-flow-01',
    });

    await expect(
      dalStore.settleTokenReservation('authenticated', {
        txId: tx.id,
        actualInputTokens: 400,
        actualOutputTokens: 600,
      })
    ).rejects.toThrow(/requires service_role/);

    const settled = await dalStore.settleTokenReservation('service_role', {
      txId: tx.id,
      actualInputTokens: 400,
      actualOutputTokens: 600,
    });

    expect(settled.status).toBe('SETTLED');
    expect(settled.settledTokens).toBe(1000);
    expect(settled.refundedTokens).toBe(1000);

    const finalEntitlement = dalStore.getEntitlement(userA);
    expect(finalEntitlement.tokensReserved).toBe(0);
    expect(finalEntitlement.tokensUsed).toBe(7900 + 1000);
  });
});
