import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Question } from '@/lib/models/Question';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const productId = request.nextUrl.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const questions = await Question.find({ productId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        message: 'Questions fetched successfully',
        questions,
        total: questions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, productId, question, userName } = body;

    if (!userId || !productId || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newQuestion = await Question.create({
      userId,
      productId,
      question,
      userName,
    });

    return NextResponse.json(
      {
        message: 'Question posted successfully',
        question: newQuestion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
