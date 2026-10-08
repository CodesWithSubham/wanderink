import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { getPublicUrl } from '@/lib/r2';
import { publicAdventureQuerySchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const validation = publicAdventureQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      sort: searchParams.get('sort'),
    });

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { page, limit, search, sort } = validation.data;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      visibility: 'public',
      status: 'completed',
    };

    if (search) {
      query.$text = { $search: search };
    }

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'popular') {
      sortQuery = { likesCount: -1, createdAt: -1 };
    } else if (sort === 'mood') {
      sortQuery = { moodScore: -1, createdAt: -1 };
    }

    const [adventures, total] = await Promise.all([
      Adventure.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Adventure.countDocuments(query),
    ]);

    const adventuresWithUrls = await Promise.all(
      adventures.map(async (adv) => {
        const imageUrls = adv.imageKeys.map((key: string) => getPublicUrl(key));
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
    console.error('Get public adventures error:', error);
    return NextResponse.json({ error: 'Failed to fetch adventures' }, { status: 500 });
  }
}