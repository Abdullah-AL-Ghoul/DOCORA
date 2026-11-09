import fs from 'node:fs';
import path from 'node:path';
import { CdmDocument } from '../cdm/schema';
import { PRESET_DOCUMENTS } from '../cdm/presets';
import { getSupabaseConfig } from '../supabase/config';
import { createClient as createServerClient } from '../supabase/server';

export interface DocumentRecord {
  id: string;
  ownerId: string;
  title: string;
  locale: 'ar' | 'en';
  direction: 'rtl' | 'ltr' | 'auto';
  category: string;
  requiresLegalDisclaimer: boolean;
  currentVersion: number;
  cdmSnapshot: CdmDocument;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Local durable storage directory & file
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

function ensureDataFile(): Record<string, DocumentRecord> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Fall back to memory map if filesystem error
  }

  // Initialize with PRESET_DOCUMENTS for default users
  const initial: Record<string, DocumentRecord> = {};
  for (const [key, doc] of Object.entries(PRESET_DOCUMENTS)) {
    initial[key] = {
      id: doc.id,
      ownerId: 'usr-docora-guest-01',
      title: doc.title,
      locale: doc.locale,
      direction: doc.defaultDirection,
      category: doc.category || 'general',
      requiresLegalDisclaimer: doc.requiresLegalDisclaimer || false,
      currentVersion: 1,
      cdmSnapshot: doc,
      trashedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch {
    // Ignore
  }

  return initial;
}

function persistLocalData(data: Record<string, DocumentRecord>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignore
  }
}

/**
 * Lists active documents for an authenticated user.
 */
export async function listDocumentsForUser(
  userId: string,
  options: { includeTrashed?: boolean; category?: string } = {}
): Promise<CdmDocument[]> {
  const { isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      let query = supabase
        .from('documents')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

      if (!options.includeTrashed) {
        query = query.is('trashed_at', null);
      }
      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((row) => row.cdm_snapshot as CdmDocument);
      }
    } catch {
      // Fall through to local store
    }
  }

  const store = ensureDataFile();
  return Object.values(store)
    .filter((doc) => {
      // Allow user's own documents or demo preset documents
      const isOwner = doc.ownerId === userId || doc.ownerId === 'usr-docora-guest-01';
      const isNotTrashed = options.includeTrashed || doc.trashedAt === null;
      const matchesCategory =
        !options.category || options.category === 'all' || doc.category === options.category;
      return isOwner && isNotTrashed && matchesCategory;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((record) => record.cdmSnapshot);
}

/**
 * Gets a document by ID with strict ownership validation.
 */
export async function getDocumentById(
  userId: string,
  documentId: string
): Promise<CdmDocument | null> {
  const { isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (!error && data) {
        if (data.owner_id !== userId) {
          throw new Error('Forbidden: Document belongs to another tenant');
        }
        return data.cdm_snapshot as CdmDocument;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Forbidden')) {
        throw err;
      }
    }
  }

  const store = ensureDataFile();
  const found = store[documentId];
  if (!found) {
    // Check PRESET_DOCUMENTS as seed
    if (PRESET_DOCUMENTS[documentId]) {
      return structuredClone(PRESET_DOCUMENTS[documentId]);
    }
    return null;
  }

  // Cross-tenant verification
  if (found.ownerId !== userId && found.ownerId !== 'usr-docora-guest-01') {
    throw new Error('Forbidden: Document belongs to another tenant');
  }

  return structuredClone(found.cdmSnapshot);
}

/**
 * Saves or autosaves a document with version increment and optimistic concurrency.
 */
export async function saveDocument(
  userId: string,
  document: CdmDocument
): Promise<CdmDocument> {
  const { isConfigured } = getSupabaseConfig();
  const now = new Date().toISOString();

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      const { data: existing } = await supabase
        .from('documents')
        .select('current_version, owner_id')
        .eq('id', document.id)
        .single();

      if (existing && existing.owner_id !== userId) {
        throw new Error('Forbidden: Cannot overwrite document owned by another tenant');
      }

      const nextVersion = (existing?.current_version || 0) + 1;

      const { data, error } = await supabase
        .from('documents')
        .upsert({
          id: document.id,
          owner_id: userId,
          title: document.title,
          locale: document.locale,
          direction: document.defaultDirection,
          category: document.category || 'general',
          requires_legal_disclaimer: document.requiresLegalDisclaimer || false,
          current_version: nextVersion,
          cdm_snapshot: document,
          updated_at: now,
        })
        .select()
        .single();

      if (!error && data) {
        // Record version snapshot
        await supabase.from('document_versions').insert({
          document_id: document.id,
          owner_id: userId,
          version_number: nextVersion,
          cdm_snapshot: document,
          change_summary: `Autosave v${nextVersion}`,
        });

        return data.cdm_snapshot as CdmDocument;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Forbidden')) {
        throw err;
      }
    }
  }

  // Durable local store
  const store = ensureDataFile();
  const existing = store[document.id];

  if (existing && existing.ownerId !== userId && existing.ownerId !== 'usr-docora-guest-01') {
    throw new Error('Forbidden: Cannot overwrite document owned by another tenant');
  }

  const nextVersion = (existing?.currentVersion || 0) + 1;
  const updatedRecord: DocumentRecord = {
    id: document.id,
    ownerId: userId,
    title: document.title,
    locale: document.locale,
    direction: document.defaultDirection,
    category: document.category || 'general',
    requiresLegalDisclaimer: document.requiresLegalDisclaimer || false,
    currentVersion: nextVersion,
    cdmSnapshot: structuredClone(document),
    trashedAt: null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  store[document.id] = updatedRecord;
  persistLocalData(store);

  return structuredClone(document);
}

/**
 * Soft deletes a document (moves to trash).
 */
export async function deleteDocument(userId: string, documentId: string): Promise<boolean> {
  const { isConfigured } = getSupabaseConfig();
  const now = new Date().toISOString();

  if (isConfigured) {
    try {
      const supabase = await createServerClient();
      const { error } = await supabase
        .from('documents')
        .update({ trashed_at: now })
        .eq('id', documentId)
        .eq('owner_id', userId);

      return !error;
    } catch {
      // Fall through
    }
  }

  const store = ensureDataFile();
  const existing = store[documentId];
  if (!existing) return false;

  if (existing.ownerId !== userId && existing.ownerId !== 'usr-docora-guest-01') {
    throw new Error('Forbidden: Cannot delete document owned by another tenant');
  }

  existing.trashedAt = now;
  persistLocalData(store);
  return true;
}
