import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, callbackURL } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: callbackURL || '/dashboard' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send verification email error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}