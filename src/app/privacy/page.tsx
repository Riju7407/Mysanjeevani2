import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-linear-to-br from-emerald-50 via-white to-slate-50 border-b border-emerald-100">
          <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
            <p className="text-xs tracking-[0.2em] uppercase text-emerald-700 font-semibold">Legal Policy</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black text-slate-900">Privacy Policy</h1>
            <p className="mt-4 text-slate-700 max-w-4xl leading-7">
              MY SANJEEVNI is committed to protecting the privacy of its users ("User," "you"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website mysanjeevni.com and our mobile application.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12 space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">1. Definitions</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Data: Includes personal information and Sensitive Personal Data or Information (SPDI) like health records, payment details, and biometric info.</li>
              <li>Vendors: Third-party sellers, pharmacies, and diagnostic labs registered on our platform.</li>
              <li>Medical Practitioners: Registered doctors or healthcare professionals providing consultations.</li>
              <li>Services: Online medicine orders, lab test bookings, doctor consultations, and wellness products.</li>
              <li>User/You: means any individual accessing our stores, website, or mobile application. The term encompasses all visitors, registered members, and customers who utilize our platform for doctor consultations, diagnostic services, or medicinal purchases.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">2. Information We Collect</h2>
            <p className="mt-4 text-slate-700">We collect data to provide a seamless healthcare experience:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Personal Identifiers: Name, age, gender, email, phone number, and delivery address.</li>
              <li>Health-Related Information: Medical history, prescriptions (for medicine orders), symptoms (for consultations), and lab test reports/results.</li>
              <li>Financial Data: Bank account details, UPI IDs, or card info (processed via PCI-DSS compliant gateways).</li>
              <li>Technical Data: IP address, device ID, location data (to find nearby labs/pharmacies), and browser type.</li>
              <li>Professional Data (for Doctors/Vendors): Registration certificates, licenses, and identity proofs.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">3. How We Collect Data</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Direct Interaction: When you create an account, upload a prescription, or book a test.</li>
              <li>Automated Technologies: Via cookies and web beacons to analyze site traffic.</li>
              <li>Third Parties: From our diagnostic partners (lab results) or doctors (consultation notes).</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">4. Data Usage and Purpose</h2>
            <p className="mt-4 text-slate-700">We use your data for:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Order Fulfillment: Facilitating medicine delivery through registered vendors.</li>
              <li>Healthcare Services: Sharing your health data with doctors for consultations or labs for sample collection.</li>
              <li>Report Management: Storing and displaying your lab reports digitally.</li>
              <li>Authentication: Verifying prescriptions before dispensing scheduled drugs.</li>
              <li>Communication: Sending appointment reminders, health tips, and order updates.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">5. Data Sharing (Multi-Vendor Ecosystem)</h2>
            <p className="mt-4 text-slate-700">To provide services, we share your data with:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Sellers/Pharmacies: Only necessary info (name, address, prescription) to fulfill medicine orders.</li>
              <li>Diagnostic Labs: To enable home sample collection and report generation.</li>
              <li>Medical Practitioners: Your health profile and history for accurate diagnosis during consultations.</li>
              <li>Service Providers: Logistics partners and payment gateways.</li>
              <li>Legal Compliance: To comply with government regulations (like the Drug and Cosmetics Act).</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">6. Disputes Resolutions Policy</h2>
            <p className="mt-4 text-slate-700 leading-7">
              Generally, transactions are conducted smoothly on MYSANJEEVNI.COM. However there may be some cases where both the Buyers and Sellers may face issues. At MYSANJEEVNI.COM we have a Dispute Resolution process in order to resolve disputes between Buyers and Sellers.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">Dispute</h3>
            <p className="mt-2 text-slate-700 leading-7">
              A dispute can be defined as a disagreement between a Buyer and a Seller in connection with a transaction on the Website.
            </p>

            <h3 className="mt-6 text-lg font-bold text-slate-900">Types of Disputes</h3>
            <p className="mt-2 text-slate-700">Following are the indicative examples of potential disputes:</p>
            <ul className="mt-3 space-y-2 text-slate-700 leading-7 list-disc pl-6">
              <li>Wrong item received</li>
              <li>Item not as described</li>
              <li>Damaged or seal broken on product</li>
              <li>Part or accessory missing</li>
              <li>Item not compatible</li>
              <li>Seller description or specification wrong</li>
              <li>Defective (functional issues)</li>
              <li>Product not working and manufacturer claims invalid invoice</li>
            </ul>

            <p className="mt-4 text-slate-700 leading-7">
              In case the Seller rejects the return request of the Buyer, and Buyer raises a dispute, then MY SANJEEVNI will try to mediate and resolve the dispute between both the parties. If the dispute is resolved in favor of the Buyer, a refund is provided once the product is returned to the Seller. If the dispute is settled in favor of the Seller, Buyer is not entitled to any refund.
            </p>
            <p className="mt-3 text-slate-700 leading-7">
              Raising disputes against Sellers does not automatically entitle the Buyer to a refund or replacement for the product purchased. MYSANJEEVNI.COM shall verify the disputes so raised and may process only such claims that are valid and genuine.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">7. Data Security and Storage</h2>
            <p className="mt-4 text-slate-700">We implement high-level security measures:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Encryption: All health and financial data is encrypted using SSL/TLS technology.</li>
              <li>Access Control: Only authorized personnel and partners have access to your sensitive health data.</li>
              <li>Storage: Data is stored on secure cloud servers.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">8. User Rights</h2>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Review and Edit: You can update your health profile or contact details anytime.</li>
              <li>Withdraw Consent: You can withdraw consent for data processing (this may limit access to certain services like lab tests).</li>
              <li>Data Portability: You can request a copy of your digital health records.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">9. Retention Policy</h2>
            <p className="mt-4 text-slate-700 leading-7">
              We retain your health records and personal data as long as your account is active or as required by Indian healthcare laws (for example, maintaining prescription records for a specific period).
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">10. Grievance Redressal</h2>
            <p className="mt-4 text-slate-700 leading-7">
              In accordance with the IT Act 2000 and DPDP Act, the details of the Grievance Officer are:
            </p>
            <ul className="mt-4 space-y-2 text-slate-800 leading-7 list-disc pl-6">
              <li>Name: NISHA</li>
              <li>Designation: Grievance Officer</li>
              <li>Email: mysanjeevni3693@gmail.com</li>
              <li>Address: L-2/51 A, NEW MAHAVIR NAGAR, OPP. KANGRA NIKETAN, NEW DELHI-110018</li>
            </ul>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
