import InfoPageLayout from '@/components/InfoPageLayout';

export default function CareersPage() {
  return (
    <InfoPageLayout
      badge="Careers"
      title="Build the Future of Digital Healthcare"
      subtitle="Join a fast-moving team building meaningful healthcare experiences for millions of users."
      sections={[
        {
          heading: 'Why Join Us',
          content: [
            'Work on products that create visible impact for real customers and families.',
            'Grow with a team that values ownership, speed, quality, and collaboration.',
          ],
        },
        {
          heading: 'What We Look For',
          content: [
            'We look for builders who combine strong execution with customer empathy.',
            'If you are curious, accountable, and delivery-focused, you will fit right in.',
          ],
        },
        {
          heading: 'Apply',
          content: [
            'Send your resume and role preference to MYSANJEEVNI3693@GMAIL.COM with subject: Career Application - Role Name.',
            'Shortlisted candidates are contacted directly by our hiring team.',
          ],
        },
      ]}
    />
  );
}
