import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return NextResponse.json({ user: session?.user || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}