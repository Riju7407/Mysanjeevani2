import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This would typically fetch from your database
    // For now, we'll return mock data structure
    const stats = {
      totalUsers: 0,
      totalVendors: 0,
      totalMedicines: 0,
      totalConsultations: 0,
      totalRevenue: 0,
      totalOrders: 0,
      pendingConsultations: 0,
      activeVendors: 0,
      dailyOrders: [],
      userGrowth: [],
      revenueGrowth: [],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
