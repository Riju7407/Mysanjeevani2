import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
