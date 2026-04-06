import InfoPageLayout from '@/components/InfoPageLayout';

export default function PressPage() {
  return (
    <InfoPageLayout
      badge="Press Room"
      title="Media Resources and Company Updates"
      subtitle="Access verified announcements, media responses, and official company information."
      sections={[
        {
          heading: 'Media Inquiries',
          content: [
            'For interviews and official statements, email MYSANJEEVNI3693@GMAIL.COM with publication details and deadline.',
            'Our communications team responds with verified information and approved materials.',
          ],
        },
        {
          heading: 'Brand and Product Updates',
          content: [
            'We publish key updates on launches, milestones, and customer experience improvements.',
            'All official announcements are released through our verified channels.',
          ],
        },
        {
          heading: 'Usage Guidelines',
          content: [
            'Use of MySanjeevni logos, marks, or screenshots requires prior written approval.',
            'Please request brand-use permission before publication in digital or print media.',
          ],
        },
      ]}
    />
  );
}
