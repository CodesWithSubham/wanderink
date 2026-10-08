import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Adventure } from '@/models/Adventure';
import { createPresignedGetUrlLong, getPublicUrl } from '@/lib/r2';
import { updateAdventureSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getAdventureWithUrls(adventure: any, isOwner: boolean) {
  const imageUrls = adventure.visibility === 'public'
    ? adventure.imageKeys.map((key: string) => getPublicUrl(key))
    : await Promise.all(adventure.imageKeys.map((key: string) => createPresignedGetUrlLong(key)));

  return {
    ...adventure.toObject ? adventure.toObject() : adventure,
    id: adventure._id.toString(),
    userId: adventure.userId.toString(),
    imageUrls,
    createdAt: adventure.createdAt.toISOString(),
    updatedAt: adventure.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    await connectDB();

    const adventure = await Adventure.findById(id).lean();
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    const isOwner = session?.user?.id === adventure.userId.toString();

    if (!isOwner && adventure.visibility === 'private') {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }

    const adventureWithUrls = await getAdventureWithUrls(adventure, isOwner);

    // Check if current user liked this adventure
    let isLiked = false;
    if (session?.user) {
      const { AdventureLike } = await import('@/models/AdventureLike');
      const like = await AdventureLike.findOne({
        userId: session.user.id,
        adventureId: id,
      }).lean();
      isLiked = !!like;
    }

    return NextResponse.json({
      success: true,
      data: { ...adventureWithUrls, isLiked },
    });
  } catch (error) {
    console.error('Get adventure error:', error);
    return NextResponse.json({ error: 'Failed to fetch adventure' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    if (adventure.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateAdventureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const updates = validation.data;
    Object.assign(adventure, updates);
    await adventure.save();

    const adventureWithUrls = await getAdventureWithUrls(adventure, true);

    return NextResponse.json({
      success: true,
      data: adventureWithUrls,
    });
  } catch (error) {
    console.error('Update adventure error:', error);
    return NextResponse.json({ error: 'Failed to update adventure' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    if (adventure.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete images from R2
    const { deleteObject } = await import('@/lib/r2');
    await Promise.all(adventure.imageKeys.map((key: string) => deleteObject(key)));

    // Delete likes
    const { AdventureLike } = await import('@/models/AdventureLike');
    await AdventureLike.deleteMany({ adventureId: id });

    // Delete adventure
    await Adventure.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete adventure error:', error);
    return NextResponse.json({ error: 'Failed to delete adventure' }, { status: 500 });
  }
}