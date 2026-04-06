import InfoPageLayout from '@/components/InfoPageLayout';

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      badge="Privacy Policy"
      title="Privacy and Data Protection Policy"
      subtitle="This policy describes how MySanjeevni collects, processes, stores, shares, and protects personal data in connection with platform services."
      lastUpdated="March 28, 2026"
      sections={[
        {
          heading: 'Information We Collect',
          content: [
            'We may collect account identifiers, contact details, order and transaction records, communications, and service usage metadata necessary to provide and improve services.',
            'Payment credentials are handled by authorized payment processors. MySanjeevni does not store complete card data unless expressly required under compliant and permitted mechanisms.',
          ],
        },
        {
          heading: 'How We Use Information',
          content: [
            'Personal data is processed for contract performance, order fulfillment, customer support, fraud prevention, security monitoring, legal compliance, and service optimization.',
            'Data access is restricted on a need-to-know basis and subject to appropriate technical and organizational safeguards.',
          ],
        },
        {
          heading: 'Your Rights',
          content: [
            'Subject to applicable law, users may request access, correction, or deletion of personal information and may object to specific processing activities.',
            'To exercise privacy rights, contact MYSANJEEVNI3693@GMAIL.COM from your registered email address with identity and request details. Additional verification may be required.',
          ],
        },
        {
          heading: 'Lawful Basis and Consent',
          content: [
            'Personal data is processed on lawful grounds including contract performance, compliance with legal obligations, legitimate business interests, and consent where required by applicable law.',
            'Where consent is relied upon, you may withdraw consent at any time; however, withdrawal shall not affect processing already carried out lawfully prior to such withdrawal.',
          ],
        },
        {
          heading: 'Data Retention and Deletion',
          content: [
            'Personal data is retained only for as long as necessary for the purposes stated in this policy, or as required under applicable tax, accounting, healthcare, anti-fraud, and other legal obligations.',
            'Upon expiry of retention requirements, data is deleted or anonymized in accordance with operational and legal standards, subject to backup and archival cycles.',
          ],
        },
        {
          heading: 'Cross-Border Processing',
          content: [
            'Where services involve processing by third-party infrastructure or vendors outside India, MySanjeevni ensures that appropriate contractual and security safeguards are implemented in accordance with applicable law.',
            'By using the platform, you acknowledge that your information may be processed in jurisdictions that may have data protection standards different from those in India.',
          ],
        },
        {
          heading: 'Grievance Redressal and Compliance',
          content: [
            'For privacy complaints, grievance redressal, or data protection requests, contact our Grievance Officer at MYSANJEEVNI3693@GMAIL.COM with complete request details and account identifiers.',
            'MySanjeevni will review and respond within timelines prescribed by applicable Indian law, subject to identity verification and legal permissibility.',
          ],
        },
        {
          heading: 'Governing Law and Jurisdiction',
          content: [
            'This Privacy Policy is governed by the laws of India and shall be interpreted in accordance with applicable Indian data protection and information technology laws.',
            'Courts at New Delhi, India shall have exclusive jurisdiction over disputes arising from this Privacy Policy, subject to any mandatory statutory remedies available to data principals.',
          ],
        },
      ]}
    />
  );
}
