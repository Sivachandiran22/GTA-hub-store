import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'gta-hub-store-premium-secret-key-322805b2';
    const jwt = require('jsonwebtoken');
    const authPayload = jwt.verify(token, JWT_SECRET);

    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ message: 'Missing subject or message' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: authPayload.id,
        subject,
        message,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ message: 'Support ticket submitted successfully', ticket }, { status: 201 });
  } catch (err) {
    console.error('Support API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
