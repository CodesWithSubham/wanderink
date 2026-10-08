import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    const [totalAdventures, totalPhotos, completedAdventures] = await Promise.all([
      Adventure.countDocuments({ userId }),
      Adventure.aggregate([
        { $match: { userId: userId } },
        { $project: { photoCount: { $size: '$imageKeys' } } },
        { $group: { _id: null, total: { $sum: '$photoCount' } } },
      ]),
      Adventure.countDocuments({ userId, status: 'completed' }),
    ]);

    const totalPhotosCount = totalPhotos[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAdventures,
        totalPhotos: totalPhotosCount,
        totalStories: completedAdventures,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}