import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

const SEED_PRODUCTS = [
  { name: 'Azithromycin 500mg', brand: 'Cipla', category: 'Antibiotics', price: 89, mrp: 120, discount: 26, description: 'Broad-spectrum antibiotic for respiratory and skin infections', stock: 500, rating: 4.5, reviews: 1823, requiresPrescription: true, healthConcerns: ['infections'], isActive: true },
  { name: 'Paracetamol 650mg', brand: 'GSK', category: 'Pain Relief', price: 32, mrp: 45, discount: 29, description: 'Fast-acting fever and pain reliever for adults', stock: 1200, rating: 4.8, reviews: 5421, requiresPrescription: false, healthConcerns: ['fever', 'pain'], isActive: true },
  { name: 'Pantoprazole 40mg', brand: 'Sun Pharma', category: 'Gastric', price: 78, mrp: 110, discount: 29, description: 'Proton pump inhibitor for acid reflux and ulcers', stock: 800, rating: 4.6, reviews: 2109, requiresPrescription: true, healthConcerns: ['digestion'], isActive: true },
  { name: 'Metformin 500mg', brand: 'USV', category: 'Diabetes', price: 45, mrp: 65, discount: 31, description: 'First-line medication for Type 2 Diabetes management', stock: 900, rating: 4.7, reviews: 3201, requiresPrescription: true, healthConcerns: ['diabetes'], isActive: true },
  { name: 'Cetirizine 10mg', brand: 'Mankind', category: 'Allergy', price: 28, mrp: 40, discount: 30, description: 'Non-drowsy antihistamine for allergies and hay fever', stock: 1100, rating: 4.5, reviews: 1456, requiresPrescription: false, healthConcerns: ['allergy'], isActive: true },
  { name: 'Atorvastatin 10mg', brand: 'Torrent', category: 'Cardiac', price: 95, mrp: 135, discount: 30, description: 'Statin for lowering bad cholesterol and heart protection', stock: 600, rating: 4.6, reviews: 987, requiresPrescription: true, healthConcerns: ['heart care', 'cholesterol'], isActive: true },
  { name: 'Vitamin D3 60000 IU', brand: 'Healthvit', category: 'Vitamins', price: 120, mrp: 170, discount: 29, description: 'Weekly dose capsule for Vitamin D deficiency', stock: 700, rating: 4.7, reviews: 2891, requiresPrescription: false, healthConcerns: ['bone health'], isActive: true },
  { name: 'Amoxicillin 500mg', brand: 'Alkem', category: 'Antibiotics', price: 65, mrp: 90, discount: 28, description: 'Penicillin antibiotic for bacterial infections', stock: 450, rating: 4.4, reviews: 1234, requiresPrescription: true, healthConcerns: ['infections'], isActive: true },
  { name: 'Omeprazole 20mg', brand: 'Cipla', category: 'Gastric', price: 55, mrp: 80, discount: 31, description: 'For treating GERD, stomach ulcers and acid reflux', stock: 850, rating: 4.6, reviews: 1876, requiresPrescription: false, healthConcerns: ['digestion'], isActive: true },
  { name: 'Amlodipine 5mg', brand: 'Pfizer', category: 'Cardiac', price: 72, mrp: 100, discount: 28, description: 'Calcium channel blocker for hypertension and chest pain', stock: 550, rating: 4.5, reviews: 765, requiresPrescription: true, healthConcerns: ['heart care', 'blood pressure'], isActive: true },
  { name: 'Metronidazole 400mg', brand: 'Flagyl', category: 'Antibiotics', price: 48, mrp: 70, discount: 31, description: 'For bacterial and protozoal infections', stock: 600, rating: 4.3, reviews: 543, requiresPrescription: true, healthConcerns: ['infections'], isActive: true },
  { name: 'Multivitamin with Zinc', brand: 'Revital H', category: 'Vitamins', price: 185, mrp: 250, discount: 26, description: 'Complete daily multivitamin for energy and immunity', stock: 1000, rating: 4.7, reviews: 4321, requiresPrescription: false, healthConcerns: ['immunity', 'energy'], isActive: true },
  { name: 'Ibuprofen 400mg', brand: 'Brufen', category: 'Pain Relief', price: 38, mrp: 55, discount: 31, description: 'NSAID for pain, inflammation and fever', stock: 900, rating: 4.5, reviews: 2109, requiresPrescription: false, healthConcerns: ['pain', 'inflammation'], isActive: true },
  { name: 'Losartan 50mg', brand: 'Sun Pharma', category: 'Cardiac', price: 88, mrp: 120, discount: 27, description: 'ARB medication for high blood pressure', stock: 500, rating: 4.4, reviews: 678, requiresPrescription: true, healthConcerns: ['heart care', 'blood pressure'], isActive: true },
  { name: 'Dolo 650 (Paracetamol)', brand: 'Micro Labs', category: 'Pain Relief', price: 30, mrp: 42, discount: 29, description: 'Extended-release paracetamol for longer fever relief', stock: 2000, rating: 4.9, reviews: 8921, requiresPrescription: false, healthConcerns: ['fever', 'pain'], isActive: true },
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
