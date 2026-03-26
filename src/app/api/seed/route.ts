import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';

// ─── EXACT products from homepage screenshots ───────────────────────────────

const MEDICINES = [
  // Allopathy – Popular Medicines section
  { name: 'Azithromycin 500mg', brand: 'Zithromax', category: 'Antibiotics', price: 89, mrp: 120, discount: 26, icon: '💊', description: 'Broad-spectrum antibiotic for respiratory and skin infections', stock: 500, rating: 4.5, reviews: 1823, requiresPrescription: true, healthConcerns: ['infections'], isActive: true },
  { name: 'Paracetamol 500mg', brand: 'Calpol', category: 'Pain Relief', price: 18, mrp: 25, discount: 28, icon: '💊', description: 'Fast-acting fever and pain reliever for adults', stock: 1200, rating: 4.8, reviews: 5421, requiresPrescription: false, healthConcerns: ['fever', 'pain'], isActive: true },
  { name: 'Pantoprazole 40mg', brand: 'Pan-D', category: 'Acidity', price: 76, mrp: 95, discount: 20, icon: '💊', description: 'Proton pump inhibitor for acid reflux and ulcers', stock: 800, rating: 4.6, reviews: 2109, requiresPrescription: true, healthConcerns: ['digestion', 'acidity'], isActive: true },
  { name: 'Metformin 500mg', brand: 'Glycomet', category: 'Diabetes', price: 45, mrp: 60, discount: 25, icon: '💊', description: 'First-line medication for Type 2 Diabetes management', stock: 900, rating: 4.7, reviews: 3201, requiresPrescription: true, healthConcerns: ['diabetes'], isActive: true },
  { name: 'Cetirizine 10mg', brand: 'Zyrtec', category: 'Allergy', price: 28, mrp: 38, discount: 26, icon: '💊', description: 'Non-drowsy antihistamine for allergies and hay fever', stock: 1100, rating: 4.5, reviews: 1456, requiresPrescription: false, healthConcerns: ['allergy'], isActive: true },
  { name: 'Atorvastatin 10mg', brand: 'Lipitor', category: 'Heart Care', price: 95, mrp: 130, discount: 27, icon: '💊', description: 'Statin for lowering bad cholesterol and heart protection', stock: 600, rating: 4.6, reviews: 987, requiresPrescription: true, healthConcerns: ['heart care', 'cholesterol'], isActive: true },
  { name: 'Vitamin D3 60K', brand: 'D-Rise', category: 'Vitamins', price: 149, mrp: 195, discount: 24, icon: '🟡', description: 'Weekly dose capsule for Vitamin D deficiency', stock: 700, rating: 4.7, reviews: 2891, requiresPrescription: false, healthConcerns: ['bone health'], isActive: true },
  { name: 'Amoxicillin 250mg', brand: 'Mox', category: 'Antibiotics', price: 65, mrp: 85, discount: 24, icon: '💊', description: 'Penicillin antibiotic for bacterial infections', stock: 450, rating: 4.4, reviews: 1234, requiresPrescription: true, healthConcerns: ['infections'], isActive: true },
];

const AYURVEDA_PRODUCTS = [
  // Ayurveda section from homepage
  { name: 'Ashwagandha KSM-66', brand: 'Himalaya', category: 'Ayurveda', price: 349, mrp: 450, discount: 22, icon: '🌿', benefit: 'Stress Relief', description: 'Clinically tested KSM-66 extract for stress relief & vitality', stock: 500, rating: 4.7, reviews: 2341, requiresPrescription: false, healthConcerns: ['stress'], isActive: true },
  { name: 'Triphala Churna', brand: 'Dabur', category: 'Ayurveda', price: 129, mrp: 180, discount: 28, icon: '🌱', benefit: 'Digestion', description: 'Traditional blend of Amalaki, Bibhitaki & Haritaki for digestion', stock: 600, rating: 4.5, reviews: 1823, requiresPrescription: false, healthConcerns: ['digestion'], isActive: true },
  { name: 'Chyawanprash', brand: 'Baidyanath', category: 'Ayurveda', price: 245, mrp: 320, discount: 23, icon: '🍯', benefit: 'Immunity', description: '40+ herbs including Amla to boost immunity year-round', stock: 800, rating: 4.8, reviews: 4521, requiresPrescription: false, healthConcerns: ['immunity'], isActive: true },
  { name: 'Shilajit Capsules', brand: 'Patanjali', category: 'Ayurveda', price: 299, mrp: 399, discount: 25, icon: '⚡', benefit: 'Energy & Vitality', description: 'Pure Himalayan Shilajit with gold for energy & vitality', stock: 400, rating: 4.6, reviews: 987, requiresPrescription: false, healthConcerns: ['energy'], isActive: true },
  // More Ayurveda
  { name: 'Guduchi / Giloy Tablets', brand: 'Himalaya', category: 'Ayurveda', price: 199, mrp: 260, discount: 23, icon: '🍃', benefit: 'Immunity', description: 'Immunity booster with Guduchi (Tinospora cordifolia)', stock: 600, rating: 4.6, reviews: 3102, requiresPrescription: false, healthConcerns: ['immunity'], isActive: true },
  { name: 'Shatavari Granules 200g', brand: 'Zandu', category: 'Ayurveda', price: 279, mrp: 360, discount: 22, icon: '🌺', benefit: "Women's Health", description: "Traditional herb for hormonal balance & women's wellness", stock: 350, rating: 4.5, reviews: 892, requiresPrescription: false, healthConcerns: ["women's health"], isActive: true },
  { name: 'Turmeric Curcumin 95%', brand: 'Organic India', category: 'Ayurveda', price: 449, mrp: 599, discount: 25, icon: '🟡', benefit: 'Joint & Bone', description: 'High bioavailability curcumin for joint health & inflammation', stock: 300, rating: 4.7, reviews: 2109, requiresPrescription: false, healthConcerns: ['joint pain'], isActive: true },
  { name: 'Brahmi Ghrita 200ml', brand: 'Kottakkal', category: 'Ayurveda', price: 419, mrp: 550, discount: 24, icon: '🧠', benefit: 'Brain Health', description: 'Classic Ayurvedic formulation for brain health & memory', stock: 200, rating: 4.4, reviews: 567, requiresPrescription: false, healthConcerns: ['mental wellness'], isActive: true },
];

const HOMEOPATHY_PRODUCTS = [
  // Homeopathy section from homepage
  { name: 'Arnica Montana 30C', brand: 'SBL', category: 'Homeopathy', price: 89, mrp: 110, discount: 19, icon: '🌼', benefit: 'Bruises & Pain', description: 'Most popular remedy for bruises, trauma, muscle soreness and shock', stock: 400, rating: 4.7, reviews: 1892, requiresPrescription: false, healthConcerns: ['pain'], isActive: true },
  { name: 'Nux Vomica 30C', brand: 'Dr. Reckeweg', category: 'Homeopathy', price: 95, mrp: 125, discount: 24, icon: '🌸', benefit: 'Digestion & Acidity', description: 'For overindulgence, digestive disturbances and irritability', stock: 350, rating: 4.6, reviews: 1234, requiresPrescription: false, healthConcerns: ['digestion'], isActive: true },
  { name: 'Calcarea Carb 200C', brand: 'Boiron', category: 'Homeopathy', price: 120, mrp: 160, discount: 25, icon: '💮', benefit: 'Metabolism', description: 'Constitutional remedy for slow-developing children and bone health', stock: 300, rating: 4.5, reviews: 876, requiresPrescription: false, healthConcerns: ['metabolism'], isActive: true },
  { name: 'Rhus Tox 30C', brand: 'Masood', category: 'Homeopathy', price: 79, mrp: 99, discount: 20, icon: '🌺', benefit: 'Joint Pain', description: 'For stiffness and pain relieved by movement, arthritis & sprains', stock: 400, rating: 4.6, reviews: 1432, requiresPrescription: false, healthConcerns: ['joint pain'], isActive: true },
  // More Homeopathy
  { name: 'Arsenicum Album 30C', brand: 'Dr. Reckeweg', category: 'Homeopathy', price: 120, mrp: 160, discount: 25, icon: '🛡️', benefit: 'Immunity', description: 'For food poisoning, weakness, restlessness, fear of disease', stock: 350, rating: 4.8, reviews: 3241, requiresPrescription: false, healthConcerns: ['immunity'], isActive: true },
  { name: 'Pulsatilla 200C', brand: 'Boiron', category: 'Homeopathy', price: 175, mrp: 230, discount: 24, icon: '💜', benefit: "Women's Health", description: "For irregular periods, weeping disposition and hormonal imbalances", stock: 300, rating: 4.7, reviews: 2109, requiresPrescription: false, healthConcerns: ["women's health"], isActive: true },
  { name: 'Belladonna 30C', brand: 'SBL', category: 'Homeopathy', price: 85, mrp: 110, discount: 23, icon: '🔴', benefit: 'Cold & Flu', description: 'Sudden high fever, throbbing headache, red face and sore throat', stock: 400, rating: 4.5, reviews: 765, requiresPrescription: false, healthConcerns: ['fever'], isActive: true },
  { name: 'Sulphur 200C', brand: 'SBL', category: 'Homeopathy', price: 95, mrp: 130, discount: 27, icon: '🌟', benefit: 'Skin Care', description: 'Constitutional remedy for chronic skin conditions like eczema, psoriasis', stock: 350, rating: 4.4, reviews: 1567, requiresPrescription: false, healthConcerns: ['skin care'], isActive: true },
];

// ─── LAB TESTS from homepage screenshots ────────────────────────────────────

const LAB_TESTS = [
  { name: 'Full Body Checkup', category: 'General Health', description: 'Complete health screening with 72+ parameters including CBC, LFT, KFT, lipid profile, thyroid, blood sugar, and more.', price: 999, mrp: 2499, productType: 'Lab Tests', isActive: true },
  { name: 'Diabetes Screening', category: 'Diabetes', description: 'Comprehensive diabetes screening including fasting glucose, post-meal glucose and HbA1c.', price: 399, mrp: 799, productType: 'Lab Tests', isActive: true },
  { name: 'Thyroid Profile (T3,T4,TSH)', category: 'Thyroid', description: 'Complete thyroid function test to detect hypothyroidism, hyperthyroidism and thyroid disorders.', price: 349, mrp: 699, productType: 'Lab Tests', isActive: true },
  { name: 'Lipid Profile', category: 'Heart Health', description: 'Measures total cholesterol, HDL, LDL and triglycerides for cardiovascular risk assessment.', price: 299, mrp: 599, productType: 'Lab Tests', isActive: true },
  { name: 'CBC + Differential', category: 'General Health', description: 'Evaluates overall health and detects anaemia, infection, and blood disorders.', price: 199, mrp: 399, productType: 'Lab Tests', isActive: true },
  { name: 'Liver Function Test', category: 'Liver Health', description: 'Panel of tests including ALT, AST, ALP, bilirubin to assess liver health.', price: 449, mrp: 899, productType: 'Lab Tests', isActive: true },
  { name: 'Kidney Function Test (KFT)', category: 'Kidney Health', description: 'Tests for creatinine, urea, uric acid, electrolytes to evaluate kidney function.', price: 299, mrp: 599, productType: 'Lab Tests', isActive: true },
  { name: 'Vitamin D & B12 Panel', category: 'Vitamins', description: 'Deficiency screening for Vitamin D3 and Vitamin B12 - critical for bone and nerve health.', price: 699, mrp: 1399, productType: 'Lab Tests', isActive: true },
  { name: "Women's Health Panel", category: 'Women Health', description: "Comprehensive panel covering hormonal health: FSH, LH, Estradiol, Progesterone, Prolactin.", price: 899, mrp: 1799, productType: 'Lab Tests', isActive: true },
  { name: 'Urine Routine (Urinalysis)', category: 'General Health', description: 'Detects urinary tract infections, kidney disease, diabetes and other conditions.', price: 99, mrp: 199, productType: 'Lab Tests', isActive: true },
  { name: 'Iron Deficiency Panel', category: 'General Health', description: 'Serum Iron, TIBC and Ferritin to diagnose iron deficiency anaemia.', price: 349, mrp: 699, productType: 'Lab Tests', isActive: true },
  { name: 'COVID-19 RT-PCR Test', category: 'Immunity', description: 'Gold standard molecular test for active COVID-19 infection detection.', price: 499, mrp: 900, productType: 'Lab Tests', isActive: true },
];

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    await connectDB();

    const results: Record<string, number> = {};

    // ── Seed products ──────────────────────────────────────────────────────
    const prodCount = await Product.countDocuments();
    if (prodCount === 0 || force) {
      if (force) await Product.deleteMany({});
      const allProducts = [...MEDICINES, ...AYURVEDA_PRODUCTS, ...HOMEOPATHY_PRODUCTS];
      await Product.insertMany(allProducts);
      results.products = allProducts.length;
    } else {
      results.products = 0; // already seeded
    }

    // ── Seed lab tests ─────────────────────────────────────────────────────
    const labTestCount = await Product.countDocuments({ productType: 'Lab Tests' });
    if (labTestCount === 0 || force) {
      if (force) await Product.deleteMany({ productType: 'Lab Tests' });
      await Product.insertMany(LAB_TESTS);
      results.labTests = LAB_TESTS.length;
    } else {
      results.labTests = 0; // already seeded
    }

    return NextResponse.json({
      message: 'Seed complete',
      seeded: results,
      totals: {
        products: await Product.countDocuments({ productType: { $ne: 'Lab Tests' } }),
        labTests: await Product.countDocuments({ productType: 'Lab Tests' }),
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      products: await Product.countDocuments({ productType: { $ne: 'Lab Tests' } }),
      labTests: await Product.countDocuments({ productType: 'Lab Tests' }),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
