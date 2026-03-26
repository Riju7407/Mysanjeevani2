import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/lib/models/Vendor';

// GET pending vendors
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const status = request.nextUrl.searchParams.get('status') || 'pending';

    const vendors = await Vendor.find({ status }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: `${status} vendors`,
        vendors,
        count: vendors.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching vendors:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST - Approve or reject vendor
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { vendorId, action, rejectionReason } = body;

    if (!vendorId || !action) {
      return NextResponse.json(
        { error: 'Vendor ID and action required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        status: 'verified',
        verifiedAt: new Date(),
      };
    } else {
      updateData = {
        status: 'rejected',
        rejectionReason: rejectionReason || 'Application rejected',
      };
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      updateData,
      { new: true }
    ).select('-password');

    return NextResponse.json(
      {
        message: `Vendor ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        vendor: updatedVendor,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating vendor:', error.message);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// PUT - Suspend or reactivate vendor
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { vendorId, action } = body;

    if (!vendorId || !action) {
      return NextResponse.json(
        { error: 'Vendor ID and action required' },
        { status: 400 }
      );
    }

    if (!['suspend', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be suspend or reactivate' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    if (action === 'suspend') {
      updateData = {
        status: 'suspended',
        isActive: false,
      };
    } else {
      updateData = {
        status: 'verified',
        isActive: true,
      };
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      vendorId,
      updateData,
      { new: true }
    ).select('-password');

    return NextResponse.json(
      {
        message: `Vendor ${action === 'suspend' ? 'suspended' : 'reactivated'} successfully`,
        vendor: updatedVendor,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating vendor status:', error.message);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}
