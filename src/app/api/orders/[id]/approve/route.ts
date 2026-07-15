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

    // 2. Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Order is already approved' }, { status: 400 });
    }

    // 3. Update order inside transaction & generate tokens
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 12); // Exactly 12 hours download validity limit

      for (const item of order.orderItems) {
        await tx.downloadToken.create({
          data: {
            userId: order.userId,
            productId: item.productId,
            token: `dl_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`,
            expiresAt: expiry
          }
        });

        // Increment downloads count on the product model immediately
        await tx.product.update({
          where: { id: item.productId },
          data: { downloadsCount: { increment: 1 } }
        });
      }
    });

    return NextResponse.json({ message: 'Order approved and download tokens issued successfully' });
  } catch (err) {
    console.error('Order approval API error:', err);
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
