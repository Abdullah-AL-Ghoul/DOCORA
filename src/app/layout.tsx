import React from 'react';
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'DOCORA — AI Document Studio (Phase 01 MVP)',
  description:
    'Engineered Bidirectional Arabic/English Document Studio with CDM v1.2, Tiptap 3.0, docx@9.15.2 OOXML, and Atomic Token Ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
