import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await auth.api.signOut({ headers: await headers() });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}