import InfoPageLayout from '@/components/InfoPageLayout';

export default function ShippingPage() {
  return (
    <InfoPageLayout
      badge="Shipping Policy"
      title="Reliable Delivery, Transparent Timelines"
      subtitle="This policy governs dispatch, shipment, delivery timelines, and responsibilities associated with order fulfillment."
      lastUpdated="March 28, 2026"
      sections={[
        {
          heading: 'Dispatch and Delivery',
          content: [
            'Order processing and dispatch are subject to inventory availability, prescription validation, payment authorization, and serviceability of the delivery location.',
            'Delivery timelines communicated at checkout are estimates only and do not constitute guaranteed delivery commitments unless explicitly stated.',
          ],
        },
        {
          heading: 'Shipping Updates',
          content: [
            'Shipment status updates are provided through available tracking channels; update frequency may depend on logistics partner systems.',
            'MySanjeevani may provide assistance on delayed consignments but does not warrant uninterrupted real-time status synchronization.',
          ],
        },
        {
          heading: 'Delivery Exceptions',
          content: [
            'Delays or failed delivery may occur due to force majeure events, regional restrictions, incorrect address details, recipient unavailability, or courier operational limitations.',
            'Users are responsible for providing accurate delivery information. Additional delivery attempts, re-routing, or cancellation may be subject to applicable charges and policy terms.',
          ],
        },
      ]}
    />
  );
}
