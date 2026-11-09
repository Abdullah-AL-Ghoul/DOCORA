'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  LayoutDashboard,
  PlusCircle,
  Settings,
  FolderKanban,
  Globe,
  Menu,
  X,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { DocumentLocale } from '@/lib/cdm/schema';
import { Badge, ThemeToggle } from '@/components/primitives';

export interface WorkspaceShellProps {
  locale: DocumentLocale;
  children: React.ReactNode;
}

export function WorkspaceShell({ locale, children }: WorkspaceShellProps) {
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: isAr ? 'لوحة المتابعة' : 'Dashboard',
      icon: LayoutDashboard,
      active: pathname.endsWith('/dashboard'),
    },
    {
      href: `/${locale}/documents`,
      label: isAr ? 'مكتبة المستندات' : 'Documents',
      icon: FolderKanban,
      active: pathname.includes('/documents') && !pathname.endsWith('/new'),
    },
    {
      href: `/${locale}/documents/new`,
      label: isAr ? 'مستند جديد' : 'New Document',
      icon: PlusCircle,
      active: pathname.endsWith('/documents/new'),
    },
    {
      href: `/${locale}/documents/exec-contract-ar`,
      label: isAr ? 'استوديو التحرير' : 'Studio',
      icon: FileText,
      active: pathname.includes('/studio') || (pathname.includes('/documents/') && !pathname.endsWith('/new')),
    },
    {
      href: `/${locale}/settings`,
      label: isAr ? 'الإعدادات والحساب' : 'Settings',
      icon: Settings,
      active: pathname.endsWith('/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#090A0F] dark:text-[#F8FAFC]">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 border-b border-[#CBD5E1] bg-[#FFFFFF]/95 backdrop-blur-xs dark:border-[#1E293B] dark:bg-[#11131A]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] font-extrabold text-[#FFFFFF] shadow-xs">
                D
              </div>
              <span className="text-lg font-black tracking-tight">DOCORA</span>
            </Link>

            <Badge tone="verified" className="hidden sm:inline-flex">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              <span>{isAr ? 'CDM v1.2 مفعّل' : 'CDM v1.2 Ready'}</span>
            </Badge>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label={isAr ? 'التنقل الرئيسي لمساحة العمل' : 'Workspace Main Navigation'}
            className="hidden md:flex items-center gap-1.5"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    item.active
                      ? 'bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Utilities: Search Hint, Theme & Language Toggle, Profile */}
          <div className="flex items-center gap-2">
            <ThemeToggle locale={locale} />

            <Link
              href={isAr ? '/en/dashboard' : '/ar/dashboard'}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
              aria-label={isAr ? 'Switch to English interface' : 'التبديل إلى الواجهة العربية'}
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{isAr ? 'English' : 'العربية'}</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex min-h-11 w-11 items-center justify-center rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A] md:hidden dark:border-[#334155] dark:bg-[#11131A] dark:text-[#F8FAFC]"
              aria-label={mobileMenuOpen ? (isAr ? 'إغلاق القائمة' : 'Close Menu') : (isAr ? 'فتح القائمة' : 'Open Menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#CBD5E1] bg-[#FFFFFF] px-4 py-3 md:hidden dark:border-[#1E293B] dark:bg-[#11131A]">
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                      item.active
                        ? 'bg-[#EEF2FF] text-[#4338CA] dark:bg-[#1E1B4B] dark:text-[#818CF8]'
                        : 'text-[#475569] hover:bg-[#F1F5F9] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full">{children}</main>
    </div>
  );
}
