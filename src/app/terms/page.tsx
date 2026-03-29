import InfoPageLayout from '@/components/InfoPageLayout';

export default function TermsPage() {
  return (
    <InfoPageLayout
      badge="Terms & Conditions"
      title="Platform Usage Terms"
      subtitle="These Terms and Conditions constitute a binding agreement governing access to and use of MySanjeevani websites, applications, and related services."
      lastUpdated="March 28, 2026"
      sections={[
        {
          heading: 'Acceptance of Terms',
          content: [
            'By accessing or using the platform, you acknowledge and agree to be bound by these Terms, associated policies, and all applicable laws and regulations.',
            'If you do not agree to these Terms, you must immediately discontinue use of the platform and refrain from placing orders.',
          ],
        },
        {
          heading: 'User Responsibilities',
          content: [
            'Users are solely responsible for accuracy of account, prescription, payment, and delivery information submitted through the platform.',
            'Any fraudulent conduct, abuse, unauthorized access, or policy breach may result in suspension, cancellation, denial of service, and legal recourse.',
          ],
        },
        {
          heading: 'Service and Liability',
          content: [
            'Product listings, pricing, stock status, and timelines are subject to change without prior notice due to operational, regulatory, or supplier constraints.',
            'To the maximum extent permitted by applicable law, MySanjeevani disclaims liability for indirect, incidental, special, or consequential losses arising from platform use or service interruption.',
          ],
        },
        {
          heading: 'Indemnity',
          content: [
            'You agree to defend, indemnify, and hold harmless MySanjeevani, its affiliates, directors, employees, and service providers from and against any claims, losses, penalties, liabilities, and costs (including reasonable legal fees) arising out of your breach of these Terms, misuse of the platform, or violation of applicable law or third-party rights.',
            'This indemnity obligation survives suspension, termination, or discontinuation of your account and use of the platform.',
          ],
        },
        {
          heading: 'Limitation of Liability Cap',
          content: [
            'To the maximum extent permitted by law, the aggregate liability of MySanjeevani for any and all claims arising from or relating to the platform or services shall not exceed the total amount actually paid by you for the specific transaction giving rise to the claim or INR 5,000, whichever is lower.',
            'Nothing in these Terms excludes or limits liability where such exclusion is prohibited under applicable law, including liability for willful misconduct or fraud where legally non-excludable.',
          ],
        },
        {
          heading: 'Dispute Resolution',
          content: [
            'In the event of any dispute, controversy, or claim arising out of or in connection with these Terms, the parties shall first attempt to resolve the matter amicably within 30 days of written notice.',
            'If unresolved, the dispute shall be referred to final and binding arbitration under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be New Delhi, India. Proceedings shall be conducted in English by a sole arbitrator appointed in accordance with applicable law.',
          ],
        },
        {
          heading: 'Governing Law and Jurisdiction',
          content: [
            'These Terms are governed by and construed in accordance with the laws of India.',
            'Subject to the arbitration clause above, courts at New Delhi, India shall have exclusive jurisdiction over matters requiring judicial intervention, enforcement, or interim relief.',
          ],
        },
        {
          heading: 'Force Majeure and Severability',
          content: [
            'MySanjeevani shall not be liable for delay or failure in performance caused by events beyond reasonable control, including natural disasters, public health emergencies, government actions, network failures, labor disruptions, or logistics interruptions.',
            'If any provision of these Terms is held invalid or unenforceable, remaining provisions shall continue in full force and effect to the extent permitted by law.',
          ],
        },
      ]}
    />
  );
}
