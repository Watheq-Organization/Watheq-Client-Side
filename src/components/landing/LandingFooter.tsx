import React from 'react';
import { WatheqBrandLogo } from './WatheqBrandLogo';

/**
 * Code 2 (Lovable) design system tokens, scoped to this section.
 * Light values are the exact Code 2 oklch tokens. Dark values are derived from the
 * same system and switch with the project's `.dark` class.
 */

const FOOTER_STYLES = `
.wq-footer {
  --wq-foreground: #18332d;
  --wq-muted-foreground: #647871;
  --wq-border: #e2ebe7;
  --wq-ring: #0f8069;
  color: var(--wq-foreground);
}

.dark .wq-footer {
  --wq-foreground: #f4f4f5;
  --wq-muted-foreground: #a1a1aa;
  --wq-border: #333338;
  --wq-ring: #0f8069;
}
`;


const quickLinks = [
  { href: '#features', label: 'المزايا والخصائص' },
  { href: '#how-it-works', label: 'كيف يعمل وثّق؟' },
  { href: '#comparison', label: 'المقارنة والبدائل' },
  { href: '#pricing', label: 'الخطط والأسعار' },
  { href: '#faq', label: 'الأسئلة الشائعة' },
];

const supportLinks = [
  { href: '/help', label: 'مركز المساعدة والدعم' },
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'شروط الاستخدام والخدمة' },
  { href: '/contact', label: 'تواصل مع فريق الدعم الفني' },
];

const linkClass =
  'text-sm text-[color:var(--wq-muted-foreground)] transition-colors hover:text-[color:var(--wq-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--wq-ring)]';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="wq-footer border-t border-[color:var(--wq-border)] py-12">
      <style>{FOOTER_STYLES}</style>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 md:flex-row md:items-start md:justify-between">
        {/* Logo & Description */}
        <div className="max-w-sm text-right">
          <WatheqBrandLogo size="md" lightText={false} />
          <p className="mt-4 text-sm leading-7 text-[color:var(--wq-muted-foreground)]">
            منصة رقمية لإدارة وتوثيق مالية المحلات: ديون، مبيعات، مخزون، تحويلات بنكية، موظفين وفروع. صُممت خصيصاً للتجار لضمان حقوقهم وحقوق زبائنهم.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-16 gap-y-8 text-right">
          <nav aria-label="روابط سريعة">
            <h4 className="text-sm font-bold">روابط سريعة</h4>
            <ul className="mt-3 space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="المساعدة والأمان">
            <h4 className="text-sm font-bold">المساعدة والأمان</h4>
            <ul className="mt-3 space-y-3">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Copyright */}
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 px-5 text-xs text-[color:var(--wq-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} وثّق Watheq — جميع الحقوق محفوظة. نوثّق المعاملة، نوضح الحساب، ونبني الثقة الرقمية.
        </p>
        <p>صُنع بشغف لتمكين التجار وأصحاب المحلات</p>
      </div>
    </footer>
  );
};