import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface InfoSection {
  heading: string;
  content: string[];
}

interface InfoPageLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  lastUpdated?: string;
  sections: InfoSection[];
}

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
  { label: 'Blog', href: '/blog' },
  { label: 'Help Center', href: '/help' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Track Order', href: '/track' },
  { label: 'Returns', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Shipping Policy', href: '/shipping' },
];

export default function InfoPageLayout({
  badge,
  title,
  subtitle,
  lastUpdated,
  sections,
}: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-orange-50">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16 relative z-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{badge}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black text-emerald-700">{title}</h1>
            <p className="mt-4 text-emerald-600 max-w-3xl mx-auto text-sm sm:text-base">{subtitle}</p>
            {lastUpdated && (
              <p className="mt-3 text-xs sm:text-sm text-orange-500 font-semibold">Last Updated: {lastUpdated}</p>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="space-y-8">
              {sections.map((section) => (
                <article key={section.heading}>
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-700">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.content.map((paragraph, index) => (
                      <p key={`${section.heading}-${index}`} className="text-slate-700 leading-7">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-14 sm:pb-16">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-7">
            <h3 className="text-xl font-black text-emerald-700">Quick Access</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
