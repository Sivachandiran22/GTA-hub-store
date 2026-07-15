import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 1. Authorize user is admin
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { reason } = body;

    // 2. Fetch order
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // 3. Mark as CANCELLED and save rejection reason
    await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason || 'Your transaction ID is invalid'
      }
    });

    return NextResponse.json({ message: 'Order rejected/cancelled successfully' });
  } catch (err) {
    console.error('Order reject API error:', err);
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
