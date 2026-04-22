'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useImageUpload } from '@/lib/hooks/useImageUpload';

// ── Types ────────────────────────────────────────────────────────────────────
interface Medicine {
  _id: string;
  vendorId?: string | null;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  potency?: string;
  quantity?: number;
  quantityUnit?: string;
  diseaseCategory?: string;
  diseaseSubcategory?: string;
  productType?: string;
  vendorName?: string;
  price: number;
  mrp?: number;
  icon?: string;
  benefit?: string;
  stock: number;
  description: string;
  safetyInformation?: string;
  specifications?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  requiresPrescription?: boolean;
  isActive: boolean;
  isPopular?: boolean;
  isPopularGeneric?: boolean;
  isPopularAyurveda?: boolean;
  isPopularHomeopathy?: boolean;
  isPopularLabTests?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface LabTest {
  _id: string;
  name: string;
  category: string;
  price: number;
  mrp?: number;
  description?: string;
  icon?: string;
  image?: string;
  duration?: string;
  testsIncluded?: string;
  popular?: boolean;
  isPopularLabTests?: boolean;
  isActive: boolean;
}

interface DynamicCategoryConfig {
  vendorCategoryMap?: Record<string, string[]>;
  subcategoryMapByType?: Record<string, Record<string, string[]>>;
  diseaseSubcategoryMap?: Record<string, string[]>;
  labCategories?: string[];
}

const PROD_CATEGORIES = ['Disease', 'Homeopathy', 'Ayurveda', 'Nutrition', 'Personal Care', 'Baby Care', 'Sexual Wellness', 'Fitness', 'Consultation', 'Unani', 'Allopathy'];
const LAB_CATEGORIES = ['General', 'Diabetes', 'Cardiac', 'Thyroid', 'Liver', 'Kidney', 'Vitamins', 'Infection', 'Women'];
const POTENCY_OPTIONS = ['1000 CH', '3 CH', '10M CH', '200 CH', '30 CH', '12 CH', '6 CH', 'CM CH', '50M CH'];
const QUANTITY_UNIT_OPTIONS = ['None', 'BAGS (Bag)', 'BOTTLES (Btl)', 'BOX (Box)', 'BUNDLES (Bdl)', 'CANS (Can)', 'CAPSULES (CAPS)', 'CARTONS (Ctn)', 'DOZENS (Dzn)', 'GRAMMES (Gm)', 'KILOGRAMS (Kg)', 'LITRE (Ltr)', 'METERS (Mtr)', 'MILILITRE (MI)', 'NUMBERS (Nos)', 'PACKS (Pac)', 'PAIRS (Prs)', 'PIECES (Pcs)', 'QUINTAL (Qtl)', 'ROLLS (Rol)', 'SACHET (SACH)', 'SQUARE FEET (Sqf)', 'SQUARE METERS (Sqm)', 'TABLETS (Tbs)'];

const HOMEOPATHY_SUBCATEGORY_MAP = {
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
} as const;

type HomeopathyCategory = keyof typeof HOMEOPATHY_SUBCATEGORY_MAP;

const AYURVEDA_SUBCATEGORY_MAP = {
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
} as const;

type AyurvedaCategory = keyof typeof AYURVEDA_SUBCATEGORY_MAP;

const NUTRITION_SUBCATEGORY_MAP = {
  'Sports Nutrition': ['Proteins', 'Fat Burner', 'Weight Gainers', 'Pre Post Workout', 'Aminos', 'Creatines'],
  'Health Food & Drinks': ['Spreads & Sugar & Honey', 'Oils', 'Herbal & Vegetable Juices', 'Health Drinks', 'Healthy Snacks & Bars', 'Sugar Free', 'Murabba', 'Chyawanprash', 'Edible Seeds'],
  'Vitamin & Dietary Supplements': ['Vitamin & Dietary Supplements'],
  'Organic Products': ['Organic Foods', 'Coffee & Tea', 'Ghee', 'Atta/Flour'],
  'Green Teas': ['Green Teas'],
  Digestives: ['Digestives'],
} as const;

type NutritionCategory = keyof typeof NUTRITION_SUBCATEGORY_MAP;

const PERSONAL_CARE_SUBCATEGORY_MAP = {
  'Aroma Oils': ['Essential Oils'],
  'Mens Grooming': ['Beard Oils and Wax', 'Shaving Cream & Gels', 'Men Wellness'],
  'Female Care': ['Intimate Care', 'Pregnancy & Maternity Care'],
  'Skin Care': ['Face', 'Body', 'Foot Care', 'Sanitizers & Hand Wash'],
  'Bath & Shower': ['Shower Gel & Hand Wash', 'Soaps', 'Talcs & Deos'],
  'Hair Care': ['Shampoo & Conditioners', 'Hair Oils & Creams', 'Hair Serum & Mask', 'Hair Color & Dyes', 'Henna Mehandi'],
  'Elderly Care': ['Elderly Care'],
  'Mosquito Repellents': ['Mosquito Repellents'],
  'Oral Care': ['Toothpaste', 'Gums Care'],
} as const;

type PersonalCareCategory = keyof typeof PERSONAL_CARE_SUBCATEGORY_MAP;

const BABY_CARE_SUBCATEGORY_MAP = {
  'Tonics & Supplements': ['Tonics & Supplements'],
  'Bath & Skin': ['Shampoos & Bath Gels', 'Baby Oils', 'Baby Powder', 'Soaps'],
  'Wipes & Diapers': ['Wipes & Diapers'],
  'Gift Packs': ['Gift Packs'],
} as const;

type BabyCareCategory = keyof typeof BABY_CARE_SUBCATEGORY_MAP;

const FITNESS_SUBCATEGORY_MAP = {
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
} as const;

type FitnessCategory = keyof typeof FITNESS_SUBCATEGORY_MAP;

const UNANI_SUBCATEGORY_MAP = {
  'Unani Medicines': ['Unani Medicines'],
  'Habbe & Qurs': ['Habbe & Qurs'],
  'Majun & Jawarish': ['Majun & Jawarish'],
  'Safoof, Labub & Kushta': ['Safoof, Labub & Kushta'],
  'Sharbat, Sirka & Arq': ['Sharbat, Sirka & Arq'],
  'Lauq & Saoot': ['Lauq & Saoot'],
  'Khamira & Itrifal': ['Khamira & Itrifal'],
  'Roghan & Oils': ['Roghan & Oils'],
  'Unani Brands': ['Hamdard', 'New Shama', 'Dehlvi', 'Rex'],
} as const;

type UnaniCategory = keyof typeof UNANI_SUBCATEGORY_MAP;

const DISEASE_SUBCATEGORY_MAP = {
  Mind: ['Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory'],
  Face: ['Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging'],
  Hair: ['Hair Fall', 'Dandruff', 'Alopecia & Bald Patches', 'Premature Graying', 'Lice'],
  'Eyes & Ear': ['Conjunctivitis', 'Cataract', 'Eye Strain', 'Glaucoma', 'Styes', 'Ear Pain', 'Ear Wax'],
  'Nose & Throat': ['Allergic Rhinitis', 'Sneezing & Running Nose', 'Sinusitis & Blocked Nose', 'Snoring', 'Tonsilitis & Throat Pain', 'Laryngitis & Hoarse Voice'],
  'Nervous System': ['Headache & Migraine', 'Vertigo/Motion Sickness', 'Neuralgia & Nerve Pain', 'Epilepsy & Fits'],
  'Mouth, Gums & Teeth': ['Bad Breath', 'Bleeding Gum/Pyorrhoea', 'Mouth Ulcers/Aphthae', 'Cavities & Tooth Pain', 'Stammering'],
  Respiratory: ['Asthma', 'Bronchitis', 'Cough', 'Pneumonia'],
  'Rectum & Piles': ['Constipation', 'Piles & Fissures', 'Loose Motions/Diarrhoea', 'IBS & Colitis', 'Fistula', 'Worms'],
  'Digestive System': ['Indigestion/Acidity/Gas', 'Loss of Appetite', 'Jaundice & Fatty Liver', 'Stomach Pain & Colic', 'Vomiting & Nausea', 'Gall Stones', 'Appendicitis', 'Hernia'],
  'Heart & Cardiovascular': ['Heart Tonics', 'Chest Pain & Angina', 'Cholesterol & Triglyceride'],
  'Urinary System': ['Urinary Tract Infection', 'Kidney Stone', 'Frequent Urination'],
  'Bone, Joint & Muscles': ['Arthritis & Joint Pains', 'Back & Knee Pain', 'Cervical Spondolyisis', 'Injuries & Fractures', 'Gout & Uric Acid', 'Osteoporosis', 'Sciatica', 'Heel Pain'],
  'Skin & Nails': ['Bed Sores', 'Boils & Abscesses', 'Burns', 'Cyst & Tumor', 'Eczema', 'Herpes', 'Nail Fungus', 'Psoriasis & Dry Skin', 'Rash/Itch/Urticaria/Hives', 'Vitiligo & Leucoderma', 'Warts & Corns'],
  'Fevers & Flu': ['Dengue', 'Flu & Fever', 'Malaria', 'Typhoid'],
  'Male Problems': ['Hydrocele', 'Premature Ejaculation', 'Impotency', 'Prostate Enlargement'],
  'Female Problems': ['Underdeveloped Breasts', 'Enlarged Breasts', 'Leucorrhoea', 'Excessive Menses', 'Vaginitis', 'Menopause', 'Painful, Delayed & Scanty Menses'],
  'Old Age Problems': ['Parkinsons & Trembling', 'Involuntary Urination', 'Alzheimers'],
  'Children Problems': ['Low Height', 'Autism', 'Bed Wetting', 'Immunity', 'Teething Troubles', 'Irritability & Hyperactive'],
  'Lifestyle Diseases': ['Diabetes', 'Blood Pressure', 'Obesity', 'Thyroid', 'Hang Over', 'Varicose Veins'],
  Tonics: ['Anaemia', 'Blood Purifiers', 'General Tonics', 'Weakness & Fatigue'],
} as const;

type DiseaseCategory = keyof typeof DISEASE_SUBCATEGORY_MAP;

// Vendor category map (same structure as vendor dashboard)
const VENDOR_CATEGORY_MAP = {
  'Generic Medicine': [
    // Disease Categories
    'Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory',
    'Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging',
    'Hair Fall', 'Dandruff', 'Alopecia & Bald Patches', 'Premature Graying', 'Lice',
    'Conjunctivitis', 'Cataract', 'Eye Strain', 'Glaucoma', 'Styes', 'Ear Pain', 'Ear Wax',
    'Allergic Rhinitis', 'Sneezing & Running Nose', 'Sinusitis & Blocked Nose', 'Snoring', 'Tonsillitis & Throat Pain', 'Laryngitis & Hoarse Voice',
    'Headache & Migraine', 'Vertigo/Motion Sickness', 'Neuralgia & Nerve Pain', 'Epilepsy & Fits',
    'Bad Breath', 'Bleeding Gum/Pyorrhea', 'Mouth Ulcers/Aphthae', 'Cavities & Tooth Pain', 'Stammering',
    'Asthma', 'Bronchitis', 'Cough', 'Pneumonia',
    'Constipation', 'Piles & Fissures', 'Loose Motions/Diarrhoea', 'IBS & Colitis', 'Fistula', 'Worms',
    'Indigestion/Acidity/Gas', 'Loss of Appetite', 'Jaundice & Fatty Liver', 'Stomach Pain & Colic', 'Vomiting & Nausea', 'Gall Stones', 'Appendicitis', 'Hernia',
    'Heart Tonics', 'Chest Pain & Angina', 'Cholesterol & Triglyceride',
    'Urinary Tract Infection', 'Kidney Stone', 'Frequent Urination',
    'Arthritis & Joint Pains', 'Back & Knee Pain', 'Cervical Spondylosis', 'Injuries & Fractures', 'Gout & Uric Acid', 'Osteoporosis', 'Sciatica', 'Heel Pain',
    'Bed Sores', 'Boils & Abscesses', 'Burns', 'Cyst & Tumor', 'Eczema', 'Herpes', 'Nail Fungus', 'Psoriasis & Dry Skin', 'Rash/Itch/Urticaria/Hives', 'Vitiligo & Leucoderma', 'Warts & Corns',
    'Dengue', 'Flu & Fever', 'Malaria', 'Typhoid',
    'Hydrocele', 'Premature Ejaculation', 'Impotency', 'Prostate Enlargement',
    'Underdeveloped Breasts', 'Enlarged Breasts', 'Leucorrhoea', 'Excessive Menses', 'Vaginitis', 'Menopause', 'Painful, Delayed & Scanty Menses',
    'Low Height', 'Autism', 'Bed Wetting', 'Immunity', 'Teething Troubles', 'Irritability & Hyperactive',
    'Diabetes', 'Blood Pressure', 'Obesity', 'Thyroid', 'Hang Over', 'Varicose Veins',
    'Parkinsons & Trembling', 'Involuntary Urination', 'Alzheimers',
    'Anaemia', 'Blood Purifiers', 'General Tonics', 'Weakness & Fatigue',
    // Allopathy Brands
    'Sun Pharma', 'Cipla', 'Lupin', 'Pfizer', 'Abbott', 'Mankind Pharma', 'Dr. Reddys', 'Glenmark Pharma',
    // Allopathic Medicines
    'Tablets & Capsules', 'Syrups & Suspensions', 'Creams & Ointments', 'Inhalers & Respules', 'Oral Drops', 'Eye & Ear Drops', 'Nasal Drops & Spray', 'Injections & Infusions',
  ],
  'Ayurveda Medicine': [
    'Medicines',
    'Single Remedies',
    'Herbal Food & Juices',
  ],
  Homeopathy: [
    'Medicines',
    'Cosmetics',
    'Dilutions',
    'Mother Tinctures',
    'Biochemic',
    'Bach Flower',
    'Homeopathy Kits',
    'Triturations',
    'Millesimal LM Potency',
    'Bio Combination',
  ],
  'Lab Tests': [
    'General', 'Diabetes', 'Cardiac', 'Thyroid', 'Liver', 'Kidney', 'Vitamins', 'Infection', 'Women',
  ],
  Disease: [
    'Addiction', 'Anxiety & Depression', 'Sleeplessness', 'Weak Memory',
    'Acne & Pimples', 'Dark Circles & Marks', 'Wrinkles & Aging',
    'Hair Fall', 'Dandruff', 'Alopecia & Bald Patches', 'Premature Graying', 'Lice',
    'Conjunctivitis', 'Cataract', 'Eye Strain', 'Glaucoma', 'Styes', 'Ear Pain', 'Ear Wax',
    'Allergic Rhinitis', 'Sneezing & Running Nose', 'Sinusitis & Blocked Nose', 'Snoring', 'Tonsillitis & Throat Pain', 'Laryngitis & Hoarse Voice',
    'Headache & Migraine', 'Vertigo/Motion Sickness', 'Neuralgia & Nerve Pain', 'Epilepsy & Fits',
    'Bad Breath', 'Bleeding Gum/Pyorrhea', 'Mouth Ulcers/Aphthae', 'Cavities & Tooth Pain', 'Stammering',
    'Asthma', 'Bronchitis', 'Cough', 'Pneumonia',
    'Constipation', 'Piles & Fissures', 'Loose Motions/Diarrhoea', 'IBS & Colitis', 'Fistula', 'Worms',
    'Indigestion/Acidity/Gas', 'Loss of Appetite', 'Jaundice & Fatty Liver', 'Stomach Pain & Colic', 'Vomiting & Nausea', 'Gall Stones', 'Appendicitis', 'Hernia',
    'Heart Tonics', 'Chest Pain & Angina', 'Cholesterol & Triglyceride',
    'Urinary Tract Infection', 'Kidney Stone', 'Frequent Urination',
    'Arthritis & Joint Pains', 'Back & Knee Pain', 'Cervical Spondylosis', 'Injuries & Fractures', 'Gout & Uric Acid', 'Osteoporosis', 'Sciatica', 'Heel Pain',
    'Bed Sores', 'Boils & Abscesses', 'Burns', 'Cyst & Tumor', 'Eczema', 'Herpes', 'Nail Fungus', 'Psoriasis & Dry Skin', 'Rash/Itch/Urticaria/Hives', 'Vitiligo & Leucoderma', 'Warts & Corns',
    'Dengue', 'Flu & Fever', 'Malaria', 'Typhoid',
    'Hydrocele', 'Premature Ejaculation', 'Impotency', 'Prostate Enlargement',
    'Underdeveloped Breasts', 'Enlarged Breasts', 'Leucorrhoea', 'Excessive Menses', 'Vaginitis', 'Menopause', 'Painful, Delayed & Scanty Menses',
    'Low Height', 'Autism', 'Bed Wetting', 'Immunity', 'Teething Troubles', 'Irritability & Hyperactive',
    'Diabetes', 'Blood Pressure', 'Obesity', 'Thyroid', 'Hang Over', 'Varicose Veins',
    'Parkinsons & Trembling', 'Involuntary Urination', 'Alzheimers',
    'Anaemia', 'Blood Purifiers', 'General Tonics', 'Weakness & Fatigue',
  ],
  Nutrition: [
    'Sports Nutrition',
    'Health Food & Drinks',
    'Vitamin & Dietary Supplements',
    'Organic Products',
    'Green Teas',
    'Digestives',
  ],
  'Personal Care': [
    'Aroma Oils',
    'Mens Grooming',
    'Female Care',
    'Skin Care',
    'Bath & Shower',
    'Hair Care',
    'Elderly Care',
    'Mosquito Repellents',
    'Oral Care',
  ],
  Fitness: [
    'Supports & Splints',
    'Health Devices',
    'Fitness Equipment',
    'Hospital Supplies',
    'Aroma Therapy',
    'Disability Aids',
    'Massagers',
    'Bandages & Tapes',
    'Walking Sticks',
  ],
  'Sexual Wellness': [
    'Supplements', 'Condoms',
  ],
  Consultation: [
    'Homeo Treatment', 'Ayurveda Treatment', 'Unani Treatment', 'Diet Counselling',
  ],
  Unani: [
    'Unani Medicines',
    'Habbe & Qurs',
    'Majun & Jawarish',
    'Safoof, Labub & Kushta',
    'Sharbat, Sirka & Arq',
    'Lauq & Saoot',
    'Khamira & Itrifal',
    'Roghan & Oils',
    'Unani Brands',
  ],
  'Baby Care': [
    'Tonics & Supplements',
    'Bath & Skin',
    'Wipes & Diapers',
    'Gift Packs',
  ],
} as const;

type VendorProductType = keyof typeof VENDOR_CATEGORY_MAP;

const FEATURED_CARD_COLORS = [
  '#ffffff',
  '#fef3c7',
  '#fee2e2',
  '#dbeafe',
  '#dcfce7',
  '#f3e8ff',
  '#fce7f3',
  '#ecfeff',
];

const getRandomFeaturedCardColor = () =>
  FEATURED_CARD_COLORS[Math.floor(Math.random() * FEATURED_CARD_COLORS.length)];

function getDefaultCategoryForType(productType: VendorProductType): string {
  return VENDOR_CATEGORY_MAP[productType][0];
}

const EMPTY_PROD = { name: '', brand: '', category: '', subcategory: '', potency: '', quantity: '', quantityUnit: 'None', diseaseCategory: '', diseaseSubcategory: '', price: '', mrp: '', stock: '', description: '', safetyInformation: '', specifications: '', benefit: '', requiresPrescription: false, image: '', isPopular: false, productType: 'Generic Medicine' as VendorProductType, isPopularGeneric: false, isPopularAyurveda: false, isPopularHomeopathy: false, isPopularLabTests: false };
const EMPTY_LAB  = { name: '', category: '', price: '', mrp: '', description: '', icon: '', duration: '', testsIncluded: '', popular: false };

/**
 * Extract public ID from Cloudinary URL
 * URL format: https://res.cloudinary.com/df4x2ygkw/image/upload/v123456/medicines/abc123.webp
 * Returns: medicines/abc123
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/([^/]+\/[^/]+)\.[^.]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export default function AdminMedicines() {
  const [tab, setTab] = useState<'products' | 'labtests'>('products');
  const { uploadImage, uploading: imageUploading, error: uploadError, previewUrl } = useImageUpload();

  // ── Products state ────────────────────────────────────────────────────────
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [medCatFilter, setMedCatFilter] = useState('All');
  const [medApprovalFilter, setMedApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showProdForm, setShowProdForm] = useState(false);
  const [editMed, setEditMed] = useState<Medicine | null>(null);
  const [prodForm, setProdForm] = useState(EMPTY_PROD);
  const [medLoading, setMedLoading] = useState(true);
  const [medSaving, setMedSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [featureSubmittingId, setFeatureSubmittingId] = useState<string | null>(null);

  // ── Lab Tests state ───────────────────────────────────────────────────────
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labSearch, setLabSearch] = useState('');
  const [showLabForm, setShowLabForm] = useState(false);
  const [editLab, setEditLab] = useState<LabTest | null>(null);
  const [labForm, setLabForm] = useState(EMPTY_LAB);
  const [labLoading, setLabLoading] = useState(false);
  const [labSaving, setLabSaving] = useState(false);
  const [labImageUrl, setLabImageUrl] = useState('');

  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [categoryConfig, setCategoryConfig] = useState<DynamicCategoryConfig | null>(null);

  const activeVendorCategoryMap: Record<string, string[]> =
    categoryConfig?.vendorCategoryMap && Object.keys(categoryConfig.vendorCategoryMap).length > 0
      ? categoryConfig.vendorCategoryMap
      : (VENDOR_CATEGORY_MAP as unknown as Record<string, string[]>);

  const activeDiseaseCategoryMap: Record<string, string[]> =
    categoryConfig?.diseaseSubcategoryMap && Object.keys(categoryConfig.diseaseSubcategoryMap).length > 0
      ? categoryConfig.diseaseSubcategoryMap
      : (DISEASE_SUBCATEGORY_MAP as unknown as Record<string, string[]>);

  const activeLabCategories: string[] =
    categoryConfig?.labCategories && categoryConfig.labCategories.length > 0
      ? categoryConfig.labCategories
      : [...LAB_CATEGORIES];

  const productTypeOptions = Object.keys(activeVendorCategoryMap) as VendorProductType[];

  const getDefaultCategoryForTypeDynamic = (productType: VendorProductType): string => {
    const options = activeVendorCategoryMap[productType] || [];
    return options[0] || getDefaultCategoryForType(productType);
  };

  const getSubcategoryOptionsForType = (productType: string, category: string): string[] => {
    const dynamicByType = categoryConfig?.subcategoryMapByType?.[productType]?.[category];
    if (dynamicByType && dynamicByType.length > 0) return dynamicByType;

    if (productType === 'Homeopathy') return (HOMEOPATHY_SUBCATEGORY_MAP[category as HomeopathyCategory] || []) as unknown as string[];
    if (productType === 'Ayurveda Medicine') return (AYURVEDA_SUBCATEGORY_MAP[category as AyurvedaCategory] || []) as unknown as string[];
    if (productType === 'Nutrition') return (NUTRITION_SUBCATEGORY_MAP[category as NutritionCategory] || []) as unknown as string[];
    if (productType === 'Personal Care') return (PERSONAL_CARE_SUBCATEGORY_MAP[category as PersonalCareCategory] || []) as unknown as string[];
    if (productType === 'Baby Care') return (BABY_CARE_SUBCATEGORY_MAP[category as BabyCareCategory] || []) as unknown as string[];
    if (productType === 'Fitness') return (FITNESS_SUBCATEGORY_MAP[category as FitnessCategory] || []) as unknown as string[];
    if (productType === 'Unani') return (UNANI_SUBCATEGORY_MAP[category as UnaniCategory] || []) as unknown as string[];

    return [];
  };

  const getDefaultSubcategoryForTypeDynamic = (productType: string, category: string): string => {
    const options = getSubcategoryOptionsForType(productType, category);
    return options[0] || '';
  };

  // ── Fetch products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setMedLoading(true);
    try {
      const q = new URLSearchParams({ limit: '200' });
      if (medSearch) q.set('search', medSearch);
      const res = await fetch(`/api/admin/products?${q}`);
      const data = await res.json();
      setMedicines(data.products || []);
    } catch {}
    setMedLoading(false);
  }, [medSearch]);

  // ── Fetch lab tests ───────────────────────────────────────────────────────
  const fetchLabTests = useCallback(async () => {
    setLabLoading(true);
    try {
      const q = new URLSearchParams({ limit: '200', productType: 'Lab Tests' });
      if (labSearch) q.set('search', labSearch);
      const res = await fetch(`/api/admin/products?${q}`);
      const data = await res.json();
      setLabTests(data.products || []);
    } catch {}
    setLabLoading(false);
  }, [labSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchLabTests(); }, [fetchLabTests]);
  useEffect(() => {
    const fetchCategoryConfig = async () => {
      try {
        const res = await fetch('/api/categories?mode=config');
        const data = await res.json();
        if (data?.success && data?.config) {
          setCategoryConfig(data.config);
        }
      } catch {}
    };

    fetchCategoryConfig();
  }, []);

  // ── Seed ──────────────────────────────────────────────────────────────────
  const seedAll = async (force = false) => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch(`/api/seed${force ? '?force=true' : ''}`, { method: 'POST' });
      const data = await res.json();
      if (data.seeded) setSeedMsg(`Seeded ${data.seeded.products} products + ${data.seeded.labTests} lab tests`);
      else setSeedMsg(data.message || 'Already seeded');
      await fetchProducts();
      await fetchLabTests();
    } catch { setSeedMsg('Seed failed'); }
    setSeeding(false);
  };

  // ── Product CRUD ──────────────────────────────────────────────────────────
  const openAddProd = () => { setEditMed(null); setProdForm(EMPTY_PROD); setImages([]); setShowProdForm(true); };
  const openEditProd = (m: Medicine) => {
    setEditMed(m);
    const productType = (m.productType as VendorProductType) || 'Generic Medicine';
    const isHomeopathy = productType === 'Homeopathy';
    const isAyurveda = productType === 'Ayurveda Medicine';
    const isNutrition = productType === 'Nutrition';
    const isPersonalCare = productType === 'Personal Care';
    const isBabyCare = productType === 'Baby Care';
    const isFitness = productType === 'Fitness';
    const isUnani = productType === 'Unani';
    setProdForm({ name: m.name, brand: m.brand || '', category: m.category, subcategory: isHomeopathy ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isAyurveda ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isNutrition ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isPersonalCare ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isBabyCare ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isFitness ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : isUnani ? (m.subcategory || getDefaultSubcategoryForTypeDynamic(productType, m.category)) : '', potency: m.potency || '', quantity: m.quantity !== undefined ? String(m.quantity) : '', quantityUnit: m.quantityUnit || 'None', diseaseCategory: (m as any).diseaseCategory || '', diseaseSubcategory: (m as any).diseaseSubcategory || '', price: String(m.price), mrp: String(m.mrp || ''), stock: String(m.stock), description: m.description || '', safetyInformation: (m as any).safetyInformation || '', specifications: (m as any).specifications || '', benefit: m.benefit || '', requiresPrescription: m.requiresPrescription || false, image: m.image || '', isPopular: m.isPopular || false, productType, isPopularGeneric: (m as any).isPopularGeneric || false, isPopularAyurveda: (m as any).isPopularAyurveda || false, isPopularHomeopathy: (m as any).isPopularHomeopathy || false, isPopularLabTests: (m as any).isPopularLabTests || false });
    setImageUrl(m.image || '');
    setShowProdForm(true);
  };
  const saveProd = async () => {
    if (!prodForm.name || !prodForm.category || !prodForm.price) { alert('Name, category and price are required.'); return; }
    if (prodForm.productType === 'Homeopathy' && !prodForm.subcategory) { alert('Please select a homeopathy subcategory.'); return; }
    if (prodForm.productType === 'Ayurveda Medicine' && !prodForm.subcategory) { alert('Please select an ayurveda subcategory.'); return; }
    if (prodForm.productType === 'Nutrition' && !prodForm.subcategory) { alert('Please select a nutrition subcategory.'); return; }
    if (prodForm.productType === 'Personal Care' && !prodForm.subcategory) { alert('Please select a personal care subcategory.'); return; }
    if (prodForm.productType === 'Baby Care' && !prodForm.subcategory) { alert('Please select a baby care subcategory.'); return; }
    if (prodForm.productType === 'Fitness' && !prodForm.subcategory) { alert('Please select a fitness subcategory.'); return; }
    if (prodForm.productType === 'Unani' && !prodForm.subcategory) { alert('Please select an unani subcategory.'); return; }
    setMedSaving(true);
    try {
      // If editing and image changed, delete old image from Cloudinary
      if (editMed && editMed.image && imageUrl !== editMed.image) {
        const oldPublicId = extractPublicIdFromUrl(editMed.image);
        if (oldPublicId) {
          await fetch('/api/medicines/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldPublicId }),
          });
        }
      }
      
      // If editing and image removed (cleared), delete from Cloudinary
      if (editMed && editMed.image && !imageUrl) {
        const oldPublicId = extractPublicIdFromUrl(editMed.image);
        if (oldPublicId) {
          await fetch('/api/medicines/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldPublicId }),
          });
        }
      }
      
      const payload = { name: prodForm.name, brand: prodForm.brand, category: prodForm.category, subcategory: (prodForm.productType === 'Homeopathy' || prodForm.productType === 'Ayurveda Medicine' || prodForm.productType === 'Nutrition' || prodForm.productType === 'Personal Care' || prodForm.productType === 'Baby Care' || prodForm.productType === 'Fitness' || prodForm.productType === 'Unani') ? (prodForm.subcategory || undefined) : undefined, potency: prodForm.potency || undefined, quantity: prodForm.quantity ? Number(prodForm.quantity) : undefined, quantityUnit: prodForm.quantityUnit || 'None', diseaseCategory: prodForm.diseaseCategory || undefined, diseaseSubcategory: prodForm.diseaseSubcategory || undefined, productType: prodForm.productType || 'Generic Medicine', price: Number(prodForm.price), mrp: prodForm.mrp ? Number(prodForm.mrp) : undefined, stock: Number(prodForm.stock) || 0, description: prodForm.description, safetyInformation: prodForm.safetyInformation || undefined, specifications: prodForm.specifications || undefined, benefit: prodForm.benefit || undefined, requiresPrescription: prodForm.requiresPrescription, image: imageUrl || undefined, isActive: true, isPopular: prodForm.isPopular || false, isPopularGeneric: prodForm.isPopularGeneric || false, isPopularAyurveda: prodForm.isPopularAyurveda || false, isPopularHomeopathy: prodForm.isPopularHomeopathy || false, isPopularLabTests: prodForm.isPopularLabTests || false };
      if (editMed) await fetch(`/api/admin/products/${editMed._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      else await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setShowProdForm(false); setEditMed(null); setImageUrl(''); await fetchProducts();
    } catch {}
    setMedSaving(false);
  };
  const deleteProd = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setMedicines((p) => p.filter((m) => m._id !== id));
  };
  const toggleProdActive = async (m: Medicine) => {
    await fetch(`/api/admin/products/${m._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !m.isActive }) });
    setMedicines((p) => p.map((x) => x._id === m._id ? { ...x, isActive: !x.isActive } : x));
  };
  const toggleProdPopular = async (m: Medicine) => {
    const productType = m.productType || 'Generic Medicine';
    const newIsPopular = !m.isPopular;
    
    // Build update payload with correct category-specific flag
    const updatePayload: any = { isPopular: newIsPopular };
    
    if (productType === 'Generic Medicine') updatePayload.isPopularGeneric = newIsPopular;
    else if (productType === 'Ayurveda Medicine') updatePayload.isPopularAyurveda = newIsPopular;
    else if (productType === 'Homeopathy') updatePayload.isPopularHomeopathy = newIsPopular;
    else if (productType === 'Lab Tests') updatePayload.isPopularLabTests = newIsPopular;
    
    await fetch(`/api/admin/products/${m._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload) });
    setMedicines((p) => p.map((x) => x._id === m._id ? { ...x, isPopular: !x.isPopular, isPopularGeneric: productType === 'Generic Medicine' ? newIsPopular : x.isPopularGeneric, isPopularAyurveda: productType === 'Ayurveda Medicine' ? newIsPopular : (x as any).isPopularAyurveda, isPopularHomeopathy: productType === 'Homeopathy' ? newIsPopular : (x as any).isPopularHomeopathy, isPopularLabTests: productType === 'Lab Tests' ? newIsPopular : (x as any).isPopularLabTests } : x));
  };
  const addToFeaturedProducts = async (m: Medicine) => {
    if ((m.approvalStatus || 'approved') !== 'approved') {
      alert('Only approved products can be added to featured products.');
      return;
    }
    if (!m.image) {
      alert('Please add a product image before featuring this product.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    let adminEmail = localStorage.getItem('adminEmail');

    if (!adminEmail) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          adminEmail = userData.email;
        } catch {
          adminEmail = null;
        }
      }
    }

    if (!token || !expiresAt || !adminEmail) {
      alert('Admin authentication missing. Please logout and login again.');
      return;
    }

    const productType = (m.productType as VendorProductType) || 'Generic Medicine';
    const category: VendorProductType =
      Object.prototype.hasOwnProperty.call(VENDOR_CATEGORY_MAP, productType)
        ? productType
        : 'Generic Medicine';

    const allowedSubcategories = (activeVendorCategoryMap[category] || []) as readonly string[];
    const preferredSubcategory =
      [m.subcategory, m.category, m.brand, m.name]
        .map((value) => (value || '').trim())
        .find((value) => !!value && allowedSubcategories.includes(value)) ||
      allowedSubcategories[0] ||
      'General';

    const payload = {
      brandName: (m.brand || m.name || '').trim(),
      category,
      subcategory: preferredSubcategory,
      imageUrl: m.image,
      cardBgColor: getRandomFeaturedCardColor(),
    };

    if (!payload.brandName) {
      alert('Product name/brand is required to add featured product.');
      return;
    }

    setFeatureSubmittingId(m._id);
    try {
      const response = await fetch('/api/featured-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-token-expires-at': expiresAt,
          'x-admin-email': adminEmail,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to add product to featured list');
      }

      alert('Product added to featured products successfully.');
    } catch (error: any) {
      alert(error?.message || 'Failed to add product to featured products.');
    } finally {
      setFeatureSubmittingId(null);
    }
  };
  const approveProd = async (m: Medicine) => {
    await fetch(`/api/admin/products/${m._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'approved', isActive: true }),
    });
    setMedicines((p) => p.map((x) => x._id === m._id ? { ...x, approvalStatus: 'approved', isActive: true } : x));
  };
  const rejectProd = async (m: Medicine) => {
    await fetch(`/api/admin/products/${m._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus: 'rejected', isActive: false, isPopular: false }),
    });
    setMedicines((p) => p.map((x) => x._id === m._id ? { ...x, approvalStatus: 'rejected', isActive: false, isPopular: false } : x));
  };

  // ── Lab Test CRUD ─────────────────────────────────────────────────────────
  const openAddLab = () => { setEditLab(null); setLabForm(EMPTY_LAB); setLabImageUrl(''); setShowLabForm(true); };
  const openEditLab = (t: LabTest) => {
    setEditLab(t);
    setLabForm({ name: t.name, category: t.category, price: String(t.price), mrp: String(t.mrp || ''), description: t.description || '', icon: t.icon || '', duration: t.duration || '', testsIncluded: t.testsIncluded || '', popular: (t as any).isPopularLabTests || t.popular || false });
    setLabImageUrl((t as any).image || '');
    setShowLabForm(true);
  };
  const saveLab = async () => {
    if (!labForm.name || !labForm.category || !labForm.price) { alert('Name, category and price are required.'); return; }
    setLabSaving(true);
    // If editing and image changed, delete old image from Cloudinary
    if (editLab && (editLab as any).image && labImageUrl !== (editLab as any).image) {
      const oldPublicId = extractPublicIdFromUrl((editLab as any).image);
      if (oldPublicId) {
        await fetch('/api/medicines/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: oldPublicId }),
        });
      }
    }
    // If editing and image removed (cleared), delete from Cloudinary
    if (editLab && (editLab as any).image && !labImageUrl) {
      const oldPublicId = extractPublicIdFromUrl((editLab as any).image);
      if (oldPublicId) {
        await fetch('/api/medicines/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: oldPublicId }),
        });
      }
    }
    const payload = { name: labForm.name, category: labForm.category, price: Number(labForm.price), mrp: labForm.mrp ? Number(labForm.mrp) : undefined, description: labForm.description, benefit: labForm.description, image: labImageUrl || undefined, stock: 9999, productType: 'Lab Tests', isActive: true, isPopular: labForm.popular, isPopularLabTests: labForm.popular };
    try {
      if (editLab) await fetch(`/api/admin/products/${editLab._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      else await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setShowLabForm(false); setEditLab(null); setLabImageUrl(''); await fetchLabTests();
    } catch (err) {
      console.error('Error saving lab test:', err);
      alert('Failed to save lab test');
    }
    setLabSaving(false);
  };
  const deleteLab = async (id: string) => {
    if (!confirm('Delete this lab test?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setLabTests((p) => p.filter((t) => t._id !== id));
  };
  const toggleLabActive = async (t: LabTest) => {
    await fetch(`/api/admin/products/${t._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !t.isActive }) });
    setLabTests((p) => p.map((x) => x._id === t._id ? { ...x, isActive: !x.isActive } : x));
  };
  const toggleLabPopular = async (t: LabTest) => {
    const newPopular = !((t as any).isPopularLabTests || t.popular);
    await fetch(`/api/admin/products/${t._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPopular: newPopular, popular: newPopular, isPopularLabTests: newPopular }),
    });
    setLabTests((p) => p.map((x) => x._id === t._id ? { ...x, popular: newPopular, isPopularLabTests: newPopular } : x));
  };

  const filteredMeds = medicines.filter((m) => {
    const effectiveApprovalStatus = m.approvalStatus || ((m.vendorId && !m.isActive) ? 'pending' : 'approved');
    const byType = (m.productType || 'Generic Medicine') !== 'Lab Tests';
    const bySearch = !medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase()) || (m.brand || '').toLowerCase().includes(medSearch.toLowerCase());
    const byCat = medCatFilter === 'All' || m.category === medCatFilter;
    const byApproval = medApprovalFilter === 'all' || effectiveApprovalStatus === medApprovalFilter;
    return byType && bySearch && byCat && byApproval;
  });
  const labSubmissions = medicines.filter((m) => {
    const byType = m.productType === 'Lab Tests';
    const byVendor = !!m.vendorId;
    const bySearch = !labSearch || m.name.toLowerCase().includes(labSearch.toLowerCase()) || m.category.toLowerCase().includes(labSearch.toLowerCase());
    return byType && byVendor && bySearch;
  });
  const filteredLabs = labTests.filter((t) => !labSearch || t.name.toLowerCase().includes(labSearch.toLowerCase()) || t.category.toLowerCase().includes(labSearch.toLowerCase()));
  const pendingMedicineApprovals = medicines.filter((m) => {
    const byType = (m.productType || 'Generic Medicine') !== 'Lab Tests';
    const effectiveApprovalStatus = m.approvalStatus || ((m.vendorId && !m.isActive) ? 'pending' : 'approved');
    const byPending = effectiveApprovalStatus === 'pending';
    return byType && byPending;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-flex items-center gap-1 font-medium">← Back to Dashboard</Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manage Health Products</h1>
              <p className="text-slate-500 text-sm mt-1">{medicines.length} products · {labTests.length} lab tests</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {seedMsg && <span className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg font-medium">{seedMsg}</span>}
              <button onClick={() => seedAll(false)} disabled={seeding} className="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
                {seeding ? 'Seeding...' : '⚡ Seed Sample Data'}
              </button>
              <button onClick={() => seedAll(true)} disabled={seeding} className="border border-orange-300 text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
                ↺ Re-seed (Force)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button onClick={() => setTab('products')} className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors duration-200 ${tab === 'products' ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
              💊 Products ({medicines.filter(m => (m.productType || 'Generic Medicine') !== 'Lab Tests').length})
            </button>
            <button onClick={() => setTab('labtests')} className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors duration-200 ${tab === 'labtests' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
              🧪 Lab Tests ({labTests.length + labSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── PRODUCTS TAB ───────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Manage Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Products', value: medicines.filter(m => (m.productType || 'Generic Medicine') !== 'Lab Tests').length, color: 'from-blue-50 to-blue-100 border-blue-200', textColor: 'text-blue-700' },
                  { label: 'Pending Approval', value: medicines.filter(m => (m.productType || 'Generic Medicine') !== 'Lab Tests' && (m.approvalStatus || 'approved') === 'pending').length, color: 'from-yellow-50 to-yellow-100 border-yellow-200', textColor: 'text-yellow-700' },
                  { label: 'Approved', value: medicines.filter(m => (m.productType || 'Generic Medicine') !== 'Lab Tests' && (m.approvalStatus || 'approved') === 'approved').length, color: 'from-emerald-50 to-emerald-100 border-emerald-200', textColor: 'text-emerald-700' },
                  { label: 'Low Stock (<20)', value: medicines.filter(m => (m.productType || 'Generic Medicine') !== 'Lab Tests' && m.stock < 20).length, color: 'from-red-50 to-red-100 border-red-200', textColor: 'text-red-700' },
                ].map((s) => (
                  <div key={s.label} className={`bg-linear-to-br ${s.color} rounded-lg p-4 border`}>
                    <div className={`text-2xl font-bold ${s.textColor}`}>{s.value}</div>
                    <div className={`text-sm font-medium ${s.textColor}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-sm font-semibold text-yellow-900">Pending Approval Queue</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                  {pendingMedicineApprovals.length} pending
                </span>
              </div>
              {pendingMedicineApprovals.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-500">No pending medicine approvals right now.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Vendor</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingMedicineApprovals.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{m.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{m.vendorName || 'MySanjeevni'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{m.category}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-700">₹{m.price}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-3">
                              <button onClick={() => approveProd(m)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline">Approve</button>
                              <button onClick={() => rejectProd(m)} className="text-amber-600 hover:text-amber-800 text-sm font-medium hover:underline">Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" type="text" placeholder="Search name or brand..." value={medSearch} onChange={(e) => setMedSearch(e.target.value)} />
              <select value={medCatFilter} onChange={(e) => setMedCatFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                <option value="All">All Categories</option>
                {PROD_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={medApprovalFilter} onChange={(e) => setMedApprovalFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')} className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                <option value="all">All Approval States</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={openAddProd} className="bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap">+ Add Product</button>
            </div>

            {showProdForm && (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">{editMed ? 'Edit Product' : 'Add New Product'}</h2>
                
                {/* Multi-Image Upload Section */}
                <div className="mb-6 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Medicine Images (up to 4)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      if (images.length + files.length > 4) {
                        alert('You can upload up to 4 images.');
                        return;
                      }
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const result = await uploadImage(file);
                        if (result?.success && result.imageUrl) {
                          setImages(prev => [...prev, result.imageUrl].slice(0, 4));
                        } else {
                          alert('Failed to upload one or more images.');
                        }
                      }
                    }}
                    disabled={imageUploading || images.length >= 4}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                  />
                  {uploadError && (
                    <p className="mt-2 text-red-600 text-sm font-medium">❌ {uploadError}</p>
                  )}
                  {imageUploading && (
                    <p className="mt-2 text-blue-600 text-sm font-medium">⏳ Uploading image...</p>
                  )}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {images.map((url, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <img
                            src={url}
                            alt={`Medicine ${idx + 1}`}
                            className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            type="button"
                            className="mt-2 text-xs text-red-600 hover:underline"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {images.length >= 4 && (
                    <p className="mt-2 text-yellow-600 text-sm font-medium">Maximum 4 images allowed.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input type="text" placeholder="Product Name *" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <select value={prodForm.productType || 'Generic Medicine'} onChange={(e) => {
                    const productType = e.target.value as VendorProductType;
                    const category = getDefaultCategoryForTypeDynamic(productType);
                    const subcategory = getDefaultSubcategoryForTypeDynamic(productType, category);
                    setProdForm({ ...prodForm, productType, category, subcategory });
                  }} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                    {productTypeOptions.map((productType) => (
                      <option key={productType} value={productType}>{productType}</option>
                    ))}
                  </select>
                  <select value={prodForm.category} onChange={(e) => {
                    const category = e.target.value;
                    const subcategory = getDefaultSubcategoryForTypeDynamic(prodForm.productType, category);
                    setProdForm({ ...prodForm, category, subcategory });
                  }} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                    <option value="">Category *</option>
                    {(activeVendorCategoryMap[prodForm.productType as VendorProductType || 'Generic Medicine'] || []).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {(prodForm.productType === 'Homeopathy' || prodForm.productType === 'Ayurveda Medicine' || prodForm.productType === 'Nutrition' || prodForm.productType === 'Personal Care' || prodForm.productType === 'Baby Care' || prodForm.productType === 'Fitness' || prodForm.productType === 'Unani') && (
                    <select value={prodForm.subcategory} onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                      <option value="">Subcategory *</option>
                      {getSubcategoryOptionsForType(prodForm.productType, prodForm.category).map((subcategory) => (
                        <option key={subcategory} value={subcategory}>{subcategory}</option>
                      ))}
                    </select>
                  )}
                  <select value={prodForm.diseaseCategory || ''} onChange={(e) => {
                    const diseaseCategory = e.target.value;
                    const options = activeDiseaseCategoryMap[diseaseCategory] || [];
                    setProdForm({ ...prodForm, diseaseCategory, diseaseSubcategory: options[0] || '' });
                  }} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                    <option value="">Disease Category (Optional)</option>
                    {Object.keys(activeDiseaseCategoryMap).map((diseaseCategory) => (
                      <option key={diseaseCategory} value={diseaseCategory}>{diseaseCategory}</option>
                    ))}
                  </select>
                  <select value={prodForm.diseaseSubcategory || ''} onChange={(e) => setProdForm({ ...prodForm, diseaseSubcategory: e.target.value })} disabled={!prodForm.diseaseCategory} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm disabled:bg-slate-100 disabled:text-slate-400">
                    <option value="">Disease Subcategory (Optional)</option>
                    {((activeDiseaseCategoryMap[prodForm.diseaseCategory || ''] || [])).map((diseaseSubcategory) => (
                      <option key={diseaseSubcategory} value={diseaseSubcategory}>{diseaseSubcategory}</option>
                    ))}
                  </select>
                  <input type="text" placeholder="Brand" value={prodForm.brand} onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <select value={prodForm.potency || ''} onChange={(e) => setProdForm({ ...prodForm, potency: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                    <option value="">Potency (Optional)</option>
                    {POTENCY_OPTIONS.map((potency) => <option key={potency} value={potency}>{potency}</option>)}
                  </select>
                  <input type="number" step="0.01" min="0" placeholder="Quantity (Optional)" value={prodForm.quantity || ''} onChange={(e) => setProdForm({ ...prodForm, quantity: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <select value={prodForm.quantityUnit || 'None'} onChange={(e) => setProdForm({ ...prodForm, quantityUnit: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm">
                    {QUANTITY_UNIT_OPTIONS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <input type="number" placeholder="Price ₹ *" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <input type="number" placeholder="MRP ₹" value={prodForm.mrp} onChange={(e) => setProdForm({ ...prodForm, mrp: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <input type="number" placeholder="Stock Qty" value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <input type="text" placeholder="Benefit tag (e.g. Immunity)" value={prodForm.benefit} onChange={(e) => setProdForm({ ...prodForm, benefit: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm" />
                  <textarea placeholder="Description" value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3" rows={2} />
                  <textarea placeholder="Safety Information (one point per line)" value={prodForm.safetyInformation || ''} onChange={(e) => setProdForm({ ...prodForm, safetyInformation: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3" rows={3} />
                  <textarea placeholder="Specifications (one point per line)" value={prodForm.specifications || ''} onChange={(e) => setProdForm({ ...prodForm, specifications: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3" rows={3} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mb-6 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={prodForm.requiresPrescription} onChange={(e) => setProdForm({ ...prodForm, requiresPrescription: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Requires Prescription (Rx)</span>
                </label>

                {/* Popular Section Checkboxes */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-slate-900 mb-4 text-sm">Display in Popular Sections:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-blue-300 hover:bg-blue-100 transition-colors bg-white">
                      <input type="checkbox" checked={prodForm.isPopularGeneric} onChange={(e) => setProdForm({ ...prodForm, isPopularGeneric: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-blue-600" />
                      <span className="text-sm font-medium text-slate-700">Popular Medicines</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-green-300 hover:bg-green-100 transition-colors bg-white">
                      <input type="checkbox" checked={prodForm.isPopularAyurveda} onChange={(e) => setProdForm({ ...prodForm, isPopularAyurveda: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-green-600" />
                      <span className="text-sm font-medium text-slate-700">Popular Ayurveda Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-purple-300 hover:bg-purple-100 transition-colors bg-white">
                      <input type="checkbox" checked={prodForm.isPopularHomeopathy} onChange={(e) => setProdForm({ ...prodForm, isPopularHomeopathy: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-purple-600" />
                      <span className="text-sm font-medium text-slate-700">Popular Homeopathy Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-orange-300 hover:bg-orange-100 transition-colors bg-white">
                      <input type="checkbox" checked={prodForm.isPopularLabTests} onChange={(e) => setProdForm({ ...prodForm, isPopularLabTests: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-orange-600" />
                      <span className="text-sm font-medium text-slate-700">Popular Lab Tests</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveProd} disabled={medSaving || imageUploading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">{medSaving ? 'Saving...' : editMed ? 'Update Product' : 'Add Product'}</button>
                  <button onClick={() => { setShowProdForm(false); setEditMed(null); setImageUrl(''); }} className="border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {medLoading ? (
              <div className="text-center py-20 text-slate-400">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4"></div>
                Loading products...
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{['Icon', 'Name & Brand', 'Category', 'Vendor', 'Price / MRP', 'Stock', 'Approval', 'Popular', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMeds.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400">No products found. Add your first product or seed sample data.</td></tr>
                    ) : filteredMeds.map((m) => (
                      <tr key={m._id} className={`hover:bg-slate-50 transition-colors ${!m.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4 text-2xl">{m.icon || '💊'}</td>
                        <td className="px-6 py-4"><div className="font-medium text-slate-900 text-sm">{m.name}</div><div className="text-xs text-slate-500">{m.brand || '—'}</div></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m.category}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m.vendorName || 'MySanjeevni'}</td>
                        <td className="px-6 py-4"><div className="text-sm font-semibold text-emerald-700">₹{m.price}</div>{m.mrp && m.mrp > m.price && <div className="text-xs text-slate-400 line-through">₹{m.mrp}</div>}</td>
                        <td className="px-6 py-4 text-sm"><span className={m.stock < 20 ? 'text-red-600 font-semibold' : 'text-slate-700'}>{m.stock}</span></td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${(m.approvalStatus || 'approved') === 'approved' ? 'bg-emerald-100 text-emerald-700' : (m.approvalStatus || 'approved') === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {m.approvalStatus || 'approved'}
                          </span>
                        </td>
                        <td className="px-6 py-4"><button onClick={() => toggleProdPopular(m)} disabled={(m.approvalStatus || 'approved') !== 'approved'} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${m.isPopular ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${(m.approvalStatus || 'approved') !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}>{m.isPopular ? '⭐ Popular' : 'Not Popular'}</button></td>
                        <td className="px-6 py-4"><button onClick={() => toggleProdActive(m)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${m.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m.isActive ? 'Active' : 'Inactive'}</button></td>
                        <td className="px-6 py-4"><div className="flex gap-3 flex-wrap">{(m.approvalStatus || 'approved') === 'pending' && <><button onClick={() => approveProd(m)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline">Approve</button><button onClick={() => rejectProd(m)} className="text-amber-600 hover:text-amber-800 text-sm font-medium hover:underline">Reject</button></>}<button onClick={() => addToFeaturedProducts(m)} disabled={featureSubmittingId === m._id || (m.approvalStatus || 'approved') !== 'approved'} className={`text-sm font-medium ${(featureSubmittingId === m._id || (m.approvalStatus || 'approved') !== 'approved') ? 'text-slate-400 cursor-not-allowed' : 'text-violet-600 hover:text-violet-800 hover:underline'}`}>{featureSubmittingId === m._id ? 'Adding...' : 'Add to Featured'}</button><button onClick={() => openEditProd(m)} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">Edit</button><button onClick={() => deleteProd(m._id)} className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline">Delete</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── LAB TESTS TAB ──────────────────────────────────────── */}
        {tab === 'labtests' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Manage Lab Tests</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Tests', value: labTests.length, color: 'from-blue-50 to-blue-100 border-blue-200', textColor: 'text-blue-700' },
                  { label: 'Active', value: labTests.filter(t => t.isActive).length, color: 'from-emerald-50 to-emerald-100 border-emerald-200', textColor: 'text-emerald-700' },
                  { label: 'Vendor Submissions', value: labSubmissions.length, color: 'from-purple-50 to-purple-100 border-purple-200', textColor: 'text-purple-700' },
                  { label: 'Pending Vendor', value: labSubmissions.filter(t => (t.approvalStatus || 'approved') === 'pending').length, color: 'from-orange-50 to-orange-100 border-orange-200', textColor: 'text-orange-700' },
                ].map((s) => (
                  <div key={s.label} className={`bg-linear-to-br ${s.color} rounded-lg p-4 border`}>
                    <div className={`text-2xl font-bold ${s.textColor}`}>{s.value}</div>
                    <div className={`text-sm font-medium ${s.textColor}`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" type="text" placeholder="Search lab test name or category..." value={labSearch} onChange={(e) => setLabSearch(e.target.value)} />
              <button onClick={openAddLab} className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap">+ Add Lab Test</button>
            </div>

            {showLabForm && (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">{editLab ? 'Edit Lab Test' : 'Add New Lab Test'}</h2>
                
                {/* Image Upload Section */}
                <div className="mb-6 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Lab Test Image</label>
                  
                  {/* Current Image Display */}
                  {labImageUrl && (
                    <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                      <p className="text-xs text-slate-600 mb-2 font-medium">Current Image:</p>
                      <div className="flex gap-3 items-start">
                        <img
                          src={labImageUrl}
                          alt="Current Lab Test"
                          className="h-24 w-24 object-cover rounded-lg border border-slate-300"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 truncate mb-2">URL: {labImageUrl}</p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this image? You can upload a new one.')) return;
                              const publicId = extractPublicIdFromUrl(labImageUrl);
                              if (!publicId) {
                                alert('Could not extract image ID');
                                return;
                              }
                              try {
                                const res = await fetch('/api/medicines/delete-image', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ publicId }),
                                });
                                if (res.ok) {
                                  setLabImageUrl('');
                                  alert('✅ Image deleted successfully');
                                } else {
                                  alert('❌ Failed to delete image');
                                }
                              } catch (error) {
                                alert('❌ Error deleting image');
                              }
                            }}
                            disabled={imageUploading}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50"
                          >
                            🗑️ Delete Image
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const result = await uploadImage(file);
                        if (result?.success && result.imageUrl) {
                          setLabImageUrl(result.imageUrl);
                        }
                      }
                    }}
                    disabled={imageUploading}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  
                  {uploadError && (
                    <p className="mt-2 text-red-600 text-sm font-medium">❌ {uploadError}</p>
                  )}
                  
                  {imageUploading && (
                    <p className="mt-2 text-blue-600 text-sm font-medium">⏳ Uploading image...</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input type="text" placeholder="Test Name *" value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <select value={labForm.category} onChange={(e) => setLabForm({ ...labForm, category: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm">
                    <option value="">Category *</option>
                    {activeLabCategories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Price ₹ *" value={labForm.price} onChange={(e) => setLabForm({ ...labForm, price: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <input type="number" placeholder="MRP ₹" value={labForm.mrp} onChange={(e) => setLabForm({ ...labForm, mrp: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <input type="text" placeholder="Duration (e.g. 6-8 hrs fasting)" value={labForm.duration} onChange={(e) => setLabForm({ ...labForm, duration: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <input type="text" placeholder="Icon emoji (e.g. 🧪)" value={labForm.icon} onChange={(e) => setLabForm({ ...labForm, icon: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <input type="text" placeholder="Tests included (e.g. 72 parameters)" value={labForm.testsIncluded} onChange={(e) => setLabForm({ ...labForm, testsIncluded: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                  <textarea placeholder="Description" value={labForm.description} onChange={(e) => setLabForm({ ...labForm, description: e.target.value })} className="border border-slate-300 rounded-lg px-4 py-2 md:col-span-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" rows={2} />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">Display in Popular Sections:</h4>
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-orange-300 hover:bg-orange-100 transition-colors bg-white">
                    <input type="checkbox" checked={labForm.popular} onChange={(e) => setLabForm({ ...labForm, popular: e.target.checked })} className="w-5 h-5 rounded border-slate-300 accent-orange-600" />
                    <span className="text-sm font-medium text-slate-700">Popular Lab Tests</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveLab} disabled={labSaving || imageUploading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">{labSaving ? 'Saving...' : editLab ? 'Update Lab Test' : 'Add Lab Test'}</button>
                  <button onClick={() => { setShowLabForm(false); setEditLab(null); setLabImageUrl(''); }} className="border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {labLoading ? (
              <div className="text-center py-20 text-slate-400">
                <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4"></div>
                Loading lab tests...
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>{['Icon', 'Test Name', 'Category', 'Price / MRP', 'Includes', 'Popular', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLabs.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No lab tests found. Add your first lab test or seed sample data.</td></tr>
                    ) : filteredLabs.map((t) => (
                      <tr key={t._id} className={`hover:bg-slate-50 transition-colors ${!t.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          {(t as any).image ? (
                            <img src={(t as any).image} alt={t.name} className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                          ) : (
                            <span className="text-2xl">{t.icon || '🧪'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">{t.name}</div>
                          {t.description && <div className="text-xs text-slate-500 truncate max-w-xs">{t.description}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{t.category}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-blue-700">₹{t.price}</div>
                          {t.mrp && t.mrp > t.price && <div className="text-xs text-slate-400 line-through">₹{t.mrp}</div>}
                          {t.mrp && t.mrp > t.price && <div className="text-xs text-emerald-600 font-medium">{Math.round(((t.mrp - t.price) / t.mrp) * 100)}% off</div>}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{t.testsIncluded || '—'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleLabPopular(t)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                              ((t as any).isPopularLabTests || t.popular)
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {((t as any).isPopularLabTests || t.popular) ? '⭐ Popular Lab Tests' : 'Not Popular'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleLabActive(t)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${t.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{t.isActive ? 'Active' : 'Inactive'}</button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button onClick={() => openEditLab(t)} className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">Edit</button>
                            <button onClick={() => deleteLab(t._id)} className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-8 bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden overflow-x-auto">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-900">Vendor Lab Test Submissions</h3>
                <p className="text-sm text-slate-500">Lab-test products submitted by vendors appear here for admin approval.</p>
              </div>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{['Image', 'Name', 'Category', 'Vendor', 'Price', 'Approval', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {labSubmissions.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No vendor lab-test submissions found.</td></tr>
                  ) : labSubmissions.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        {(m as any).image ? (
                          <img src={(m as any).image} alt={m.name} className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="text-2xl">🩺</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 text-sm">{m.name}</div>
                        {m.description && <div className="text-xs text-slate-500 truncate max-w-xs">{m.description}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{m.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{m.vendorName || 'MySanjeevni'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-blue-700">₹{m.price}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${(m.approvalStatus || 'approved') === 'approved' ? 'bg-emerald-100 text-emerald-700' : (m.approvalStatus || 'approved') === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {m.approvalStatus || 'approved'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 flex-wrap">
                          {(m.approvalStatus || 'approved') === 'pending' && (
                            <>
                              <button onClick={() => approveProd(m)} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline">Approve</button>
                              <button onClick={() => rejectProd(m)} className="text-amber-600 hover:text-amber-800 text-sm font-medium hover:underline">Reject</button>
                            </>
                          )}
                          <button onClick={() => deleteProd(m._id)} className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

