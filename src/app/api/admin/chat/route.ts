import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Reactive Auto-erasure: Delete messages older than 30 days
    const pruneThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await prisma.chatMessage.deleteMany({
      where: {
        createdAt: { lt: pruneThreshold }
      }
    });

    // 2. Fetch all chat messages to aggregate conversations
    const allMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      }
    });

    // Group client-side by userId to get the most recent conversation details
    const conversationsMap = new Map();
    for (const msg of allMessages) {
      if (!conversationsMap.has(msg.userId)) {
        conversationsMap.set(msg.userId, {
          userId: msg.userId,
          fullName: msg.user.fullName,
          email: msg.user.email,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          isAdminSender: msg.isAdmin
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('Admin chat list GET error:', err);
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
