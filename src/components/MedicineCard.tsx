// Simple Medicine Card Component
// Displays medicine with Cloudinary image

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MedicineCardProps {
  medicine: {
    _id: string;
    name: string;
    price: number;
    displayPrice?: number;
    currencySymbol?: string;
    image?: string;
    rating?: number;
    reviews?: number;
    category?: string;
    brand?: string;
    quantity?: number;
    quantityUnit?: string;
    stock?: number;
  };
  onAddCart?: (medicineId: string) => void;
}

function getQuantityLabel(medicine: MedicineCardProps['medicine']) {
  const hasQuantity = medicine.quantity !== undefined && medicine.quantity !== null;
  const hasUnit = medicine.quantityUnit && medicine.quantityUnit !== 'None';

  if (hasQuantity && hasUnit) return `${medicine.quantity} ${medicine.quantityUnit}`;
  if (hasQuantity) return String(medicine.quantity);
  if (hasUnit) return medicine.quantityUnit as string;
  return '';
}

export default function MedicineCard({
  medicine,
  onAddCart,
}: MedicineCardProps) {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const redirectToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  const handleAddCart = () => {
    onAddCart?.(medicine._id);
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return;
    }
    onAddCart?.(medicine._id);
    router.push('/cart');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden group">
        {medicine.image && !imageError ? (
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-linear-to-br from-blue-50 to-blue-100">
            💊
          </div>
        )}

        {/* Badge */}
        {medicine.stock !== undefined && medicine.stock <= 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category */}
        {medicine.category && (
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            {medicine.category}
          </span>
        )}

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
          {medicine.name}
        </h3>

        {/* Brand */}
        {medicine.brand && (
          <p className="text-xs text-gray-600 mb-2">
            Brand: <span className="font-semibold">{medicine.brand}</span>
          </p>
        )}

        {getQuantityLabel(medicine) && (
          <p className="text-xs text-indigo-700 mb-2 font-semibold">
            Qty: {getQuantityLabel(medicine)}
          </p>
        )}

        {/* Rating */}
        {medicine.rating !== undefined && medicine.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-yellow-400">
              {'⭐'.repeat(Math.round(medicine.rating))}
            </div>
            <span className="text-xs text-gray-600">
              {medicine.rating.toFixed(1)} {medicine.reviews && `(${medicine.reviews})`}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price and Button */}
        <div className="space-y-3 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {medicine.currencySymbol || '₹'}{medicine.displayPrice || medicine.price}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddCart}
              disabled={medicine.stock !== undefined && medicine.stock <= 0}
              className={`py-2 px-3 rounded-lg font-semibold transition-colors text-sm ${
                medicine.stock !== undefined && medicine.stock <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
              }`}
            >
              {medicine.stock !== undefined && medicine.stock <= 0
                ? 'Out of Stock'
                : '🛒 Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={medicine.stock !== undefined && medicine.stock <= 0}
              className={`py-2 px-3 rounded-lg font-semibold transition-colors text-sm ${
                medicine.stock !== undefined && medicine.stock <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
              }`}
            >
              {medicine.stock !== undefined && medicine.stock <= 0
                ? 'Out of Stock'
                : '💳 Buy Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid Component for displaying multiple medicines
interface MedicineGridProps {
  medicines: MedicineCardProps['medicine'][];
  onAddCart?: (medicineId: string) => void;
  isLoading?: boolean;
}

export function MedicineGrid({
  medicines,
  onAddCart,
  isLoading,
}: MedicineGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-lg h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!medicines || medicines.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No medicines found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {medicines.map((medicine) => (
        <MedicineCard
          key={medicine._id}
          medicine={medicine}
          onAddCart={onAddCart}
        />
      ))}
    </div>
  );
}
