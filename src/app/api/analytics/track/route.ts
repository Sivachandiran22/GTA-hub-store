import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ message: 'Path is required' }, { status: 400 });
    }

    // Extract headers for IP and User-Agent
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Hash the IP to protect privacy but uniquely identify visitors
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    // Save visitor event
    await prisma.visitorLog.create({
      data: {
        ipHash,
        path,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
