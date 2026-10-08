import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { createPresignedGetUrlLong, getPublicUrl } from '@/lib/r2';
import { createAdventureSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = { userId: session.user.id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [adventures, total] = await Promise.all([
      Adventure.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Adventure.countDocuments(query),
    ]);

    const adventuresWithUrls = await Promise.all(
      adventures.map(async (adv) => {
        const imageUrls = adv.visibility === 'public'
          ? adv.imageKeys.map((key: string) => getPublicUrl(key))
          : await Promise.all(adv.imageKeys.map((key: string) => createPresignedGetUrlLong(key)));

        return {
          ...adv,
          id: adv._id.toString(),
          userId: adv.userId.toString(),
          imageUrls,
          createdAt: adv.createdAt.toISOString(),
          updatedAt: adv.updatedAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: adventuresWithUrls,
        total,
        page,
        limit,
        hasMore: skip + adventures.length < total,
      },
    });
  } catch (error) {
    console.error('Get adventures error:', error);
    return NextResponse.json({ error: 'Failed to fetch adventures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = createAdventureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { imageKeys, visibility } = validation.data;

    const adventure = await Adventure.create({
      userId: session.user.id,
      title: 'Processing...',
      summary: '',
      story: '',
      highlights: [],
      imageKeys,
      visibility,
      moodScore: 5,
      likesCount: 0,
      status: 'processing',
    });

    return NextResponse.json({
      success: true,
      data: {
        id: adventure._id.toString(),
        ...adventure.toObject(),
      },
    });
  } catch (error) {
    console.error('Create adventure error:', error);
    return NextResponse.json({ error: 'Failed to create adventure' }, { status: 500 });
  }
}