import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const headersList = await headers();
    await auth.api.signOut({ headers: headersList });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}