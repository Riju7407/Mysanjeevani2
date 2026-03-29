import InfoPageLayout from '@/components/InfoPageLayout';

export default function ReturnsPage() {
  return (
    <InfoPageLayout
      badge="Returns"
      title="Return and Refund Policy"
      subtitle="This policy governs return eligibility, verification, and refund processing for orders placed on MySanjeevani."
      lastUpdated="March 28, 2026"
      sections={[
        {
          heading: 'Eligibility',
          content: [
            'Returns are accepted only for products and categories expressly marked as return-eligible at the time of purchase.',
            'Products must be unused, unopened, in original packaging, and submitted within the applicable return window. Regulated and hygiene-sensitive items may be non-returnable except where required by law.',
          ],
        },
        {
          heading: 'Return Process',
          content: [
            'To request a return, users must contact support with order details and reason for return. MySanjeevani may require photographs, batch details, or additional evidence for verification.',
            'Return approval is subject to inspection and policy compliance. MySanjeevani reserves the right to reject requests that do not satisfy policy requirements.',
          ],
        },
        {
          heading: 'Refund Timeline',
          content: [
            'Approved refunds are initiated to the original payment instrument unless otherwise required by law or agreed in writing.',
            'Processing and settlement timelines may vary by payment provider, bank network, and statutory checks. MySanjeevani is not responsible for delays caused by third-party financial institutions.',
          ],
        },
      ]}
    />
  );
}
