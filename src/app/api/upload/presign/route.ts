import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createPresignedUploadUrl, generateKey } from '@/lib/r2';
import { presignUploadSchema } from '@/lib/validations';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = presignUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { files, visibility } = validation.data;
    const userId = session.user.id;

    const results = await Promise.all(
      files.map(async (file) => {
        const key = generateKey(userId, file.name);
        return createPresignedUploadUrl(key, file.type);
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URLs' }, { status: 500 });
  }
}