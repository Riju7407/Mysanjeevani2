import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Doctor } from '@/lib/models/Doctor';

// GET /api/doctors - list all available doctors (optionally filter by department)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';
    const search = searchParams.get('search') || '';

    const query: any = { isAvailable: true };
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
      delete query.isAvailable; // show all when searching
    }

    const doctors = await Doctor.find(query).sort({ rating: -1 }).lean();
    return NextResponse.json({ doctors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
