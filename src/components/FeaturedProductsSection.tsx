'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeaturedProductCard from './FeaturedProductCard';

interface FeaturedProduct {
  _id: string;
  brandName: string;
  category?: string;
  subcategory?: string;
  imageUrl: string;
  cardBgColor?: string;
  isActive: boolean;
}

function mapLabCategory(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'all';
  const map: Record<string, string> = {
    general: 'general',
    diabetes: 'diabetic',
    diabetic: 'diabetic',
    cardiac: 'cardiac',
    thyroid: 'thyroid',
    liver: 'liver',
    kidney: 'kidney',
    vitamins: 'vitamin',
    vitamin: 'vitamin',
    infection: 'infection',
    women: 'womens-health',
    "women's health": 'womens-health',
    'womens health': 'womens-health',
  };
  return map[normalized] || 'all';
}

export default function FeaturedProductsSection() {
  const router = useRouter();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const handleFeaturedClick = (product: FeaturedProduct) => {
    const category = String(product.category || '').trim();
    const subcategory = String(product.subcategory || '').trim();

    if (category === 'Lab Tests') {
      const labCategory = mapLabCategory(subcategory);
      router.push(`/lab-tests?category=${encodeURIComponent(labCategory)}`);
      return;
    }

    // Map category to URL parameter
    const categoryMap: Record<string, string> = {
      'Ayurveda Medicine': 'ayurveda',
      'Ayurveda': 'ayurveda',
      'Homeopathy': 'homeopathy',
      'Nutrition': 'nutrition',
      'Personal Care': 'personal-care',
      'Fitness': 'fitness',
      'Sexual Wellness': 'sexual-wellness',
      'Baby Care': 'baby-care',
      'Unani': 'unani',
      'Generic Medicine': 'medicines',
    };

    let categoryQuery = categoryMap[category] || 'medicines';

    // For Ayurveda and Homeopathy, route to dedicated pages
    if (categoryQuery === 'ayurveda') {
      const params = new URLSearchParams();
      if (subcategory) params.set('subcategory', subcategory);
      router.push(`/ayurveda?${params.toString()}`);
      return;
    }

    if (categoryQuery === 'homeopathy') {
      const params = new URLSearchParams();
      if (subcategory) params.set('subcategory', subcategory);
      router.push(`/homeopathy?${params.toString()}`);
      return;
    }

    // For all other categories, use medicines page with category filter
    const params = new URLSearchParams();
    params.set('category', categoryQuery);
    if (subcategory) params.set('subcategory', subcategory);
    router.push(`/medicines?${params.toString()}`);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/featured-products', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success) {
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6 w-full">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
                className="shrink-0 bg-white/80 border border-white rounded-lg h-40 w-40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-6 w-full overflow-x-auto">
      <div className="flex gap-4 pb-4 scrollbar-hide">
        {products.map((product) => (
          <button
            key={product._id}
            type="button"
            onClick={() => handleFeaturedClick(product)}
            className="shrink-0 w-40 h-40 text-left"
            title={product.subcategory ? `${product.category} - ${product.subcategory}` : product.category || product.brandName}
          >
            <FeaturedProductCard
              brandName={product.brandName}
              imageUrl={product.imageUrl}
              cardBgColor={product.cardBgColor}
              isAdmin={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
