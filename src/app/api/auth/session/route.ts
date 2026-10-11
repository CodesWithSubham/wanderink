import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    return NextResponse.json({ user: session?.user || null, session: session?.session || null });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ user: null, session: null });
  }
}