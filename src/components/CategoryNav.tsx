'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Category {
  name: string;
  subcategories: string[];
  icon: string;
  color: string;
  href: string;
}

const CATEGORIES: Category[] = [
  {
    name: 'Medicines',
    icon: '💊',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Addiction',
      'Anxiety & Depression',
      'Sleeplessness',
      'Weak Memory',
      'Acne & Pimples',
      'Dark Circles & Marks',
      'Wrinkles & Aging',
      'Hair Fall',
      'Dandruff',
      'Cough',
      'Asthma',
      'Bronchitis',
      'Indigestion/Acidity/Gas',
      'Diabetes',
      'Blood Pressure',
      'Headache & Migraine',
      'Back & Knee Pain',
      'Arthritis & Joint Pains',
    ],
  },
  {
    name: 'Ayurveda',
    icon: '🌿',
    color: 'emerald',
    href: '/ayurveda',
    subcategories: [
      'All',
      'Himalaya',
      'Organic India',
      'Baidyanath',
      'Dabur',
      'Zandu',
      'Charak',
      'Aimil',
      'Ras & Sindoor',
      'Bhasm & Pishti',
      'Vati, Gutika & Guggulu',
      'Chyawanprash',
      'Honey',
    ],
  },
  {
    name: 'Homeopathy',
    icon: '🌸',
    color: 'emerald',
    href: '/homeopathy',
    subcategories: [
      'All',
      'SBL',
      'Dr. Reckeweg',
      'Willmar Schwabe',
      'Bjain',
      '30 CH',
      '200 CH',
      '1000 CH',
      'Mother Tinctures',
      'Biochemic',
      'Bach Flower',
    ],
  },
  {
    name: 'Nutrition',
    icon: '🥗',
    color: 'green',
    href: '/medicines',
    subcategories: [
      'All',
      'Protein Powder',
      'Multivitamins',
      'Omega 3 & Fish Oil',
      'Vitamin D',
      'Vitamin B12',
      'Calcium & Minerals',
      'Weight Gainer',
      'Meal Replacement',
      'Amino Acids',
      'Pre-Workout',
      'Energy Bars',
    ],
  },
  {
    name: 'Personal Care',
    icon: '🧴',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Face Wash',
      'Shampoo',
      'Conditioner',
      'Body Wash',
      'Soap',
      'Toothpaste',
      'Deodorant',
      'Face Moisturizer',
      'Sunscreen',
      'Lotion',
      'Lip Balm',
    ],
  },
  {
    name: 'Fitness',
    icon: '💪',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Protein Supplements',
      'BCAA',
      'Creatine',
      'Weight Loss',
      'Energy Drinks',
      'Joint Care',
      'Muscle Recovery',
      'Workout Accessories',
      'Fitness Bands',
      'Water Bottles',
      'Fitness Gear',
    ],
  },
  {
    name: 'Sexual Wellness',
    icon: '💑',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Performance Enhancement',
      'Lubricants',
      'Contraceptives',
      'Intimate Health',
      'Supplements',
      'Hygiene Products',
      'Wellness Kits',
    ],
  },
  {
    name: 'Herbs',
    icon: '🌾',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Ashwagandha',
      'Turmeric',
      'Ginger',
      'Garlic',
      'Neem',
      'Tulsi',
      'Moringa',
      'Brahmi',
      'Giloy',
      'Amla',
      'Basil',
    ],
  },
  {
    name: 'Unani',
    icon: '⚗️',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Burcina',
      'Joshanda',
      'Roghan',
      'Habbaloud',
      'Habb-e-Mumsik',
      'Kushta',
      'Arq',
      'Tila',
      'Ubtan',
      'Majoon',
    ],
  },
  {
    name: 'Baby Care',
    icon: '👶',
    color: 'emerald',
    href: '/medicines',
    subcategories: [
      'All',
      'Diapers',
      'Baby Wipes',
      'Baby Bath',
      'Baby Lotion',
      'Baby Oil',
      'Baby Powder',
      'Teethers',
      'Feeding Bottles',
      'Diaper Rash Cream',
      'Baby Shampoo',
      'Baby Food',
    ],
  },
];

const COLOR_STYLES: Record<string, any> = {
  emerald: {
    hover: 'hover:bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-500',
    subcategoryBg: 'hover:bg-emerald-100',
  },
  amber: {
    hover: 'hover:bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-500',
    subcategoryBg: 'hover:bg-amber-100',
  },
  pink: {
    hover: 'hover:bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-500',
    subcategoryBg: 'hover:bg-pink-100',
  },
  green: {
    hover: 'hover:bg-green-50',
    text: 'text-green-700',
    border: 'border-green-500',
    subcategoryBg: 'hover:bg-green-100',
  },
  purple: {
    hover: 'hover:bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-500',
    subcategoryBg: 'hover:bg-purple-100',
  },
  red: {
    hover: 'hover:bg-red-50',
    text: 'text-red-700',
    border: 'border-red-500',
    subcategoryBg: 'hover:bg-red-100',
  },
  rose: {
    hover: 'hover:bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-500',
    subcategoryBg: 'hover:bg-rose-100',
  },
  lime: {
    hover: 'hover:bg-lime-50',
    text: 'text-lime-700',
    border: 'border-lime-500',
    subcategoryBg: 'hover:bg-lime-100',
  },
  sky: {
    hover: 'hover:bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-500',
    subcategoryBg: 'hover:bg-sky-100',
  },
  indigo: {
    hover: 'hover:bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-500',
    subcategoryBg: 'hover:bg-indigo-100',
  },
};

export default function CategoryNav({ isMobile = false }: { isMobile?: boolean }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  if (isMobile) {
    // Mobile menu version - expanded categories
    return (
      <div className="space-y-2 pb-2">
        {CATEGORIES.map((category) => (
          <div key={category.name} className="border-b border-gray-100">
            <Link
              href={category.href}
              className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500 font-medium"
            >
              <span>{category.name}</span>
            </Link>
            <div className="pl-6 space-y-1">
              {category.subcategories.slice(1, 6).map((subcat) => {
                let href = '#';
                if (category.name === 'Medicines') {
                  href = `/medicines?subcategory=${encodeURIComponent(subcat)}`;
                } else if (category.name === 'Ayurveda') {
                  // For Ayurveda subcategories, direct to /medicines with the subcategory param
                  href = `/medicines?category=ayurveda&subcategory=${encodeURIComponent(subcat)}`;
                } else if (category.name === 'Homeopathy') {
                  // For Homeopathy subcategories, direct to /medicines with the subcategory param
                  href = `/medicines?category=homeopathy&subcategory=${encodeURIComponent(subcat)}`;
                } else {
                  // For other categories (Nutrition, Personal Care, Fitness, etc.)
                  href = `/medicines?category=${encodeURIComponent(category.name.toLowerCase())}&subcategory=${encodeURIComponent(subcat)}`;
                }
                
                return (
                  <Link
                    key={subcat}
                    href={href}
                    className="text-xs text-gray-600 hover:text-emerald-700 block py-1"
                  >
                    {subcat}
                  </Link>
                );
              })}
              {category.subcategories.length > 6 && (
                <Link
                  href={category.href}
                  className="text-xs text-emerald-600 hover:text-orange-500 font-semibold py-1"
                >
                  View All →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop menu version - with hover dropdowns
  return (
    <div className="hidden md:flex gap-0 mt-4 text-sm text-gray-700 border-t border-gray-100 pt-3 flex-nowrap relative pb-2">
      {CATEGORIES.map((category) => (
        <div
          key={category.name}
          className="relative group"
          onMouseEnter={() => setHoveredCategory(category.name)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          {/* Category Button */}
          <Link
            href={category.href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${COLOR_STYLES[category.color].text} ${COLOR_STYLES[category.color].hover} hover:text-orange-500 flex-shrink-0`}
          >
            <span className="font-medium">{category.name}</span>
          </Link>

          {/* Dropdown Menu */}
          <div
            className={`absolute left-0 mt-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.25rem', width: 'fit-content', maxWidth: '500px' }}>
              {category.subcategories.map((subcat, idx) => {
                let href = '#';
                if (category.name === 'Medicines') {
                  href = `/medicines${
                    subcat !== 'All' ? `?subcategory=${encodeURIComponent(subcat)}` : ''
                  }`;
                } else if (category.name === 'Ayurveda') {
                  href = `/medicines?category=ayurveda${
                    subcat !== 'All' ? `&subcategory=${encodeURIComponent(subcat)}` : ''
                  }`;
                } else if (category.name === 'Homeopathy') {
                  href = `/medicines?category=homeopathy${
                    subcat !== 'All' ? `&subcategory=${encodeURIComponent(subcat)}` : ''
                  }`;
                } else {
                  // For other categories (Nutrition, Personal Care, Fitness, etc.)
                  href = `/medicines?category=${encodeURIComponent(category.name.toLowerCase())}${
                    subcat !== 'All' ? `&subcategory=${encodeURIComponent(subcat)}` : ''
                  }`;
                }
                
                return (
                  <Link
                    key={subcat}
                    href={href}
                    className={`text-center px-2 py-2 text-sm rounded transition-colors duration-150 ${
                      idx === 0
                        ? `${COLOR_STYLES[category.color].text} font-semibold col-span-full mb-2 pb-3 border-b border-gray-200 ${COLOR_STYLES[category.color].hover}`
                        : `text-gray-700 hover:${COLOR_STYLES[category.color].subcategoryBg} hover:rounded`
                    }`}
                  >
                    {subcat}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Other Navigation Links */}
      <Link
        href="/doctor-consultation"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:text-orange-500 hover:bg-emerald-50 font-medium transition-all flex-shrink-0"
      >
        Consult Doctor
      </Link>
      <Link
        href="/lab-tests"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:text-orange-500 hover:bg-emerald-50 font-medium transition-all flex-shrink-0"
      >
        Lab Tests
      </Link>
      <Link
        href="/wellness"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:text-orange-500 hover:bg-emerald-50 font-medium transition-all flex-shrink-0"
      >
        Wellness
      </Link>
    </div>
  );
}
