'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HealthBlogPage() {
  const posts = [
    {
      id: 1,
      title: '10 Ways to Boost Your Immune System',
      excerpt: 'Learn about the best practices to keep your immune system strong and healthy.',
      date: 'Feb 4, 2026',
      category: 'Health Tips',
    },
    {
      id: 2,
      title: 'Understanding Common Cold and Flu',
      excerpt: 'Know the difference between cold and flu, and how to treat them effectively.',
      date: 'Feb 3, 2026',
      category: 'Diseases',
    },
    {
      id: 3,
      title: 'Benefits of Regular Exercise',
      excerpt: 'Discover how regular physical activity can improve your overall health and wellness.',
      date: 'Feb 2, 2026',
      category: 'Wellness',
    },
    {
      id: 4,
      title: 'Healthy Eating Habits',
      excerpt: 'Simple nutrition tips to maintain a healthy diet and lifestyle.',
      date: 'Feb 1, 2026',
      category: 'Nutrition',
    },
    {
      id: 5,
      title: 'Sleep and Its Importance',
      excerpt: 'Why quality sleep is crucial for your physical and mental health.',
      date: 'Jan 31, 2026',
      category: 'Wellness',
    },
    {
      id: 6,
      title: 'Stress Management Techniques',
      excerpt: 'Effective ways to manage stress and improve your mental health.',
      date: 'Jan 30, 2026',
      category: 'Mental Health',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Health Blog
          </h1>
          <p className="text-gray-600 mb-12">
            Expert health tips, wellness advice, and medical information
          </p>

          {/* Category Filter */}
          <div className="flex gap-2 mb-12 overflow-x-auto pb-2">
            {['All', 'Health Tips', 'Diseases', 'Wellness', 'Nutrition', 'Mental Health'].map(
              (category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 whitespace-nowrap transition"
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden cursor-pointer"
              >
                <div className="bg-gradient-to-r from-emerald-400 to-blue-500 h-48"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-500">{post.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 hover:text-emerald-600">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <a href="#" className="text-emerald-600 font-semibold text-sm hover:text-emerald-700">
                    Read More →
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Load More Articles
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
