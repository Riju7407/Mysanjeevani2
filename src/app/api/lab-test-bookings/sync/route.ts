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

export async function POST(req: Request) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const bookings = await LabTestBooking.find({
      userId,
      provider: { $in: ['thyrocare', 'healthians'] },
      providerOrderId: { $ne: '' },
    });

    const updates = await Promise.all(
      bookings.map(async (booking) => {
        try {
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
          return { bookingId: booking._id, synced: true };
        } catch (error) {
          return {
            bookingId: booking._id,
            synced: false,
            error: error instanceof Error ? error.message : 'Sync failed',
          };
        }
      })
    );

    return NextResponse.json({
      message: 'Sync completed',
      total: updates.length,
      updates,
    });
  } catch (error) {
    console.error('Lab test booking bulk sync error:', error);
    return NextResponse.json({ error: 'Failed to sync provider statuses' }, { status: 500 });
  }
}
