import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const posts = [
  {
    title: 'How to Build a Safe Home Medicine Routine',
    excerpt: 'Simple daily habits to improve medicine safety, storage, and timely intake for all family members.',
    category: 'Wellness',
  },
  {
    title: 'Understanding Preventive Health Checkups',
    excerpt: 'A practical guide to choosing age-appropriate tests and reviewing your results with confidence.',
    category: 'Diagnostics',
  },
  {
    title: 'When to Choose Online Consultation',
    excerpt: 'Know when virtual consultation is the right choice and how to prepare for a productive appointment.',
    category: 'Consultation',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-orange-50">
          <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16 relative z-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Blog</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black text-emerald-700">Health Insights You Can Use Daily</h1>
            <p className="mt-4 text-emerald-600 max-w-3xl mx-auto text-sm sm:text-base">
              Short, practical guidance for better daily health decisions.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {posts.map((post) => (
              <article key={post.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{post.category}</p>
                <h2 className="mt-2 text-xl font-black text-emerald-700">{post.title}</h2>
                <p className="mt-2 text-slate-700 text-sm leading-6">{post.excerpt}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-emerald-700 font-semibold">Want more quick reads?</p>
            <Link href="/health-blog" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold w-fit transition">
              View Full Health Blog
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
