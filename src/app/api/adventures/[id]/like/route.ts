import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { AdventureLike } from '@/models/AdventureLike';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const adventure = await Adventure.findById(id);
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    if (adventure.visibility === 'private' && adventure.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    const existingLike = await AdventureLike.findOne({
      userId: session.user.id,
      adventureId: id,
    });

    let liked: boolean;
    let likesCount: number;

    if (existingLike) {
      await AdventureLike.findByIdAndDelete(existingLike._id);
      liked = false;
      likesCount = Math.max(0, adventure.likesCount - 1);
    } else {
      await AdventureLike.create({
        userId: session.user.id,
        adventureId: id,
      });
      liked = true;
      likesCount = adventure.likesCount + 1;
    }

    adventure.likesCount = likesCount;
    await adventure.save();

    return NextResponse.json({
      success: true,
      data: { liked, likesCount },
    });
  } catch (error) {
    console.error('Like adventure error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}