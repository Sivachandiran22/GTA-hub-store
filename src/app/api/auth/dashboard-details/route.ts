import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const authPayload = getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = authPayload.id;

    // Fetch user-specific records
    const downloads = await prisma.downloadToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { title: true, version: true, downloadSize: true, slug: true }
        }
      }
    });

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ downloads, orders, tickets });
  } catch (err) {
    console.error('Dashboard details API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
