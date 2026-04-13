import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-linear-to-br from-red-50 via-white to-rose-50 border-b border-red-100">
          <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
            <p className="text-xs tracking-[0.2em] uppercase text-red-700 font-semibold">Legal Notice</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black text-slate-900">Important Medical & Legal Disclaimer</h1>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12 space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">1. No Medical Advice</h2>
            <p className="mt-4 text-slate-700 leading-7">
              The information provided on My Sanjeevni is for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Do not disregard professional medical advice or delay in seeking it because of something you have read on this website.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">2. Facilitator/Intermediary Role (Multi-Vendor)</h2>
            <p className="mt-4 text-slate-700 leading-7">My Sanjeevni is a digital marketplace and technology platform. We act as an intermediary to connect users with third-party providers:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Medicines: Dispatched by independent licensed retail pharmacies.</li>
              <li>Lab Tests: Conducted by independent accredited diagnostic laboratories.</li>
              <li>Consultations: Provided by independent Registered Medical Practitioners. My Sanjeevni does not employ these providers and is not responsible for the quality, accuracy, or delivery of their services.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">3. Prescription Policy</h2>
            <p className="mt-4 text-slate-700 leading-7">
              Orders for prescription medicines will only be processed upon the upload and successful verification of a valid prescription from a Registered Medical Practitioner. My Sanjeevni and its partner pharmacies reserve the right to refuse any order if the prescription is found to be non-compliant with the Drugs and Cosmetics Act and Rules.
            </p>
          </article>

          <article className="rounded-2xl border border-red-300 bg-red-50 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-red-900">4. Emergency Services Disclaimer</h2>
            <p className="mt-4 text-red-900 leading-7 font-semibold">
              THIS PLATFORM IS NOT FOR EMERGENCIES. If you are facing a life-threatening medical emergency, please call your local emergency number or visit the nearest hospital immediately. Tele-consultations are not suitable for critical care.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">5. Limitation of Liability</h2>
            <p className="mt-4 text-slate-700 leading-7">To the fullest extent permitted by law, My Sanjeevni and its sister concern Shri Ram Homoeo Pharmacy & Ayurvedic Medicine shall not be liable for any direct, indirect, or consequential damages resulting from:</p>
            <ul className="mt-3 space-y-3 text-slate-700 leading-7 list-disc pl-6">
              <li>Inaccurate lab test results provided by third-party labs.</li>
              <li>Side effects or incorrect medication dispensed by partner pharmacies.</li>
              <li>Medical diagnosis or advice provided by independent doctors.</li>
              <li>Technical delays or errors in the delivery of services.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">6. External Links & Advertisements</h2>
            <p className="mt-4 text-slate-700 leading-7">
              This site may contain links to third-party websites or advertisements. My Sanjeevni does not endorse these products/services and is not responsible for their content. Interactions with our sister company Shri Ram Homoeo Pharmacy & Ayurvedic Medicine through this platform are governed by their respective terms.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">7. Indemnity Clause</h2>
            <p className="mt-4 text-slate-700 leading-7 italic">
              "The User (and/or Third-Party Vendor) agrees to indemnify, defend, and hold harmless My Sanjeevni, its sister concern Shri Ram Homoeo Pharmacy & Ayurvedic Medicine, and its Proprietor from and against any and all claims, damages, liabilities, costs, and expenses (including reasonable attorney's fees) arising out of or related to:
            </p>
            <ol className="mt-4 space-y-3 text-slate-700 leading-7 list-decimal pl-6 italic">
              <li>Medical Outcomes: Any misdiagnosis, side effects, or treatment failures arising from services provided by independent Doctors or Labs.</li>
              <li>Product Defects: Any issues related to the quality, safety, or efficacy of medicines dispensed by independent partner pharmacies.</li>
              <li>User Negligence: Any incorrect information, forged prescriptions, or misuse of the platform by the User.</li>
              <li>Breach of Terms: Any violation of these Terms & Conditions or the rights of any third party by the User or Vendor.</li>
              <li>Legal Violations: Any penalty or legal action taken by government authorities due to the non-compliance of a Third-Party Vendor (e.g., Pharmacy or Lab) with applicable laws (like the Drugs and Cosmetics Act)."</li>
            </ol>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  );
}
