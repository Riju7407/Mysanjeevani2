'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useImageUpload } from '@/lib/hooks/useImageUpload';

interface VendorInfo {
  _id: string;
  vendorName: string;
  email: string;
  status: string;
  rating?: number;
  totalOrders?: number;
  commissionPercentage?: number;
}

interface Product {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  mrp?: number;
  stock: number;
  category: string;
  subcategory?: string;
  potency?: string;
  quantity?: number;
  quantityUnit?: string;
  diseaseCategory?: string;
  diseaseSubcategory?: string;
  productType?: string;
  benefit?: string;
  requiresPrescription?: boolean;
  description?: string;
  safetyInformation?: string;
  specifications?: string;
  image?: string;
  usdPrice?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface DynamicCategoryConfig {
  vendorCategoryMap?: Record<string, string[]>;
  subcategoryMapByType?: Record<string, Record<string, string[]>>;
  diseaseSubcategoryMap?: Record<string, string[]>;
}

const POTENCY_OPTIONS = ['1000 CH', '3 CH', '10M CH', '200 CH', '30 CH', '12 CH', '6 CH', 'CM CH', '50M CH'];
const QUANTITY_UNIT_OPTIONS = ['None', 'BAGS (Bag)', 'BOTTLES (Btl)', 'BOX (Box)', 'BUNDLES (Bdl)', 'CANS (Can)', 'CAPSULES (CAPS)', 'CARTONS (Ctn)', 'DOZENS (Dzn)', 'GRAMMES (Gm)', 'KILOGRAMS (Kg)', 'LITRE (Ltr)', 'METERS (Mtr)', 'MILILITRE (MI)', 'NUMBERS (Nos)', 'PACKS (Pac)', 'PAIRS (Prs)', 'PIECES (Pcs)', 'QUINTAL (Qtl)', 'ROLLS (Rol)', 'SACHET (SACH)', 'SQUARE FEET (Sqf)', 'SQUARE METERS (Sqm)', 'TABLETS (Tbs)'];

const HOMEOPATHY_SUBCATEGORY_MAP = {
  Medicines: ['SBL', 'Dr. Reckeweg (Germany)', 'Willmar Schwabe (Germany)', 'Adel Pekana (Germany)', 'Willmar Schwabe India', 'BJain', 'R S Bhargava', 'Baksons', 'REPL', 'New Life', 'Special Tablets', 'Cream & Ointment', 'Special Liquid/Drops'],
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
  'Single Remedies': ['Ras & Sindoor', 'Bhasm & Pishti', 'Vati & Gutika & Guggulu', 'Asava Arishta & Kadha', 'Loha & Mandur', 'Churan & Powder & Avleha & Pak', 'Tailam & Ghrita', 'Gold Items', 'Special Tablets & Capsules', 'Syrups & Tonics'],
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
  'Supports & Splints': ['Shoulder Support', 'Elbow Support', 'Forearm Support', 'Wrist Support', 'Chest Support', 'Cervical Support', 'Back Support', 'Abdominal Support', 'Thigh Support', 'Knee Support', 'Calf Support', 'Ankle Support', 'Finger Splint', 'Compression Stockings', 'Insoles & Heel cups'],
  'Health Devices': ['Weighing Scales', 'BP Monitors', 'Thermometer', 'Respiratory Care', 'Activity Moniter', 'Hot and Cold Pads & Bottles'],
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

const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

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
    'Medicines', 'Single Remedies', 'Herbal Food & Juices',
  ],
  Homeopathy: [
    'Medicines', 'Cosmetics', 'Dilutions', 'Mother Tinctures', 'Biochemic', 'Bach Flower', 'Homeopathy Kits', 'Triturations', 'Millesimal LM Potency', 'Bio Combination',
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
    'Sports Nutrition', 'Health Food & Drinks', 'Vitamin & Dietary Supplements', 'Organic Products', 'Green Teas', 'Digestives',
  ],
  'Personal Care': [
    'Aroma Oils', 'Mens Grooming', 'Female Care', 'Skin Care', 'Bath & Shower', 'Hair Care', 'Elderly Care', 'Mosquito Repellents', 'Oral Care',
  ],
  Fitness: [
    'Supports & Splints', 'Health Devices', 'Fitness Equipment', 'Hospital Supplies', 'Aroma Therapy', 'Disability Aids', 'Massagers', 'Bandages & Tapes', 'Walking Sticks',
  ],
  'Sexual Wellness': [
    'Sexual Supplements', 'Condoms',
  ],
  Consultation: [
    'Homeo Treatment', 'Ayurveda Treatment', 'Unani Treatment', 'Diet Counselling',
  ],
  Unani: [
    'Unani Medicines', 'Habbe & Qurs', 'Majun & Jawarish', 'Safoof, Labub & Kushta', 'Sharbat, Sirka & Arq', 'Lauq & Saoot', 'Khamira & Itrifal', 'Roghan & Oils', 'Unani Brands',
  ],
  'Baby Care': [
    'Tonics & Supplements', 'Bath & Skin', 'Wipes & Diapers', 'Gift Packs',
  ],
} as const;

type VendorProductType = keyof typeof VENDOR_CATEGORY_MAP;

function getDefaultCategoryForType(productType: VendorProductType): string {
  return VENDOR_CATEGORY_MAP[productType][0];
}

function inferProductTypeFromCategory(category: string): VendorProductType {
  const normalized = (category || '').trim().toLowerCase();
  if (normalized === 'generic' || normalized === 'branded') return 'Generic Medicine';
  if (normalized === 'ayurvedic' || normalized === 'ayurveda') return 'Ayurveda Medicine';
  if (normalized === 'homeopathy') return 'Homeopathy';
  if (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest') return 'Lab Tests';

  for (const [type, categories] of Object.entries(VENDOR_CATEGORY_MAP)) {
    if ((categories as readonly string[]).includes(category)) {
      return type as VendorProductType;
    }
  }
  return 'Generic Medicine';
}

function isCloudinaryImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/res\.cloudinary\.com\//i.test(url.trim());
}

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/([^/]+\/[^/]+)\.[^.]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export default function VendorDashboard() {
  const router = useRouter();
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    description: '',
    safetyInformation: '',
    specifications: '',
    price: '',
    usdPrice: '',
    mrp: '',
    productType: 'Generic Medicine' as VendorProductType,
    category: '',
    categoryPath: [] as string[],
    categories: [] as string[],
    subcategory: '',
    potency: '',
    quantity: '',
    quantityUnit: 'None',
    diseasePaths: [] as string[][],
    diseaseCategory: '',
    diseaseSubcategory: '',
    benefit: '',
    requiresPrescription: false,
    isPopular: false,
    isPopularGeneric: false,
    isPopularAyurveda: false,
    isPopularHomeopathy: false,
    isPopularLabTests: false,
    popularSection: 'None',
    stock: '',
    image: '',
  });
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: '',
    brand: '',
    description: '',
    safetyInformation: '',
    specifications: '',
    price: '',
    usdPrice: '',
    mrp: '',
    productType: 'Generic Medicine' as VendorProductType,
    category: '',
    categoryPath: [] as string[],
    categories: [] as string[],
    subcategory: '',
    potency: '',
    quantity: '',
    quantityUnit: 'None',
    diseasePaths: [] as string[][],
    diseaseCategory: '',
    diseaseSubcategory: '',
    benefit: '',
    requiresPrescription: false,
    popularSection: 'None',
    stock: '',
    image: '',
  });
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedEditProductImage, setSelectedEditProductImage] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string>('');
  const [categoryConfig, setCategoryConfig] = useState<DynamicCategoryConfig | null>(null);
  const { uploadImage, uploading: imageUploading, error: uploadError, previewUrl } = useImageUpload();

  const activeVendorCategoryMap: Record<string, string[]> =
    categoryConfig?.vendorCategoryMap && Object.keys(categoryConfig.vendorCategoryMap).length > 0
      ? categoryConfig.vendorCategoryMap
      : (VENDOR_CATEGORY_MAP as unknown as Record<string, string[]>);

  const activeDiseaseCategoryMap: Record<string, string[]> =
    categoryConfig?.diseaseSubcategoryMap && Object.keys(categoryConfig.diseaseSubcategoryMap).length > 0
      ? categoryConfig.diseaseSubcategoryMap
      : (DISEASE_SUBCATEGORY_MAP as unknown as Record<string, string[]>);

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

  // ── Build dynamic category hierarchy ──────────────────────────────────────
  const findNodeByName = (nodes: any[], name: string): any => {
    for (const node of nodes) {
      if (node.name === name) return node;
      if (node.children) {
        const found = findNodeByName(node.children, name);
        if (found) return found;
      }
    }
    return null;
  };

  const getNodeChildren = (nodeName: string | null, treeData: any[]): string[] => {
    if (!nodeName) {
      // Get product types (top-level children under Product Types root)
      const productTypesRoot = treeData.find((n: any) => n.name === 'Product Types');
      if (productTypesRoot?.children) {
        return productTypesRoot.children.map((n: any) => n.name).filter((n: any) => n);
      }
      return [];
    }
    const node = findNodeByName(treeData, nodeName);
    if (node?.children) {
      return node.children.map((n: any) => n.name).filter((n: any) => n);
    }
    return [];
  };

  const findCategoryPathFromTree = (productType: string, targetCategory: string): string[] => {
    const productTypesRoot = categoryTree.find((n: any) => n.name === 'Product Types');
    if (!productTypesRoot || !productTypesRoot.children) return [targetCategory];

    const productTypeNode = productTypesRoot.children.find((node: any) => node.name === productType);
    if (!productTypeNode) return [targetCategory];

    const searchPath = (node: any, target: string, path: string[]): string[] | null => {
      if (node.name === target) {
        return path;
      }
      if (!node.children) return null;
      for (const child of node.children) {
        const result = searchPath(child, target, [...path, child.name]);
        if (result) return result;
      }
      return null;
    };

    const foundPath = searchPath(productTypeNode, targetCategory, []);
    return foundPath || [targetCategory];
  };

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    const info = localStorage.getItem('vendorInfo');

    if (!token || !info) {
      router.push('/vendor/login');
      return;
    }

    const vendorData = JSON.parse(info);
    setVendorInfo(vendorData);
    fetchProducts(vendorData._id);
    fetchVendorOrders(vendorData._id);
  }, [router]);

  useEffect(() => {
    const fetchCategoryConfig = async () => {
      try {
        const [configRes, treeRes] = await Promise.all([
          fetch('/api/categories?mode=config'),
          fetch('/api/categories')
        ]);
        const configData = await configRes.json();
        const treeData = await treeRes.json();
        if (configData?.success && configData?.config) {
          setCategoryConfig(configData.config);
        }
        if (treeData?.success && treeData?.tree) {
          setCategoryTree(treeData.tree);
        }
      } catch {}
    };

    fetchCategoryConfig();
  }, []);

  const fetchProducts = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendor/products?vendorId=${vendorId}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorOrders = (vendorId: string) => {
    try {
      // Get all orders from localStorage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // Filter orders that contain items from this vendor
      const vendorOrdersList = allOrders.filter((order: any) => {
        if (!order.items) return false;
        // Check if any item in the order belongs to this vendor
        return order.items.some((item: any) => 
          item.vendorId === vendorId || item.vendorId === 'default-vendor'
        );
      });
      
      setVendorOrders(vendorOrdersList);
    } catch (err) {
      console.error('Error fetching vendor orders:', err);
      setVendorOrders([]);
    }
  };

  const getOrderId = (order: any): string => {
    return String(order?._id || order?.id || order?.orderId || '').trim();
  };

  const getOrderStatusColor = (status: string) => {
    switch ((status || 'pending').toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    if (!vendorInfo?._id) return;

    const normalizedStatus = String(newStatus || 'pending').toLowerCase();
    if (!ORDER_STATUS_OPTIONS.includes(normalizedStatus as typeof ORDER_STATUS_OPTIONS[number])) {
      return;
    }

    try {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map((order: any) => {
        const currentOrderId = getOrderId(order);
        if (currentOrderId !== orderId) return order;

        const belongsToVendor = Array.isArray(order.items) && order.items.some((item: any) => {
          const itemVendorId = String(item?.vendorId || '').trim();
          return itemVendorId === vendorInfo._id || itemVendorId === 'default-vendor';
        });

        if (!belongsToVendor) return order;

        return {
          ...order,
          status: normalizedStatus,
          updatedAt: new Date().toISOString(),
        };
      });

      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      fetchVendorOrders(vendorInfo._id);

      const updatedSelectedOrder = updatedOrders.find((order: any) => getOrderId(order) === orderId);
      if (updatedSelectedOrder) {
        setSelectedOrder(updatedSelectedOrder);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleAddProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('vendorToken');

    try {
      // Validate required fields
      if (!newProduct.name || newProduct.name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      if (!newProduct.price || isNaN(parseFloat(newProduct.price))) {
        throw new Error('Valid product price is required');
      }

      if (!newProduct.usdPrice || isNaN(parseFloat(newProduct.usdPrice))) {
        throw new Error('Valid USD dollar price is required');
      }
      
      if (!newProduct.categoryPath || newProduct.categoryPath.length === 0) {
        throw new Error('Category hierarchy must be selected');
      }

      if (!imageUrl) {
        throw new Error('Please upload image to Cloudinary first');
      }

      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vendorId: vendorInfo?._id,
          ...newProduct,
          category: newProduct.categoryPath[0] || undefined,
          subcategory: newProduct.categoryPath[1] || newProduct.subcategory || undefined,
          categories: newProduct.categoryPath,
          popularSection: newProduct.popularSection || 'None',
          diseasePaths: newProduct.diseasePaths || [],
          diseaseCategory: newProduct.diseasePaths?.[0]?.[0] || newProduct.diseaseCategory || undefined,
          diseaseSubcategory: newProduct.diseasePaths?.[0]?.[1] || newProduct.diseaseSubcategory || undefined,
          potency: newProduct.potency || undefined,
          price: parseFloat(newProduct.price),
          usdPrice: newProduct.usdPrice ? parseFloat(newProduct.usdPrice) : undefined,
          mrp: newProduct.mrp && !isNaN(parseFloat(newProduct.mrp)) ? parseFloat(newProduct.mrp) : undefined,
          quantity: newProduct.quantity && !isNaN(parseFloat(newProduct.quantity)) ? parseFloat(newProduct.quantity) : undefined,
          stock: newProduct.stock && !isNaN(parseInt(newProduct.stock)) ? parseInt(newProduct.stock) : 0,
          image: imageUrl,
        }),
      });

      const createdData = await response.json();
      if (!response.ok) throw new Error(createdData.error || 'Failed to add product');

      setNewProduct({
        name: '',
        brand: '',
        description: '',
        safetyInformation: '',
        specifications: '',
        price: '',
        usdPrice: '',
        mrp: '',
        productType: 'Generic Medicine',
        category: '',
        categoryPath: [],
        categories: [],
        subcategory: '',
        potency: '',
        quantity: '',
        quantityUnit: 'None',
        diseasePaths: [],
        diseaseCategory: '',
        diseaseSubcategory: '',
        benefit: '',
        requiresPrescription: false,
        isPopular: false,
        isPopularGeneric: false,
        isPopularAyurveda: false,
        isPopularHomeopathy: false,
        isPopularLabTests: false,
        popularSection: 'None',
        stock: '',
        image: '',
      });
      setSelectedProductImage(null);
      setImageUrl('');
      setShowAddProduct(false);
      alert(createdData.message || 'Product submitted for admin approval');
      if (vendorInfo) {
        fetchProducts(vendorInfo._id);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + error);
    }
  };

  const handleEditProduct = (product: Product) => {
    const inferredType =
      (Object.entries(activeVendorCategoryMap).find(([, categories]) =>
        (categories || []).includes(product.category)
      )?.[0] as VendorProductType) || inferProductTypeFromCategory(product.category);
    const normalizedCategory = product.category || getDefaultCategoryForTypeDynamic(inferredType);
    const inferredProductType = (product.productType as VendorProductType) || inferredType;
    const editCategoryPath = findCategoryPathFromTree(inferredProductType, normalizedCategory);
    const isHomeopathy = inferredProductType === 'Homeopathy';
    const isAyurveda = inferredProductType === 'Ayurveda Medicine';
    const isNutrition = inferredProductType === 'Nutrition';
    const isPersonalCare = inferredProductType === 'Personal Care';
    const isBabyCare = inferredProductType === 'Baby Care';
    const isFitness = inferredProductType === 'Fitness';
    const isUnani = inferredProductType === 'Unani';
    setEditingProductId(product._id);
    setEditProduct({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      safetyInformation: product.safetyInformation || '',
      specifications: product.specifications || '',
      price: String(product.price ?? ''),
      usdPrice: String((product as any).usdPrice || ''),
      mrp: product.mrp !== undefined ? String(product.mrp) : '',
      productType: product.productType as VendorProductType || inferredType,
      category: normalizedCategory,
      categoryPath: editCategoryPath,
      categories: (product as any).categories || [],
      subcategory: product.subcategory || (
        isHomeopathy ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isAyurveda ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isNutrition ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isPersonalCare ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isBabyCare ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isFitness ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : isUnani ? getDefaultSubcategoryForTypeDynamic(inferredProductType, normalizedCategory)
          : ''
      ),
      potency: product.potency || '',
      quantity: product.quantity !== undefined ? String(product.quantity) : '',
      quantityUnit: product.quantityUnit || 'None',
      diseasePaths: Array.isArray((product as any).diseasePaths)
        ? (product as any).diseasePaths
        : ((product.diseaseCategory || product.diseaseSubcategory)
          ? [[product.diseaseCategory || '', product.diseaseSubcategory || '']]
          : []),
      diseaseCategory: product.diseaseCategory || '',
      diseaseSubcategory: product.diseaseSubcategory || '',
      benefit: product.benefit || '',
      requiresPrescription: product.requiresPrescription || false,
      popularSection: (product as any).popularSection ||
        ((product as any).isPopularGeneric ? 'Generic' :
         (product as any).isPopularAyurveda ? 'Ayurveda' :
         (product as any).isPopularHomeopathy ? 'Homeopathy' :
         (product as any).isPopularLabTests ? 'LabTests' :
         (product as any).isPopular ? 'Generic' :
         'None'),
      stock: String(product.stock ?? ''),
      image: product.image || '',
    });
    setSelectedEditProductImage(null);
    setEditImagePreviewUrl(product.image || '');
    setShowEditProduct(true);
    setShowAddProduct(false);
  };

  const handleUpdateProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('vendorToken');

    if (!editingProductId || !vendorInfo?._id) {
      alert('Unable to update product. Missing product or vendor details.');
      return;
    }

    if (!editProduct.categoryPath || editProduct.categoryPath.length === 0) {
      alert('Category hierarchy must be selected');
      return;
    }

    if (!editProduct.usdPrice || isNaN(parseFloat(editProduct.usdPrice))) {
      alert('Valid USD dollar price is required');
      return;
    }

    try {
      let imageUrl = editProduct.image;

      if (selectedEditProductImage) {
        const uploadResult = await uploadImage(selectedEditProductImage);
        if (!uploadResult?.success || !uploadResult.imageUrl) {
          throw new Error(uploadResult?.error || 'Image upload failed');
        }
        imageUrl = uploadResult.imageUrl;
      }

      const response = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: editingProductId,
          vendorId: vendorInfo._id,
          name: editProduct.name,
          description: editProduct.description,
          price: parseFloat(editProduct.price),
          usdPrice: editProduct.usdPrice ? parseFloat(editProduct.usdPrice) : undefined,
          mrp: editProduct.mrp ? parseFloat(editProduct.mrp) : undefined,
          quantity: editProduct.quantity ? parseFloat(editProduct.quantity) : undefined,
          stock: parseInt(editProduct.stock),
          productType: editProduct.productType,
          category: editProduct.categoryPath?.[0] || editProduct.category,
          categories: editProduct.categoryPath && editProduct.categoryPath.length > 0 ? editProduct.categoryPath : editProduct.category ? [editProduct.category] : [],
          subcategory: editProduct.categoryPath?.[1] || editProduct.subcategory || undefined,
          potency: editProduct.potency || undefined,
          quantityUnit: editProduct.quantityUnit || 'None',
          popularSection: editProduct.popularSection || 'None',
          diseasePaths: editProduct.diseasePaths || [],
          diseaseCategory: editProduct.diseasePaths?.[0]?.[0] || editProduct.diseaseCategory || undefined,
          diseaseSubcategory: editProduct.diseasePaths?.[0]?.[1] || editProduct.diseaseSubcategory || undefined,
          benefit: editProduct.benefit || undefined,
          safetyInformation: editProduct.safetyInformation,
          specifications: editProduct.specifications,
          brand: editProduct.brand || undefined,
          requiresPrescription: editProduct.requiresPrescription,
          image: imageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setShowEditProduct(false);
      setEditingProductId(null);
      setSelectedEditProductImage(null);
      setEditImagePreviewUrl('');

      if (vendorInfo) {
        fetchProducts(vendorInfo._id);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure?')) return;

    const token = localStorage.getItem('vendorToken');
    if (!vendorInfo?._id) {
      alert('Vendor information missing. Please login again.');
      return;
    }

    try {
      const params = new URLSearchParams({
        productId,
        vendorId: vendorInfo._id,
      });

      const response = await fetch(`/api/vendor/products?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete product');
      if (vendorInfo) {
        fetchProducts(vendorInfo._id);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  if (!vendorInfo) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{vendorInfo.vendorName}</h1>
              <p className="text-gray-600 text-sm mt-1">
                Status: <span className="font-semibold text-emerald-600">{vendorInfo.status}</span>
              </p>
              {vendorInfo.status === 'verified' && (
                <p className="text-gray-600 text-sm">
                  Rating: ⭐ {vendorInfo.rating || 'Not rated yet'}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/vendor/dashboard/lab-bookings"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View Lab Booking History
            </Link>
          </div>
        </div>

        {vendorInfo.status !== 'verified' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-8">
            ⚠️ Your account is {vendorInfo.status}. You cannot add products until your account is verified by admin.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 font-semibold ${
              tab === 'overview'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('products')}
            className={`px-4 py-2 font-semibold ${
              tab === 'products'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-4 py-2 font-semibold ${
              tab === 'orders'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-4 py-2 font-semibold ${
              tab === 'analytics'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-600'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-500 text-sm font-semibold">Total Products</h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{products.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-500 text-sm font-semibold">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {vendorInfo.totalOrders || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-500 text-sm font-semibold">Rating</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                ⭐ {vendorInfo.rating || 'N/A'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-500 text-sm font-semibold">Commission</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{vendorInfo.commissionPercentage || 10}%</p>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === 'products' && (
          <div>
            {vendorInfo.status === 'verified' && (
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap mb-6"
              >
                {showAddProduct ? 'Cancel' : '+ Add Product'}
              </button>
            )}

            {showAddProduct && (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Product</h2>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="mb-6 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Medicine Image</label>

                    {imageUrl && (
                      <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-600 mb-2 font-medium">Current Image:</p>
                        <div className="flex gap-3 items-start">
                          <img
                            src={imageUrl}
                            alt="Current"
                            className="h-24 w-24 object-cover rounded-lg border border-slate-300"
                          />
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 truncate mb-2">URL: {imageUrl}</p>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm('Delete this image? You can upload a new one.')) return;
                                const publicId = extractPublicIdFromUrl(imageUrl);
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
                                    setImageUrl('');
                                    setSelectedProductImage(null);
                                    alert('✅ Image deleted successfully');
                                  } else {
                                    alert('❌ Failed to delete image');
                                  }
                                } catch {
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

                    {previewUrl && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-600 mb-2">Preview:</p>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border border-slate-300"
                        />
                      </div>
                    )}

                    {selectedProductImage && (
                      <button
                        type="button"
                        onClick={() => setSelectedProductImage(null)}
                        className="mb-3 text-red-600 hover:text-red-800 text-xs font-semibold"
                      >
                        Delete Selected Image
                      </button>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        setSelectedProductImage(file || null);
                        if (file) {
                          const result = await uploadImage(file);
                          if (result?.success && result.imageUrl) {
                            setImageUrl(result.imageUrl);
                          }
                        }
                      }}
                      disabled={imageUploading}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />

                    {uploadError && (
                      <p className="mt-2 text-red-600 text-sm font-medium">❌ {uploadError}</p>
                    )}

                    {imageUploading && (
                      <p className="mt-2 text-blue-600 text-sm font-medium">⏳ Uploading image...</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={newProduct.productType}
                      onChange={(e) => {
                        const productType = e.target.value as VendorProductType;
                        setNewProduct({
                          ...newProduct,
                          productType,
                          category: '',
                          categoryPath: [],
                          subcategory: '',
                        });
                      }}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      {productTypeOptions.map((productType) => (
                        <option key={productType} value={productType}>{productType}</option>
                      ))}
                    </select>
                    {(() => {
                      const productTypeName = newProduct.productType || 'Generic Medicine';
                      const hierarchyLevels: string[][] = [];
                      let currentLevelName: string | null = productTypeName;

                      for (let i = 0; i < 10; i++) {
                        const options = getNodeChildren(currentLevelName, categoryTree);
                        if (!options || options.length === 0) break;
                        hierarchyLevels.push(options);

                        if (i < newProduct.categoryPath.length) {
                          currentLevelName = newProduct.categoryPath[i];
                        } else {
                          break;
                        }
                      }

                      if (hierarchyLevels.length === 0) {
                        const staticLevels: string[][] = [];
                        const firstLevel = (activeVendorCategoryMap[productTypeName] || []);
                        if (firstLevel.length > 0) staticLevels.push(firstLevel);
                        if (newProduct.categoryPath[0]) {
                          const secondLevel = getSubcategoryOptionsForType(productTypeName, newProduct.categoryPath[0]);
                          if (secondLevel.length > 0) staticLevels.push(secondLevel);
                        }
                        hierarchyLevels.push(...staticLevels);
                      }

                      return (
                        <>
                          {hierarchyLevels.map((options, levelIdx) => (
                            <select
                              key={`hierarchy-${levelIdx}`}
                              value={newProduct.categoryPath[levelIdx] || ''}
                              onChange={(e) => {
                                const newPath = newProduct.categoryPath.slice(0, levelIdx);
                                if (e.target.value) newPath.push(e.target.value);
                                setNewProduct({
                                  ...newProduct,
                                  categoryPath: newPath,
                                  category: newPath[0] || '',
                                  subcategory: newPath[1] || '',
                                });
                              }}
                              className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                            >
                              <option value="">{levelIdx === 0 ? 'Select Category' : `Level ${levelIdx + 1}`}</option>
                              {options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ))}
                        </>
                      );
                    })()}
                    <div className="md:col-span-3 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-800">Diseases / Conditions (Optional)</label>
                        <button
                          type="button"
                          onClick={() => setNewProduct({ ...newProduct, diseasePaths: [...(newProduct.diseasePaths || []), ['', '']] })}
                          className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                        >
                          + Add Disease
                        </button>
                      </div>
                      {(newProduct.diseasePaths || []).map((path, idx) => (
                        <div key={`disease-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <select
                            value={path[0] || ''}
                            onChange={(e) => {
                              const updated = [...(newProduct.diseasePaths || [])];
                              updated[idx] = [e.target.value, ''];
                              setNewProduct({ ...newProduct, diseasePaths: updated });
                            }}
                            className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                          >
                            <option value="">Select Disease Category</option>
                            {Object.keys(activeDiseaseCategoryMap).map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          <select
                            value={path[1] || ''}
                            onChange={(e) => {
                              const updated = [...(newProduct.diseasePaths || [])];
                              updated[idx] = [path[0] || '', e.target.value];
                              setNewProduct({ ...newProduct, diseasePaths: updated });
                            }}
                            className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                          >
                            <option value="">Select Disease Subcategory</option>
                            {(activeDiseaseCategoryMap[path[0]] || []).map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(newProduct.diseasePaths || [])];
                              updated.splice(idx, 1);
                              setNewProduct({ ...newProduct, diseasePaths: updated });
                            }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Brand"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Price ₹ *"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Dollar Price USD *"
                      value={newProduct.usdPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, usdPrice: e.target.value })}
                      required
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="MRP ₹"
                      value={newProduct.mrp}
                      onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Stock Qty"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={newProduct.potency}
                      onChange={(e) => setNewProduct({ ...newProduct, potency: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      <option value="">Potency (Optional)</option>
                      {POTENCY_OPTIONS.map((potency) => (
                        <option key={potency} value={potency}>{potency}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Quantity (Optional)"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={newProduct.quantityUnit}
                      onChange={(e) => setNewProduct({ ...newProduct, quantityUnit: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      {QUANTITY_UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Benefit tag (e.g. Immunity)"
                      value={newProduct.benefit}
                      onChange={(e) => setNewProduct({ ...newProduct, benefit: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <textarea
                      placeholder="Description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={2}
                    />
                    <textarea
                      placeholder="Safety Information (one point per line)"
                      value={newProduct.safetyInformation}
                      onChange={(e) => setNewProduct({ ...newProduct, safetyInformation: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={3}
                    />
                    <textarea
                      placeholder="Specifications (one point per line)"
                      value={newProduct.specifications}
                      onChange={(e) => setNewProduct({ ...newProduct, specifications: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={3}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mb-6 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={newProduct.requiresPrescription}
                      onChange={(e) => setNewProduct({ ...newProduct, requiresPrescription: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Requires Prescription (Rx)</span>
                  </label>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <label className="block text-sm font-semibold text-slate-900 mb-3">Display in Popular Sections</label>
                    <select
                      value={newProduct.popularSection}
                      onChange={(e) => setNewProduct({ ...newProduct, popularSection: e.target.value as 'None' | 'Generic' | 'Ayurveda' | 'Homeopathy' | 'LabTests' })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      <option value="None">None</option>
                      <option value="Generic">Popular Medicines</option>
                      <option value="Ayurveda">Popular Ayurveda Products</option>
                      <option value="Homeopathy">Popular Homeopathy Products</option>
                      <option value="LabTests">Popular Lab Tests</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={imageUploading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {imageUploading ? 'Uploading Image...' : 'Add Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProduct(false);
                        setSelectedProductImage(null);
                        setImageUrl('');
                      }}
                      className="border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showEditProduct && (
              <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Product</h2>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="mb-6 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Medicine Image</label>
                    {(editImagePreviewUrl || editProduct.image) && (
                      <div className="mb-3 p-3 bg-white border border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-600 mb-2 font-medium">Current Image:</p>
                        <div className="flex items-center gap-3">
                          <img
                            src={editImagePreviewUrl || editProduct.image}
                            alt="Current product"
                            className="h-24 w-24 rounded-lg object-cover border border-slate-300"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete current image? You can upload a new one.')) return;

                              const currentImageUrl = editProduct.image || '';
                              if (currentImageUrl && isCloudinaryImageUrl(currentImageUrl)) {
                                const publicId = extractPublicIdFromUrl(currentImageUrl);
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
                                  if (!res.ok) {
                                    alert('Failed to delete image');
                                    return;
                                  }
                                } catch {
                                  alert('Error deleting image');
                                  return;
                                }
                              }

                              setEditProduct({ ...editProduct, image: '' });
                              setSelectedEditProductImage(null);
                              setEditImagePreviewUrl('');
                            }}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            Delete Image
                          </button>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedEditProductImage(file);
                        if (file) {
                          const preview = URL.createObjectURL(file);
                          setEditImagePreviewUrl(preview);
                        }
                      }}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={editProduct.name}
                      onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                      required
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={editProduct.productType}
                      onChange={(e) => {
                        const productType = e.target.value as VendorProductType;
                        setEditProduct({
                          ...editProduct,
                          productType,
                          category: '',
                          categoryPath: [],
                          subcategory: '',
                        });
                      }}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      {productTypeOptions.map((productType) => (
                        <option key={productType} value={productType}>{productType}</option>
                      ))}
                    </select>
                    {(() => {
                      const productTypeName = editProduct.productType || 'Generic Medicine';
                      const hierarchyLevels: string[][] = [];
                      let currentLevelName: string | null = productTypeName;

                      for (let i = 0; i < 10; i++) {
                        const options = getNodeChildren(currentLevelName, categoryTree);
                        if (!options || options.length === 0) break;
                        hierarchyLevels.push(options);

                        if (i < editProduct.categoryPath.length) {
                          currentLevelName = editProduct.categoryPath[i];
                        } else {
                          break;
                        }
                      }

                      if (hierarchyLevels.length === 0) {
                        const staticLevels: string[][] = [];
                        const firstLevel = (activeVendorCategoryMap[productTypeName] || []);
                        if (firstLevel.length > 0) staticLevels.push(firstLevel);
                        if (editProduct.categoryPath[0]) {
                          const secondLevel = getSubcategoryOptionsForType(productTypeName, editProduct.categoryPath[0]);
                          if (secondLevel.length > 0) staticLevels.push(secondLevel);
                        }
                        hierarchyLevels.push(...staticLevels);
                      }

                      return (
                        <>
                          {hierarchyLevels.map((options, levelIdx) => (
                            <select
                              key={`hierarchy-edit-${levelIdx}`}
                              value={editProduct.categoryPath[levelIdx] || ''}
                              onChange={(e) => {
                                const newPath = editProduct.categoryPath.slice(0, levelIdx);
                                if (e.target.value) newPath.push(e.target.value);
                                setEditProduct({
                                  ...editProduct,
                                  categoryPath: newPath,
                                  category: newPath[0] || '',
                                  subcategory: newPath[1] || '',
                                });
                              }}
                              className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                            >
                              <option value="">{levelIdx === 0 ? 'Select Category' : `Level ${levelIdx + 1}`}</option>
                              {options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ))}
                        </>
                      );
                    })()}
                    <div className="md:col-span-3 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-800">Diseases / Conditions (Optional)</label>
                        <button
                          type="button"
                          onClick={() => setEditProduct({ ...editProduct, diseasePaths: [...(editProduct.diseasePaths || []), ['', '']] })}
                          className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                        >
                          + Add Disease
                        </button>
                      </div>
                      {(editProduct.diseasePaths || []).map((path, idx) => (
                        <div key={`edit-disease-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <select
                            value={path[0] || ''}
                            onChange={(e) => {
                              const updated = [...(editProduct.diseasePaths || [])];
                              updated[idx] = [e.target.value, ''];
                              setEditProduct({ ...editProduct, diseasePaths: updated });
                            }}
                            className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                          >
                            <option value="">Select Disease Category</option>
                            {Object.keys(activeDiseaseCategoryMap).map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          <select
                            value={path[1] || ''}
                            onChange={(e) => {
                              const updated = [...(editProduct.diseasePaths || [])];
                              updated[idx] = [path[0] || '', e.target.value];
                              setEditProduct({ ...editProduct, diseasePaths: updated });
                            }}
                            className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                          >
                            <option value="">Select Disease Subcategory</option>
                            {(activeDiseaseCategoryMap[path[0]] || []).map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editProduct.diseasePaths || [])];
                              updated.splice(idx, 1);
                              setEditProduct({ ...editProduct, diseasePaths: updated });
                            }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Brand"
                      value={editProduct.brand}
                      onChange={(e) => setEditProduct({ ...editProduct, brand: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Price ₹ *"
                      value={editProduct.price}
                      onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                      required
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Dollar Price USD *"
                      value={editProduct.usdPrice}
                      onChange={(e) => setEditProduct({ ...editProduct, usdPrice: e.target.value })}
                      required
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="MRP ₹"
                      value={editProduct.mrp}
                      onChange={(e) => setEditProduct({ ...editProduct, mrp: e.target.value })}
                      step="0.01"
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="number"
                      placeholder="Stock Qty"
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={editProduct.potency}
                      onChange={(e) => setEditProduct({ ...editProduct, potency: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      <option value="">Potency (Optional)</option>
                      {POTENCY_OPTIONS.map((potency) => (
                        <option key={potency} value={potency}>{potency}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Quantity (Optional)"
                      value={editProduct.quantity}
                      onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <select
                      value={editProduct.quantityUnit}
                      onChange={(e) => setEditProduct({ ...editProduct, quantityUnit: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      {QUANTITY_UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Benefit tag (e.g. Immunity)"
                      value={editProduct.benefit}
                      onChange={(e) => setEditProduct({ ...editProduct, benefit: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    />
                    <textarea
                      placeholder="Description"
                      value={editProduct.description}
                      onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={2}
                    />
                    <textarea
                      placeholder="Safety Information (one point per line)"
                      value={editProduct.safetyInformation}
                      onChange={(e) => setEditProduct({ ...editProduct, safetyInformation: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={3}
                    />
                    <textarea
                      placeholder="Specifications (one point per line)"
                      value={editProduct.specifications}
                      onChange={(e) => setEditProduct({ ...editProduct, specifications: e.target.value })}
                      className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm md:col-span-3"
                      rows={3}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mb-6 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={editProduct.requiresPrescription}
                      onChange={(e) => setEditProduct({ ...editProduct, requiresPrescription: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Requires Prescription (Rx)</span>
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <label className="block text-sm font-semibold text-slate-900 mb-3">Display in Popular Sections</label>
                    <select
                      value={editProduct.popularSection}
                      onChange={(e) => setEditProduct({ ...editProduct, popularSection: e.target.value as 'None' | 'Generic' | 'Ayurveda' | 'Homeopathy' | 'LabTests' })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                    >
                      <option value="None">None</option>
                      <option value="Generic">Popular Medicines</option>
                      <option value="Ayurveda">Popular Ayurveda Products</option>
                      <option value="Homeopathy">Popular Homeopathy Products</option>
                      <option value="LabTests">Popular Lab Tests</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={imageUploading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                    >
                      {imageUploading ? 'Uploading Image...' : 'Update Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditProduct(false);
                        setEditingProductId(null);
                        setSelectedEditProductImage(null);
                        setEditImagePreviewUrl('');
                      }}
                      className="border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {products.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No products yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Approval</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-md object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                                💊
                              </div>
                            )}
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{product.productType || 'Generic Medicine'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : product.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.approvalStatus || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">₹{product.price}</td>
                        <td className="px-6 py-4">{product.stock}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Your Orders ({vendorOrders.length})</h3>
              
              {vendorOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorOrders.map((order, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium">#{getOrderId(order)?.substring(0, 8)}</td>
                          <td className="px-6 py-4 text-sm">
                            <div>{order.customerName || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">₹{(order.totalAmount || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={String(order.status || 'pending').toLowerCase()}
                              onChange={(e) => updateOrderStatus(getOrderId(order), e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${getOrderStatusColor(
                                order.status || 'pending'
                              )}`}
                            >
                              {ORDER_STATUS_OPTIONS.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                  {statusOption}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-900 font-semibold"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-500 text-center">Analytics feature coming soon</p>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="text-lg font-semibold text-gray-900">#{selectedOrder._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="border-t border-b py-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customerEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border-t border-b py-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                {selectedOrder.deliveryAddress ? (
                  <div className="text-gray-700 text-sm space-y-1">
                    <p><strong>Full Name:</strong> {selectedOrder.deliveryAddress.fullName || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedOrder.deliveryAddress.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress.addressLine1 || 'N/A'}</p>
                    {selectedOrder.deliveryAddress.addressLine2 && <p><strong>Address 2:</strong> {selectedOrder.deliveryAddress.addressLine2}</p>}
                    <p><strong>City:</strong> {selectedOrder.deliveryAddress.city || 'N/A'}</p>
                    <p><strong>State:</strong> {selectedOrder.deliveryAddress.state || 'N/A'}</p>
                    <p><strong>Pincode:</strong> {selectedOrder.deliveryAddress.pincode || 'N/A'}</p>
                    <p><strong>Country:</strong> {selectedOrder.deliveryAddress.country || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No address provided</p>
                )}
              </div>

              {/* Order Items */}
              <div className="border-t border-b py-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No items in order</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-lg">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Status Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">{selectedOrder.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Status</p>
                  <select
                    value={String(selectedOrder.status || 'pending').toLowerCase()}
                    onChange={(e) => updateOrderStatus(getOrderId(selectedOrder), e.target.value)}
                    className={`font-medium px-3 py-1 rounded-full w-fit text-sm cursor-pointer ${getOrderStatusColor(
                      selectedOrder.status || 'pending'
                    )}`}
                  >
                    {ORDER_STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowOrderModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
