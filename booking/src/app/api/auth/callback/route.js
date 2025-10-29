import { NextResponse } from 'next/server';
import { saveTokenFromCode } from '@/lib/calendar';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Exchange code for tokens and save them
    await saveTokenFromCode(code);

    // Redirect to success page
    return NextResponse.redirect(new URL('/api/auth/success', request.url));
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json(
      { error: 'Failed to complete authorization' },
      { status: 500 }
    );
  }
}
