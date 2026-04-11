import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// DELETE /api/admin/doctors/pending-user/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actorRole = request.headers.get('x-user-role');
    if (actorRole !== 'admin') {
      return NextResponse.json({ error: 'Only admin can delete pending doctor accounts' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findOne({ _id: id, role: 'doctor' })
      .select('_id email phone')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Pending doctor account not found' }, { status: 404 });
    }

    const email = String((user as any).email || '').trim().toLowerCase();
    const phone = String((user as any).phone || '').trim();

    const doctorDeleteOrConditions: any[] = [{ userId: (user as any)._id }];
    if (email) {
      doctorDeleteOrConditions.push({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });
    }
    if (phone) {
      doctorDeleteOrConditions.push({ phone });
    }

    await Doctor.deleteMany({
      $or: doctorDeleteOrConditions,
    });

    await User.deleteOne({ _id: (user as any)._id, role: 'doctor' });

    return NextResponse.json({ message: 'Pending doctor account deleted permanently' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
