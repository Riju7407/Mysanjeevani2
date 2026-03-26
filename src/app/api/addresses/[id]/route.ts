import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Address } from '@/lib/models/Address';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { type, fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault, userId } =
      body;

    // Find address
    const address = await Address.findById(id);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults for this user
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { userId: address.userId, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    // Update address
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        type: type || address.type,
        fullName: fullName || address.fullName,
        phone: phone || address.phone,
        addressLine1: addressLine1 || address.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
        city: city || address.city,
        state: state || address.state,
        pincode: pincode || address.pincode,
        isDefault: isDefault !== undefined ? isDefault : address.isDefault,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: 'Address updated successfully',
        address: updatedAddress,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Find address before deleting
    const address = await Address.findById(id);
    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Delete address
    await Address.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: 'Address deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
