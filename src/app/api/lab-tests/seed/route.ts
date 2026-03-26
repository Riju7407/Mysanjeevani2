import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LabTest } from '@/lib/models/LabTest';

const SEED_TESTS = [
  { testId: 'LT001', testName: 'Full Body Checkup', description: 'Complete health screening with 80+ parameters including CBC, LFT, KFT, lipid profile, thyroid, and more.', price: 1499, mrp: 3500, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: true, fastingHours: 10, category: 'general', rating: 4.6, reviews: 523, icon: '🧪' },
  { testId: 'LT002', testName: 'Blood Sugar (HbA1c + Fasting)', description: 'Comprehensive diabetes screening including fasting glucose, post-meal glucose and HbA1c.', price: 299, mrp: 600, homeCollectionAvailable: true, reportTime: '12 hours', sampleType: 'blood', fasting: true, fastingHours: 8, category: 'diabetic', rating: 4.8, reviews: 892, icon: '🩸' },
  { testId: 'LT003', testName: 'Thyroid Profile (T3, T4, TSH)', description: 'Complete thyroid function test to detect hypothyroidism, hyperthyroidism and thyroid disorders.', price: 799, mrp: 1800, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: false, category: 'thyroid', rating: 4.7, reviews: 412, icon: '🧬' },
  { testId: 'LT004', testName: 'Lipid Profile', description: 'Measures total cholesterol, HDL, LDL and triglycerides for cardiovascular risk assessment.', price: 599, mrp: 1200, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: true, fastingHours: 12, category: 'cardiac', rating: 4.5, reviews: 634, icon: '📊' },
  { testId: 'LT005', testName: 'Liver Function Test (LFT)', description: 'Panel of tests including ALT, AST, ALP, bilirubin to assess liver health.', price: 699, mrp: 1500, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: false, category: 'liver', rating: 4.6, reviews: 345, icon: '🫘' },
  { testId: 'LT006', testName: 'Kidney Function Test (KFT)', description: 'Tests for creatinine, urea, uric acid, electrolytes to evaluate kidney function.', price: 749, mrp: 1600, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: false, category: 'kidney', rating: 4.7, reviews: 289, icon: '🫁' },
  { testId: 'LT007', testName: 'CBC (Complete Blood Count)', description: 'Evaluates overall health and detects anaemia, infection, and blood disorders.', price: 249, mrp: 500, homeCollectionAvailable: true, reportTime: '12 hours', sampleType: 'blood', fasting: false, category: 'general', rating: 4.8, reviews: 1120, icon: '💉' },
  { testId: 'LT008', testName: 'Vitamin D & B12 Panel', description: 'Deficiency screening for Vitamin D3 and Vitamin B12 — critical for bone and nerve health.', price: 999, mrp: 2200, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: false, category: 'vitamin', rating: 4.7, reviews: 567, icon: '☀️' },
  { testId: 'LT009', testName: 'COVID-19 RT-PCR Test', description: 'Gold standard molecular test for active COVID-19 infection detection.', price: 499, mrp: 900, homeCollectionAvailable: true, reportTime: '6 hours', sampleType: 'nasal swab', fasting: false, category: 'infection', rating: 4.9, reviews: 2341, icon: '🦠' },
  { testId: 'LT010', testName: 'Urine Routine (Urinalysis)', description: 'Detects urinary tract infections, kidney disease, diabetes and other conditions via urine analysis.', price: 149, mrp: 300, homeCollectionAvailable: true, reportTime: '6 hours', sampleType: 'urine', fasting: false, category: 'general', rating: 4.5, reviews: 876, icon: '🔬' },
  { testId: 'LT011', testName: "Women's Health Panel", description: "Comprehensive panel covering hormonal health: FSH, LH, Estradiol, Progesterone, Prolactin.", price: 1799, mrp: 4000, homeCollectionAvailable: true, reportTime: '48 hours', sampleType: 'blood', fasting: false, category: 'womens-health', rating: 4.8, reviews: 432, icon: '💜' },
  { testId: 'LT012', testName: 'Iron Deficiency Panel', description: 'Serum Iron, TIBC and Ferritin to diagnose iron deficiency anaemia.', price: 499, mrp: 1000, homeCollectionAvailable: true, reportTime: '24 hours', sampleType: 'blood', fasting: false, category: 'general', rating: 4.6, reviews: 678, icon: '🔴' },
];

export async function POST() {
  try {
    await connectDB();
    // Check if already seeded
    const count = await LabTest.countDocuments();
    if (count > 0) {
      return NextResponse.json({ message: `Already seeded with ${count} tests`, seeded: 0 });
    }
    await LabTest.insertMany(SEED_TESTS);
    return NextResponse.json({ message: `Seeded ${SEED_TESTS.length} lab tests`, seeded: SEED_TESTS.length });
  } catch (error) {
    console.error('Lab test seed error:', error);
    return NextResponse.json({ error: 'Failed to seed lab tests' }, { status: 500 });
  }
}
