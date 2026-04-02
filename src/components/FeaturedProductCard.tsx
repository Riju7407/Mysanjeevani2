'use client';

import { useState } from 'react';

interface FeaturedProductCardProps {
  brandName: string;
  imageUrl: string;
  cardBgColor?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const getReadableTextColor = (hexColor: string) => {
  const safeHex = (hexColor || '#ffffff').replace('#', '');
  const normalized =
    safeHex.length === 3
      ? safeHex
          .split('')
          .map((c) => c + c)
          .join('')
      : safeHex.padEnd(6, '0').slice(0, 6);

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
};

export default function FeaturedProductCard({
  brandName,
  imageUrl,
  cardBgColor = '#ffffff',
  onEdit,
  onDelete,
  isAdmin = false,
}: FeaturedProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const brandTextColor = getReadableTextColor(cardBgColor);

  return (
    <div className="relative group">
      <div
        className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col w-full h-full"
        style={{ backgroundColor: '#ffffff', border: `3px solid ${cardBgColor}` }}
      >
        <div className="h-2 w-full" style={{ backgroundColor: cardBgColor }} />

        {/* Image Container */}
        <div
          className="relative h-28 flex items-center justify-center overflow-hidden rounded-md"
          style={{ backgroundColor: '#f8fafc' }}
        >
          {!imageError ? (
            <img
              src={imageUrl}
              alt={brandName}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span
                className="text-sm text-center px-2"
                style={{ color: brandTextColor }}
              >
                Image not available
              </span>
            </div>
          )}
        </div>

        {/* Brand Name */}
        <div
          className="mt-1 px-2 py-1 h-10 flex flex-col justify-center rounded-md"
          style={{ backgroundColor: cardBgColor, borderColor: 'rgba(15,23,42,0.15)' }}
        >
          <h3 className="font-bold text-center text-xs line-clamp-1" style={{ color: brandTextColor }}>
            {brandName}
          </h3>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onEdit}
                className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
