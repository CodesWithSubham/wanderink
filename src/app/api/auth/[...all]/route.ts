import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// This route handles all Better Auth endpoints
// GET /api/auth/* and POST /api/auth/*

export async function GET(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth GET handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth POST handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

// Optional: Handle other methods if needed
export async function PUT(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth PUT handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth DELETE handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth PATCH handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  try {
    return auth.handler(request);
  } catch (error) {
    console.error('Auth OPTIONS handler error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}