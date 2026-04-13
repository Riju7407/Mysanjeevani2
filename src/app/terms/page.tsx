import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-linear-to-br from-orange-50 via-white to-amber-50 border-b border-orange-100">
          <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
            <p className="text-xs tracking-[0.2em] uppercase text-orange-700 font-semibold">Legal Agreement</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black text-slate-900">Terms of Use</h1>
            <p className="mt-4 text-slate-700 max-w-4xl leading-7">
              PLEASE READ THESE TERMS OF USE CAREFULLY. BY ACCESSING OR USING THIS INTERNET BASED PLATFORM, YOU AGREE TO BE BOUND BY THE TERMS DESCRIBED HEREIN. IF YOU DO NOT AGREE TO ALL OF THESE TERMS, DO NOT USE THIS PLATFORM.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12 space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">1. WHAT IS MY SANJEEVNI?</h2>
            <p className="mt-4 text-slate-700 leading-7">
              The domain name mysanjeevni.com and the mobile application MySANJEEVNI (collectively referred to as the "Website") are operated by Shri Ram Homoeo Pharmacy & Ayurvedic Medicine, a proprietorship firm, having its registered office at L-2/51 A, New Mahavir Nagar, Opp. Kangra Niketan, New Delhi-110018, with GSTIN 07CHSPS5442R1Z6 and PAN CHSPS5442R.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">2. PLATFORM SERVICES</h2>
            <p className="mt-4 text-slate-700">The Website is a healthcare technology platform that facilitates:</p>
            <ol className="mt-3 space-y-3 text-slate-700 leading-7 list-decimal pl-6">
              <li>Online Pharmacy: Purchase of pharmaceutical products from licensed third-party pharmacies ("Third-Party Pharmacies").</li>
              <li>Diagnostic Services: Booking of lab tests and health packages offered by third-party diagnostic centers ("Third-Party Labs").</li>
              <li>Medical Consultancy: Online consultations and second opinions offered by independent registered medical practitioners ("Medical Experts").</li>
              <li>Health Information: Providing health-related information and advertisements ("Information Services").</li>
            </ol>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">3. NATURE OF RELATIONSHIP</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Intermediary Role: The Website acts as a facilitator (marketplace) between the User and the Third-Party Service Providers (Pharmacies, Labs, and Doctors).</li>
              <li>Non-Party to Transactions: My Sanjeevni is not a party to the actual contract of sale or service between the User and the Service Provider, except for facilitating the technology and payment.</li>
              <li>Professional Advice: The content on the Website is for informational purposes and NOT a substitute for professional medical advice, diagnosis, or treatment.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">4. MULTI-VENDOR PLATFORM DISCLOSURE</h2>
            <p className="mt-4 text-slate-700 leading-7">My Sanjeevni acts as a digital marketplace. We do not manufacture medicines, perform lab tests, or provide medical advice directly. We facilitate a platform where:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Third-party Pharmacies sell medicines.</li>
              <li>Third-party Labs perform diagnostics.</li>
              <li>Independent Doctors provide consultations.</li>
              <li>Logistics Partners handle deliveries.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">5. ONLINE PHARMACY & PRESCRIPTIONS</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Mandatory Prescription: All orders for prescription drugs must be accompanied by a valid, scanned copy of a prescription from a Registered Medical Practitioner (RMP). Users must upload a valid prescription from a Registered Medical Practitioner for all prescription-only drugs.</li>
              <li>Verification: Our partner pharmacists reserve the right to reject an order if the prescription is found to be invalid or expired.</li>
              <li>Substitutes: We do not offer medicine substitutes unless specifically requested and supported by a valid prescription.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">6. DOCTOR CONSULTATIONS (TELE-MEDICINE)</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>No Emergency Use: This platform is NOT for life-threatening emergencies.</li>
              <li>Consultations Liability: Medical Experts are independent professionals. The advice provided by the doctor is their professional responsibility. My Sanjeevni is not liable for any misdiagnosis or treatment outcome.</li>
              <li>Recording: Consultations may be recorded for quality and legal audit purposes as per Telemedicine Practice Guidelines.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">7. LAB TESTS & DIAGNOSTICS</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Sample Collection: Collection is done by the selected Lab's phlebotomist. My Sanjeevni is not responsible for any issues during sample collection.</li>
              <li>Lab Tests: The Third-Party Labs are solely responsible for sample collection, testing accuracy, and report generation.</li>
              <li>Reports: Timelines for reports are estimates. Accuracy of results is the sole responsibility of the diagnostic center.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">8. PAYMENTS & BILLING</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Payment Gateway: All payments are processed via authorized third-party gateways (e.g., Razorpay/Paytm). My Sanjeevni does not store your credit/debit card details.</li>
              <li>Prices: Prices are subject to change based on vendor updates. All taxes (GST) are included as per Indian laws.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">9. DELIVERY & LOGISTICS</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Delivery Partners: We use third-party logistics (e.g., Delhivery, BlueDart) to deliver orders.</li>
              <li>Timelines: Delivery dates are estimates. My Sanjeevni is not liable for delays caused by the courier partner or "Acts of God" (weather, strikes, etc.).</li>
              <li>Inspection: Users must check the seal of the medicine package at the time of delivery.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">10. CANCELLATIONS & REFUNDS</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Medicines: Returns are only accepted if the product is damaged, expired, or incorrect.</li>
              <li>Consultations/Labs: No refund after the service has been rendered. Cancellations must be made 2 hours prior to the appointment.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">11. ADVERTISING POLICY</h2>
            <p className="mt-4 text-slate-700 leading-7">
              We allow third-party advertisements. These are clearly marked as "Sponsored." My Sanjeevni does not endorse the products advertised and follows the Drugs and Magic Remedies Act strictly.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">12. DATA SHARING WITH SISTER COMPANY</h2>
            <p className="mt-4 text-slate-700 leading-7">
              To provide a seamless experience, My Sanjeevni may share operational data (like delivery addresses or logistics info) with its sister company Shri Ram Homoeo Pharmacy & Ayurvedic Medicine. Such sharing is strictly for business efficiency and is governed by our Privacy Policy.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">13. ELIGIBILITY & REGISTRATION</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Age: You must be at least 18 years of age to use the Website or avail any Services.</li>
              <li>Account Security: You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">14. COMPLIANCE WITH LAWS</h2>
            <p className="mt-4 text-slate-700">These Terms are governed by and defined in accordance with Indian laws, including but not limited to:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Information Technology Act, 2000 (and rules framed thereunder).</li>
              <li>Drugs and Cosmetics Act, 1940 & Drugs and Cosmetics Rules, 1945.</li>
              <li>Consumer Protection Act, 2019 & E-Commerce Rules, 2020.</li>
              <li>Telemedicine Practice Guidelines, 2020.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">15. MODIFICATION OF TERMS</h2>
            <p className="mt-4 text-slate-700 leading-7">
              My Sanjeevni reserves the right to change or modify these Terms or any policy of the Website at any time. Any changes will be effective immediately upon posting. Your continued use of the Website will confirm your acceptance of such changes.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">16. INTELLECTUAL PROPERTY RIGHTS</h2>
            <p className="mt-4 text-slate-700 leading-7">
              All content on the Website, including text, graphics, logos, and software code ("Company Content"), is the property of My Sanjeevni and is protected under copyright and trademark laws. You shall not modify, reproduce, or distribute such content without prior written consent.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">17. LIMITATION OF LIABILITY</h2>
            <p className="mt-4 text-slate-700 leading-7">
              In no event shall the Company be liable for any indirect, incidental, or consequential damages arising out of the use of the Services or the conduct of any Third-Party Service Provider.
            </p>
          </article>

          <article className="rounded-2xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">18. GRIEVANCE OFFICER</h2>
            <p className="mt-4 text-slate-700 leading-7">
              In accordance with the IT Act, 2000, for any grievances regarding the Website, you may contact:
            </p>
            <ul className="mt-4 space-y-2 text-slate-800 leading-7 list-disc pl-6">
              <li>Name: Nisha</li>
              <li>Email: mysanjeevni3693@gmail.com</li>
              <li>Address: L-2/51 A, New Mahavir Nagar, Opp. Kangra Niketan, New Delhi-110018</li>
            </ul>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
