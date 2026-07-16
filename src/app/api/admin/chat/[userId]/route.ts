import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { userId } = resolvedParams;

    // 1. Reactive Auto-erasure: Delete messages older than 30 days
    const pruneThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: pruneThreshold }
      }
    });

    // 2. Fetch full conversation thread
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('Admin chat thread GET error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { userId } = resolvedParams;

    const body = await request.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ message: 'Message content is empty' }, { status: 400 });
    }

    // 1. Reactive Auto-erasure before saving
    const pruneThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: pruneThreshold }
      }
    });

    // 2. Create admin reply
    const newMessage = await prisma.chatMessage.create({
      data: {
        userId,
        isAdmin: true,
        message: message.trim()
      }
    });

    return NextResponse.json({ message: newMessage });
  } catch (err) {
    console.error('Admin chat thread POST error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function getAuthUser(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'gta-hub-store-premium-secret-key-322805b2';
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
