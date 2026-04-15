import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import { LabTestBooking } from '@/lib/models/LabTestBooking';
import { fetchPartnerOrderStatus } from '@/lib/labPartners';

const JWT_SECRET = process.env.JWT_SECRET || 'MySanjeevni-secret-key-2024';

function getUserId(req: Request): string | null {
  const explicitUserId = req.headers.get('x-user-id')?.trim();
  if (explicitUserId) return explicitUserId;

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string; sub?: string };
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await connectDB();

    const booking = await LabTestBooking.findOne({ _id: id, userId });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.provider === 'local' || !booking.providerOrderId) {
      return NextResponse.json({ error: 'This booking has no external provider order' }, { status: 400 });
    }

    const sync = await fetchPartnerOrderStatus(
      booking.provider,
      booking.providerOrderId,
      booking.providerLeadId || undefined
    );

    booking.providerStatus = sync.providerStatus || booking.providerStatus;
    booking.providerLeadId = sync.providerLeadId || booking.providerLeadId;
    booking.reportReady = Boolean(sync.reportReady);
    if (sync.reportUrl) booking.reportUrl = sync.reportUrl;
    booking.providerPayload = sync.raw || booking.providerPayload;
    booking.providerLastSyncedAt = new Date();

    if (String(sync.providerStatus || '').toUpperCase().includes('CANCEL')) {
      booking.status = 'cancelled';
    } else if (booking.reportReady) {
      booking.status = 'completed';
    }

    await booking.save();

    return NextResponse.json({
      message: 'Booking synced successfully',
      booking,
    });
  } catch (error) {
    console.error('Single booking sync error:', error);
    return NextResponse.json({ error: 'Failed to sync booking' }, { status: 500 });
  }
}
