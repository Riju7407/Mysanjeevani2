import InfoPageLayout from '@/components/InfoPageLayout';

export default function DisclaimerPage() {
  return (
    <InfoPageLayout
      badge="Disclaimer"
      title="Important Medical and Service Notice"
      subtitle="This disclaimer limits representations and liabilities relating to information, products, and services made available through MySanjeevani."
      lastUpdated="March 28, 2026"
      sections={[
        {
          heading: 'General Information Only',
          content: [
            'All content provided on the platform is for general informational purposes only and does not constitute medical, diagnostic, or treatment advice.',
            'Users must obtain independent advice from a licensed healthcare professional before relying on any information for medical decisions.',
          ],
        },
        {
          heading: 'Product and Consultation Limits',
          content: [
            'Product information and consultation support are provided on an as-available basis. Individual outcomes may vary and are not guaranteed.',
            'Platform services are not intended for emergency response. In emergencies, users must contact local emergency services immediately.',
          ],
        },
        {
          heading: 'External References',
          content: [
            'Third-party links and references are provided solely for convenience and do not imply endorsement, control, or responsibility by MySanjeevani.',
            'MySanjeevani disclaims all liability for external content, availability, accuracy, or third-party practices. Users access external resources at their own risk.',
          ],
        },
      ]}
    />
  );
}
