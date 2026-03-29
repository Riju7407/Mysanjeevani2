import InfoPageLayout from '@/components/InfoPageLayout';

export default function AboutPage() {
  return (
    <InfoPageLayout
      badge="About MySanjeevani"
      title="Healthcare That Feels Simple, Fast, and Reliable"
      subtitle="MySanjeevani brings medicines, diagnostics, and wellness support together so families can manage health with confidence."
      sections={[
        {
          heading: 'Who We Are',
          content: [
            'MySanjeevani is a modern healthcare platform designed for everyday convenience and trust.',
            'We connect customers to quality products and care services through a simple digital experience.',
          ],
        },
        {
          heading: 'What We Offer',
          content: [
            'From daily wellness essentials to specialized products, we offer a curated healthcare selection in one place.',
            'Customers also benefit from secure checkout, proactive support, and transparent order tracking.',
          ],
        },
        {
          heading: 'Our Promise',
          content: [
            'We are committed to authenticity, privacy, and dependable service standards.',
            'Every interaction is built to keep healthcare accessible, clear, and customer-first.',
          ],
        },
      ]}
    />
  );
}
