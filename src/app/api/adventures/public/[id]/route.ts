import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { getPublicUrl } from '@/lib/r2';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await connectDB();

    const adventure = await Adventure.findById(id).lean();
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    if (adventure.visibility !== 'public' || adventure.status !== 'completed') {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    const imageUrls = adventure.imageKeys.map((key: string) => getPublicUrl(key));

    const adventureWithUrls = {
      ...adventure,
      id: adventure._id.toString(),
      userId: adventure.userId.toString(),
      imageUrls,
      createdAt: adventure.createdAt.toISOString(),
      updatedAt: adventure.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: adventureWithUrls,
    });
  } catch (error) {
    console.error('Get public adventure error:', error);
    return NextResponse.json({ error: 'Failed to fetch adventure' }, { status: 500 });
  }
}