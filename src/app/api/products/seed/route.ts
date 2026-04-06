import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

const SEED_PRODUCTS = [
  // Disease - Mind
  { name: 'Stress Relief Tablet', brand: 'Cipla', category: 'Anxiety & Depression', price: 89, mrp: 120, discount: 26, description: 'Natural formula for anxiety and depression relief', stock: 500, rating: 4.5, reviews: 1823, requiresPrescription: true, healthConcerns: ['mental health'], isActive: true },
  { name: 'Sleep Easy Capsule', brand: 'GSK', category: 'Sleeplessness', price: 32, mrp: 45, discount: 29, description: 'Help you sleep peacefully at night', stock: 1200, rating: 4.8, reviews: 5421, requiresPrescription: false, healthConcerns: ['sleep'], isActive: true },
  // Disease - Respiratory
  { name: 'Asthma Relief Inhaler', brand: 'Sun Pharma', category: 'Asthma', price: 78, mrp: 110, discount: 29, description: 'Fast-acting asthma relief inhaler', stock: 800, rating: 4.6, reviews: 2109, requiresPrescription: true, healthConcerns: ['breathing'], isActive: true },
  { name: 'Cough Suppressant Syrup', brand: 'USV', category: 'Cough', price: 45, mrp: 65, discount: 31, description: 'Effective relief from dry and wet cough', stock: 900, rating: 4.7, reviews: 3201, requiresPrescription: true, healthConcerns: ['cough'], isActive: true },
  // Disease - Digestive
  { name: 'Acidity Relief Tablet', brand: 'Mankind', category: 'Indigestion/Acidity/Gas', price: 28, mrp: 40, discount: 30, description: 'Fast relief from acidity and indigestion', stock: 1100, rating: 4.5, reviews: 1456, requiresPrescription: false, healthConcerns: ['digestion'], isActive: true },
  { name: 'Diabetes Control Medicine', brand: 'Torrent', category: 'Diabetes', price: 95, mrp: 135, discount: 30, description: 'Helps maintain blood sugar levels', stock: 600, rating: 4.6, reviews: 987, requiresPrescription: true, healthConcerns: ['diabetes'], isActive: true },
  // Disease - Skin
  { name: 'Acne & Pimples Cream', brand: 'Healthvit', category: 'Acne & Pimples', price: 120, mrp: 170, discount: 29, description: 'Clears acne and pimples effectively', stock: 700, rating: 4.7, reviews: 2891, requiresPrescription: false, healthConcerns: ['skin'], isActive: true },
  { name: 'Hair Fall Shampoo', brand: 'Alkem', category: 'Hair Fall', price: 65, mrp: 90, discount: 28, description: 'Reduces hair fall and promotes growth', stock: 450, rating: 4.4, reviews: 1234, requiresPrescription: false, healthConcerns: ['hair'], isActive: true },
  // Ayurveda
  { name: 'Himalaya Ashwagandha', brand: 'Himalaya', category: 'Ras & Sindoor', price: 55, mrp: 80, discount: 31, description: 'Ayurvedic stress and anxiety relief', stock: 850, rating: 4.6, reviews: 1876, requiresPrescription: false, healthConcerns: ['wellness'], isActive: true },
  { name: 'Dabur Chyawanprash', brand: 'Dabur', category: 'Chyawanprash', price: 72, mrp: 100, discount: 28, description: 'Traditional immune booster and energy tonic', stock: 550, rating: 4.5, reviews: 765, requiresPrescription: false, healthConcerns: ['immunity'], isActive: true },
  // Homeopathy
  { name: 'SBL Arnica Montana 30', brand: 'SBL', category: '30 CH', price: 48, mrp: 70, discount: 31, description: 'Homeopathic remedy for injuries and trauma', stock: 600, rating: 4.3, reviews: 543, requiresPrescription: false, healthConcerns: ['injuries'], isActive: true },
  { name: 'Dr. Reckeweg Cold Relief', brand: 'Dr. Reckeweg', category: 'Mother Tinctures', price: 185, mrp: 250, discount: 26, description: 'Natural homeopathic cold and cough relief', stock: 1000, rating: 4.7, reviews: 4321, requiresPrescription: false, healthConcerns: ['cold'], isActive: true },
  // Nutrition
  { name: 'Whey Protein Powder', brand: 'MuscleBlaze', category: 'Proteins', price: 38, mrp: 55, discount: 31, description: 'High-quality protein for muscle building', stock: 900, rating: 4.5, reviews: 2109, requiresPrescription: false, healthConcerns: ['fitness'], isActive: true },
  { name: 'Organic Honey 500ml', brand: 'Nature Pure', category: 'Spreads, Sugar & Honey', price: 88, mrp: 120, discount: 27, description: 'Pure organic honey with natural enzymes', stock: 500, rating: 4.4, reviews: 678, requiresPrescription: false, healthConcerns: ['nutrition'], isActive: true },
  // Personal Care
  { name: 'Hair Growth Oil', brand: 'Brahmi', category: 'Hair Oils & Creams', price: 30, mrp: 42, discount: 29, description: 'Promotes hair growth and adds shine', stock: 2000, rating: 4.9, reviews: 8921, requiresPrescription: false, healthConcerns: ['hair care'], isActive: true },
];

export async function POST() {
  try {
    await connectDB();
    const count = await Product.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: `Already seeded with ${count} products`, seeded: 0 });
    }
    await Product.insertMany(SEED_PRODUCTS);
    return NextResponse.json({ message: `Seeded ${SEED_PRODUCTS.length} products`, seeded: SEED_PRODUCTS.length });
  } catch (error) {
    console.error('Product seed error:', error);
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 });
  }
}
