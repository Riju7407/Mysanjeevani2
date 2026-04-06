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
  price: number;
  mrp?: number;
  stock: number;
  category: string;
  productType?: string;
  description?: string;
  image?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

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
    'Himalaya', 'Organic India', 'Baidyanath', 'Dabur', 'Zandu', 'Charak', 'Aimil',
    'Ras & Sindoor', 'Bhasm & Pishti', 'Vati, Gutika & Guggulu', 'Asava Arishta & Kadha', 'Loha & Mandur', 'Churan, Powder, Avaleha & Pak', 'Tailam & Ghrita',
    'Chyawanprash', 'Honey', 'Digestives', 'Herbal & Vegetable Juice',
  ],
  Homeopathy: [
    'SBL', 'Dr. Reckeweg', 'Willmar Schwabe', 'Adel Pekana', 'Schwabe India', 'Bjain', 'R S Bhargava', 'Baksons', 'REPL', 'New Life',
    '3X', '6X', '3 CH', '6 CH', '12 CH', '30 CH', '200 CH', '1000 CH', '10M CH', '50M CH', 'CM CH',
    'Mother Tinctures', 'Biochemic', 'Triturations', 'Bio Combination', 'Bach Flower', 'Homeopathy Kits', 'Milleimal LM Potency',
    'Hair Care', 'Skin Care', 'Oral Care',
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
    'Proteins', 'Fat Burner', 'Weight Gainers', 'Pre Post Workout', 'Aminos', 'Creatines',
    'Organic Foods', 'Coffee & Tea', 'Ghee', 'Atta/Flour',
    'Spreads, Sugar & Honey', 'Oils', 'Health Drinks', 'Healthy Snacks & Bars', 'Sugar Free', 'Murabba', 'Edible Seeds',
  ],
  'Personal Care': [
    'Essential Oils', 'Face', 'Body', 'Foot Care', 'Sanitizers & Hand Wash',
    'Shampoo & Conditioners', 'Hair Oils & Creams', 'Hair Serum & Mask', 'Hair Color & Dyes', 'Henna Mehndi',
    'Beard Oils and Wax', 'Shaving Cream & Gels', 'Men Wellness',
    'Shower Gel & Hand Wash', 'Soaps', 'Talcs & Deos',
    'Toothpaste', 'Gums Care',
    'Intimate Care', 'Pregnancy & Maternity Care',
  ],
  Fitness: [
    'Shoulder Support', 'Elbow Support', 'Forearm Support', 'Wrist Support', 'Chest Support', 'Cervical Support', 'Back Support', 'Abdominal Support', 'Thigh Support', 'Knee Support', 'Calf Support', 'Ankle Support', 'Finger Splint', 'Compression Stockings', 'Insoles & Heel Cups',
    'Weighing Scales', 'BP Monitors', 'Thermometer', 'Respiratory Care', 'Activity Monitor', 'Hot and Cold Pads & Bottles',
    'Exercisers', 'Weights', 'Stethoscopes', 'Protective Gears', 'Hospital Beds',
    'Walking Sticks', 'Massagers', 'Disability Aids',
  ],
  'Sexual Wellness': [
    'Sexual Supplements', 'Condoms',
  ],
  Consultation: [
    'Homeo Treatment', 'Ayurveda Treatment', 'Unani Treatment', 'Diet Counselling',
  ],
  Unani: [
    'Habbe & Qurs', 'Majun & Jawarish', 'Safoof, Labub & Kushta', 'Sharbat, Sirka & Arq', 'Lauq & Saoot', 'Khamira & Itrifal', 'Roghan & Oils',
    'Hamdard', 'New Shama', 'Dehlvi', 'Rex',
  ],
  'Baby Care': [
    'Tonics & Supplements', 'Shampoos & Bath Gels', 'Baby Oils', 'Baby Powder', 'Soaps', 'Wipes & Diapers', 'Gift Packs',
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

function normalizeCategoryForType(productType: VendorProductType, category: string): string {
  const normalized = (category || '').trim().toLowerCase();

  if (productType === 'Generic Medicine' && (normalized === 'generic' || normalized === 'branded')) {
    return getDefaultCategoryForType(productType);
  }

  if (productType === 'Ayurveda Medicine' && (normalized === 'ayurvedic' || normalized === 'ayurveda')) {
    return getDefaultCategoryForType(productType);
  }

  if (productType === 'Homeopathy' && normalized === 'homeopathy') {
    return getDefaultCategoryForType(productType);
  }

  if (productType === 'Lab Tests' && (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest')) {
    return getDefaultCategoryForType(productType);
  }

  const exactMatch = VENDOR_CATEGORY_MAP[productType].find((c) => c.toLowerCase() === normalized);
  return exactMatch || getDefaultCategoryForType(productType);
}

export default function VendorDashboard() {
  const router = useRouter();
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    productType: 'Generic Medicine' as VendorProductType,
    category: getDefaultCategoryForType('Generic Medicine'),
    stock: '',
    image: '',
  });
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    productType: 'Generic Medicine' as VendorProductType,
    category: getDefaultCategoryForType('Generic Medicine'),
    stock: '',
    image: '',
  });
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
  const [selectedEditProductImage, setSelectedEditProductImage] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string>('');
  const { uploadImage, uploading: imageUploading } = useImageUpload();

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

  const handleAddProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('vendorToken');

    try {
      if (!selectedProductImage) {
        throw new Error('Please select a product image');
      }

      const uploadResult = await uploadImage(selectedProductImage);
      if (!uploadResult?.success || !uploadResult.imageUrl) {
        throw new Error(uploadResult?.error || 'Image upload failed');
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
          price: parseFloat(newProduct.price),
          mrp: newProduct.mrp ? parseFloat(newProduct.mrp) : undefined,
          stock: parseInt(newProduct.stock),
          image: uploadResult.imageUrl,
        }),
      });

      const createdData = await response.json();
      if (!response.ok) throw new Error(createdData.error || 'Failed to add product');

      setNewProduct({
        name: '',
        description: '',
        price: '',
        mrp: '',
        productType: 'Generic Medicine',
        category: getDefaultCategoryForType('Generic Medicine'),
        stock: '',
        image: '',
      });
      setSelectedProductImage(null);
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
    const inferredType = inferProductTypeFromCategory(product.category);
    const normalizedCategory = normalizeCategoryForType(inferredType, product.category);
    setEditingProductId(product._id);
    setEditProduct({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      mrp: product.mrp !== undefined ? String(product.mrp) : '',
      productType: product.productType as VendorProductType || inferredType,
      category: normalizedCategory,
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
          mrp: editProduct.mrp ? parseFloat(editProduct.mrp) : undefined,
          stock: parseInt(editProduct.stock),
          productType: editProduct.productType,
          category: editProduct.category,
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg mb-6"
              >
                {showAddProduct ? 'Cancel' : '+ Add Product'}
              </button>
            )}

            {showAddProduct && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={newProduct.productType}
                      onChange={(e) => {
                        const productType = e.target.value as VendorProductType;
                        setNewProduct({
                          ...newProduct,
                          productType,
                          category: getDefaultCategoryForType(productType),
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {(Object.keys(VENDOR_CATEGORY_MAP) as VendorProductType[]).map((productType) => (
                        <option key={productType} value={productType}>{productType}</option>
                      ))}
                    </select>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {VENDOR_CATEGORY_MAP[newProduct.productType].map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                      step="0.01"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="MRP"
                      value={newProduct.mrp}
                      onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                      required
                      step="0.01"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setSelectedProductImage(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={imageUploading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                  >
                    {imageUploading ? 'Uploading Image...' : 'Add Product'}
                  </button>
                </form>
              </div>
            )}

            {showEditProduct && (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-blue-200">
                <h3 className="text-lg font-semibold mb-4">Update Product</h3>
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={editProduct.name}
                      onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={editProduct.productType}
                      onChange={(e) => {
                        const productType = e.target.value as VendorProductType;
                        setEditProduct({
                          ...editProduct,
                          productType,
                          category: getDefaultCategoryForType(productType),
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {(Object.keys(VENDOR_CATEGORY_MAP) as VendorProductType[]).map((productType) => (
                        <option key={productType} value={productType}>{productType}</option>
                      ))}
                    </select>
                    <select
                      value={editProduct.category}
                      onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {VENDOR_CATEGORY_MAP[editProduct.productType].map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={editProduct.price}
                      onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                      required
                      step="0.01"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="MRP"
                      value={editProduct.mrp}
                      onChange={(e) => setEditProduct({ ...editProduct, mrp: e.target.value })}
                      required
                      step="0.01"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={editProduct.stock}
                      onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={editProduct.description}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Product Image (Optional)
                    </label>
                    {(editImagePreviewUrl || editProduct.image) && (
                      <div className="mb-3 flex items-center gap-3">
                        <img
                          src={editImagePreviewUrl || editProduct.image}
                          alt="Current product"
                          className="w-20 h-20 rounded-md object-cover border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('Delete current image? You can upload a new one.')) return;
                            setEditProduct({ ...editProduct, image: '' });
                            setSelectedEditProductImage(null);
                            setEditImagePreviewUrl('');
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium border border-red-200"
                        >
                          Delete Image
                        </button>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={imageUploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
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
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
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
                          <td className="px-6 py-4 text-sm font-medium">#{order._id?.substring(0, 8)}</td>
                          <td className="px-6 py-4 text-sm">
                            <div>{order.customerName || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">₹{(order.totalAmount || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status || 'pending'}
                            </span>
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
                    <p><strong>House No:</strong> {selectedOrder.deliveryAddress.houseNo || 'N/A'}</p>
                    <p><strong>Street:</strong> {selectedOrder.deliveryAddress.streetAddress || 'N/A'}</p>
                    <p><strong>City:</strong> {selectedOrder.deliveryAddress.city || 'N/A'}</p>
                    <p><strong>State:</strong> {selectedOrder.deliveryAddress.state || 'N/A'}</p>
                    <p><strong>Postal Code:</strong> {selectedOrder.deliveryAddress.postalCode || 'N/A'}</p>
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
                  <p className={`font-medium px-3 py-1 rounded-full w-fit text-sm ${
                    selectedOrder.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                    selectedOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedOrder.status || 'pending'}
                  </p>
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
