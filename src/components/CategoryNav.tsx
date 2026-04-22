'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Category {
  name: string;
  subcategories: string[];
  groupedSubcategories?: Record<string, string[]>;
  icon: string;
  color: string;
  href: string;
}

const AYURVEDA_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  Medicines: ['Himalaya', 'Organic India', 'Baidyanath', 'Dabur', 'Zandu', 'Charak', 'Aimil'],
  'Single Remedies': [
    'Ras & Sindoor',
    'Bhasm & Pishti',
    'Vati & Gutika & Guggulu',
    'Asava Arishta & Kadha',
    'Loha & Mandur',
    'Churan & Powder & Avleha & Pak',
    'Tailam & Ghrita',
    'Gold Items',
    'Special Tablets & Capsules',
    'Syrups & Tonics',
  ],
  'Herbal Food & Juices': ['Chyawanprash', 'Honey', 'Digestives', 'Herbal & Vegetable Juice'],
};

const HOMEOPATHY_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  Medicines: [
    'SBL',
    'Dr. Reckeweg (Germany)',
    'Willmar Schwabe (Germany)',
    'Adel Pekana (Germany)',
    'Willmar Schwabe India',
    'BJain',
    'R S Bhargava',
    'Baksons',
    'REPL',
    'New Life',
    'Special Tablets',
    'Cream & Ointment',
    'Special Liquid/Drops',
  ],
  Cosmetics: ['Hair Care', 'Skin Care', 'Oral Care'],
  Dilutions: ['3X', '6X', '3 CH', '6 CH', '12 CH', '30 CH', '200 CH', '1000 CH', '10M CH', '50M CH', 'CM CH'],
  'Mother Tinctures': ['SBL', 'Dr. Reckeweg (Germany)', 'Willmar Schwabe India', 'BJain'],
  Biochemic: ['SBL', 'Dr. Reckeweg (Germany)', 'BJain', 'Willmar Schwabe India'],
  'Bach Flower': ['Bach Flower Remedies', 'Bach Flower Kits'],
  'Homeopathy Kits': ['Homeopathy Kits'],
  Triturations: ['SBL', 'Dr. Reckeweg (Germany)', 'Willmar Schwabe India', 'BJain'],
  'Millesimal LM Potency': ['SBL', 'BJain'],
  'Bio Combination': ['SBL', 'Dr. Reckeweg (Germany)', 'BJain', 'Willmar Schwabe India', 'Haslab (HSL)'],
};

const NUTRITION_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Sports Nutrition': ['Proteins', 'Fat Burner', 'Weight Gainers', 'Pre Post Workout', 'Aminos', 'Creatines'],
  'Health Food & Drinks': ['Spreads & Sugar & Honey', 'Oils', 'Herbal & Vegetable Juices', 'Health Drinks', 'Healthy Snacks & Bars', 'Sugar Free', 'Murabba', 'Chyawanprash', 'Edible Seeds'],
  'Vitamin & Dietary Supplements': ['Vitamin & Dietary Supplements'],
  'Organic Products': ['Organic Foods', 'Coffee & Tea', 'Ghee', 'Atta/Flour'],
  'Green Teas': ['Green Teas'],
  Digestives: ['Digestives'],
};

const PERSONAL_CARE_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Aroma Oils': ['Essential Oils'],
  'Mens Grooming': ['Beard Oils and Wax', 'Shaving Cream & Gels', 'Men Wellness'],
  'Female Care': ['Intimate Care', 'Pregnancy & Maternity Care'],
  'Skin Care': ['Face', 'Body', 'Foot Care', 'Sanitizers & Hand Wash'],
  'Bath & Shower': ['Shower Gel & Hand Wash', 'Soaps', 'Talcs & Deos'],
  'Hair Care': ['Shampoo & Conditioners', 'Hair Oils & Creams', 'Hair Serum & Mask', 'Hair Color & Dyes', 'Henna Mehandi'],
  'Elderly Care': ['Elderly Care'],
  'Mosquito Repellents': ['Mosquito Repellents'],
  'Oral Care': ['Toothpaste', 'Gums Care'],
};

const FITNESS_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Supports & Splints': [
    'Shoulder Support',
    'Elbow Support',
    'Forearm Support',
    'Wrist Support',
    'Chest Support',
    'Cervical Support',
    'Back Support',
    'Abdominal Support',
    'Thigh Support',
    'Knee Support',
    'Calf Support',
    'Ankle Support',
    'Finger Splint',
    'Compression Stockings',
    'Insoles & Heel cups',
  ],
  'Health Devices': [
    'Weighing Scales',
    'BP Monitors',
    'Thermometer',
    'Respiratory Care',
    'Activity Moniter',
    'Hot and Cold Pads & Bottles',
  ],
  'Fitness Equipment': ['Exercisers', 'Weights'],
  'Hospital Supplies': ['Stethoscopes', 'Protective Gears', 'Hospital Beds'],
  'Aroma Therapy': ['Aroma Therapy'],
  'Disability Aids': ['Disability Aids'],
  Massagers: ['Massagers'],
  'Bandages & Tapes': ['Bandages & Tapes'],
  'Walking Sticks': ['Walking Sticks'],
};

const UNANI_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Unani Medicines': ['Unani Medicines'],
  'Habbe & Qurs': ['Habbe & Qurs'],
  'Majun & Jawarish': ['Majun & Jawarish'],
  'Safoof, Labub & Kushta': ['Safoof, Labub & Kushta'],
  'Sharbat, Sirka & Arq': ['Sharbat, Sirka & Arq'],
  'Lauq & Saoot': ['Lauq & Saoot'],
  'Khamira & Itrifal': ['Khamira & Itrifal'],
  'Roghan & Oils': ['Roghan & Oils'],
  'Unani Brands': ['Hamdard', 'New Shama', 'Dehlvi', 'Rex'],
};

const BABY_CARE_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Tonics & Supplements': ['Tonics & Supplements'],
  'Bath & Skin': ['Shampoos & Bath Gels', 'Baby Oils', 'Baby Powder', 'Soaps'],
  'Wipes & Diapers': ['Wipes & Diapers'],
  'Gift Packs': ['Gift Packs'],
};

const SEXUAL_WELLNESS_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  'Sexual Wellness': ['Supplements', 'Condoms'],
};

const DISEASE_GROUPED_SUBCATEGORIES: Record<string, string[]> = {
  Mind: ['Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory'],
  Face: ['Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging'],
  Hair: ['Hair Fall', 'Dandruff', 'Alopecia & Bald Patches', 'Premature Graying', 'Lice'],
  'Eyes & Ear': ['Conjunctivitis', 'Cataract', 'Eye Strain', 'Glaucoma', 'Styes', 'Ear Pain', 'Ear Wax'],
  'Nose & Throat': ['Allergic Rhinitis', 'Sneezing & Running Nose', 'Sinusitis & Blocked Nose', 'Snoring', 'Tonsillitis & Throat Pain', 'Laryngitis & Hoarse Voice'],
  'Nervous System': ['Headache & Migraine', 'Vertigo/Motion Sickness', 'Neuralgia & Nerve Pain', 'Epilepsy & Fits'],
  'Mouth, Gums & Teeth': ['Bad Breath', 'Bleeding Gum/Pyorrhea', 'Mouth Ulcers/Aphthae', 'Cavities & Tooth Pain', 'Stammering'],
  Respiratory: ['Asthma', 'Bronchitis', 'Cough', 'Pneumonia'],
  'Rectum & Piles': ['Constipation', 'Piles & Fissures', 'Loose Motions/Diarrhoea', 'IBS & Colitis', 'Fistula', 'Worms'],
  'Digestive System': ['Indigestion/Acidity/Gas', 'Loss of Appetite', 'Jaundice & Fatty Liver', 'Stomach Pain & Colic', 'Vomiting & Nausea', 'Gall Stones', 'Appendicitis', 'Hernia'],
  'Heart & Cardiovascular': ['Heart Tonics', 'Chest Pain & Angina', 'Cholesterol & Triglyceride'],
  'Urinary System': ['Urinary Tract Infection', 'Kidney Stone', 'Frequent Urination'],
  'Bone, Joint & Muscles': ['Arthritis & Joint Pains', 'Back & Knee Pain', 'Cervical Spondylosis', 'Injuries & Fractures', 'Gout & Uric Acid', 'Osteoporosis', 'Sciatica', 'Heel Pain'],
  'Skin & Nails': ['Bed Sores', 'Boils & Abscesses', 'Burns', 'Cyst & Tumor', 'Eczema', 'Herpes', 'Nail Fungus', 'Psoriasis & Dry Skin', 'Rash/Itch/Urticaria/Hives', 'Vitiligo & Leucoderma', 'Warts & Corns'],
  'Fevers & Flu': ['Dengue', 'Flu & Fever', 'Malaria', 'Typhoid'],
  'Male Problems': ['Hydrocele', 'Premature Ejaculation', 'Impotency', 'Prostate Enlargement'],
  'Female Problems': ['Underdeveloped Breasts', 'Enlarged Breasts', 'Leucorrhoea', 'Excessive Menses', 'Vaginitis', 'Menopause', 'Painful, Delayed & Scanty Menses'],
  'Old Age Problems': ['Parkinsons & Trembling', 'Involuntary Urination', 'Alzheimers'],
  'Children Problems': ['Low Height', 'Autism', 'Bed Wetting', 'Immunity', 'Teething Troubles', 'Irritability & Hyperactive'],
  'Lifestyle Diseases': ['Diabetes', 'Blood Pressure', 'Obesity', 'Thyroid', 'Hang Over', 'Varicose Veins'],
  Tonics: ['Anaemia', 'Blood Purifiers', 'General Tonics', 'Weakness & Fatigue'],
};

const flattenSubcategories = (groupedSubcategories: Record<string, string[]>) =>
  Object.values(groupedSubcategories).flat();

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
    subcategories: ['All', ...flattenSubcategories(AYURVEDA_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: AYURVEDA_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Homeopathy',
    icon: '🌸',
    color: 'emerald',
    href: '/homeopathy',
    subcategories: ['All', ...flattenSubcategories(HOMEOPATHY_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: HOMEOPATHY_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Nutrition',
    icon: '🥗',
    color: 'green',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(NUTRITION_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: NUTRITION_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Personal Care',
    icon: '🧴',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(PERSONAL_CARE_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: PERSONAL_CARE_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Fitness',
    icon: '💪',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(FITNESS_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: FITNESS_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Sexual Wellness',
    icon: '💑',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(SEXUAL_WELLNESS_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: SEXUAL_WELLNESS_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Disease',
    icon: '🌾',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(DISEASE_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: DISEASE_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Unani',
    icon: '⚗️',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(UNANI_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: UNANI_GROUPED_SUBCATEGORIES,
  },
  {
    name: 'Baby Care',
    icon: '👶',
    color: 'emerald',
    href: '/medicines',
    subcategories: ['All', ...flattenSubcategories(BABY_CARE_GROUPED_SUBCATEGORIES)],
    groupedSubcategories: BABY_CARE_GROUPED_SUBCATEGORIES,
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

  const buildHref = (path: string, params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return `${path}${query ? `?${query}` : ''}#products-section`;
  };

  const getSubcategoryHref = (categoryName: string, subcategoryName: string) => {
    if (categoryName === 'Medicines') {
      return buildHref('/medicines', { subcategory: subcategoryName });
    }

    if (categoryName === 'Ayurveda') {
      return buildHref('/ayurveda', { category: subcategoryName });
    }

    if (categoryName === 'Homeopathy') {
      return buildHref('/homeopathy', { category: subcategoryName });
    }

    if (categoryName === 'Disease') {
      // For Disease, use category param with the disease category name
      return buildHref('/medicines', { category: 'disease', subcategory: subcategoryName });
    }

    // For all other categories (Nutrition, Personal Care, Fitness, etc.)
    return buildHref('/medicines', { category: categoryName.toLowerCase(), subcategory: subcategoryName });
  };

  const getCategoryHref = (category: Category) => {
    if (category.name === 'Medicines') return buildHref('/medicines');
    if (category.name === 'Ayurveda') return buildHref('/ayurveda');
    if (category.name === 'Homeopathy') return buildHref('/homeopathy');

    if (category.groupedSubcategories) {
      return buildHref('/medicines', { category: category.name.toLowerCase() });
    }

    return buildHref(category.href);
  };

  if (isMobile) {
    // Mobile menu version - expanded categories
    return (
      <div className="space-y-2 pb-2">
        {CATEGORIES.map((category) => (
          <div key={category.name} className="border-b border-gray-100">
            <Link
              href={getCategoryHref(category)}
              className="flex items-center gap-2 py-2 text-emerald-700 hover:text-orange-500 font-medium"
            >
              <span>{category.name}</span>
            </Link>
            <div className="pl-6 space-y-1">
              {category.subcategories.slice(1, 6).map((subcat) => {
                return (
                  <Link
                    key={subcat}
                    href={getSubcategoryHref(category.name, subcat)}
                    className="text-xs text-gray-600 hover:text-emerald-700 block py-1"
                  >
                    {subcat}
                  </Link>
                );
              })}
              {category.subcategories.length > 6 && (
                <Link
                  href={getCategoryHref(category)}
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
            href={getCategoryHref(category)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${COLOR_STYLES[category.color].text} ${COLOR_STYLES[category.color].hover} hover:text-orange-500 shrink-0`}
          >
            <span className="font-medium">{category.name}</span>
          </Link>

          {/* Dropdown Menu */}
          <div
            className={`absolute left-0 mt-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}
          >
            {category.groupedSubcategories ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5" style={{ width: '780px', maxWidth: '80vw' }}>
                <h3 className={`text-base font-semibold mb-4 pb-3 border-b border-gray-200 ${COLOR_STYLES[category.color].text}`}>
                  {category.name}
                </h3>
                <div className="overflow-x-auto pb-1">
                  <div
                    className="grid gap-4 overflow-y-auto pr-1"
                    style={{
                      gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))',
                      minWidth: '900px',
                      maxHeight: '440px',
                    }}
                  >
                    {Object.entries(category.groupedSubcategories).map(([groupName, subcats]) => (
                      <div key={groupName} className="min-w-0">
                        <Link
                          href={getSubcategoryHref(category.name, groupName)}
                          className={`block text-sm font-semibold mb-2 ${COLOR_STYLES[category.color].text} hover:text-orange-500 truncate`}
                        >
                          {groupName}
                        </Link>
                        <div className="space-y-1">
                          {subcats.map((subcat) => (
                            <Link
                              key={`${groupName}-${subcat}`}
                              href={getSubcategoryHref(category.name, subcat)}
                              className="block text-xs text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                            >
                              {subcat}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.25rem', width: 'fit-content', maxWidth: '500px' }}>
                {category.subcategories.map((subcat, idx) => (
                  <Link
                    key={subcat}
                    href={subcat === 'All' ? getCategoryHref(category) : getSubcategoryHref(category.name, subcat)}
                    className={`text-center px-2 py-2 text-sm rounded transition-colors duration-150 ${
                      idx === 0
                        ? `${COLOR_STYLES[category.color].text} font-semibold col-span-full mb-2 pb-3 border-b border-gray-200 ${COLOR_STYLES[category.color].hover}`
                        : `text-gray-700 hover:${COLOR_STYLES[category.color].subcategoryBg} hover:rounded`
                    }`}
                  >
                    {subcat}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Other Navigation Links */}
      <Link
        href="/doctor-consultation"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:text-orange-500 hover:bg-emerald-50 font-medium transition-all shrink-0"
      >
        Consult Doctor
      </Link>
      <Link
        href="/lab-tests"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-700 hover:text-orange-500 hover:bg-emerald-50 font-medium transition-all shrink-0"
      >
        Lab Tests
      </Link>
    </div>
  );
}
