import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { HealthArticle } from '@/lib/models/HealthArticle';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    const query: any = { isPublished: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const articles = await HealthArticle.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await HealthArticle.countDocuments(query);

    return NextResponse.json(
      {
        message: 'Articles fetched successfully',
        articles,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get articles error:', error);
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
    const {
      title,
      content,
      summary,
      author,
      category,
      tags,
      relatedHealthConcerns,
      readTime,
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const article = await HealthArticle.create({
      title,
      content,
      summary,
      author,
      category,
      tags,
      relatedHealthConcerns,
      readTime,
      isPublished: true,
    });

    return NextResponse.json(
      {
        message: 'Article published successfully',
        article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
