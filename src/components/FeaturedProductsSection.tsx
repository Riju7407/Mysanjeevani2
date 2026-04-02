'use client';

import { useState, useEffect } from 'react';
import FeaturedProductCard from './FeaturedProductCard';

interface FeaturedProduct {
  _id: string;
  brandName: string;
  imageUrl: string;
  cardBgColor?: string;
  isActive: boolean;
}

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
          <div key={product._id} className="shrink-0 w-40 h-40">
            <FeaturedProductCard
              brandName={product.brandName}
              imageUrl={product.imageUrl}
              cardBgColor={product.cardBgColor}
              isAdmin={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
