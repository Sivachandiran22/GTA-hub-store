import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

// 30 days retention policy in milliseconds
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const authPayload = getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = authPayload.id;

    // 1. Reactive Auto-erasure: Delete messages older than 1 month (30 days)
    const pruneThreshold = new Date(Date.now() - THIRTY_DAYS_MS);
    await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: pruneThreshold }
      }
    });

    // 2. Fetch history for this user
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Customer chat GET error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authPayload = getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = authPayload.id;
    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ message: 'Message content is empty' }, { status: 400 });
    }

    // 1. Reactive Auto-erasure before saving new
    const pruneThreshold = new Date(Date.now() - THIRTY_DAYS_MS);
    await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: pruneThreshold }
      }
    });

    // 2. Create new message
    const newMessage = await prisma.chatMessage.create({
      data: {
        userId,
        isAdmin: false,
        message: message.trim()
      }
    });

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    console.error('Customer chat POST error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
