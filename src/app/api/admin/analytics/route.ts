import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'gta-hub-store-premium-secret-key-322805b2';
    const jwt = require('jsonwebtoken');
    const authPayload = jwt.verify(token, JWT_SECRET);

    if (!authPayload || authPayload.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Aggregate statistics
    const totalOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const orders = await prisma.order.findMany({ where: { status: 'COMPLETED' } });
    const totalRevenue = orders.reduce((sum, o) => sum + o.netAmount, 0);

    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await prisma.product.count();

    // Fetch recent 5 completed orders
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      }
    });

    // Fetch products sorted by popularity
    const topProducts = await prisma.product.findMany({
      orderBy: { downloadsCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        downloadsCount: true,
        price: true,
        category: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCustomers,
        totalProducts
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user.fullName,
        customerEmail: o.user.email,
        amount: o.netAmount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentIntentId: o.paymentIntentId,
        date: o.createdAt
      })),
      topProducts: topProducts.map(p => ({
        id: p.id,
        title: p.title,
        downloads: p.downloadsCount,
        price: p.price,
        category: p.category.name
      }))
    });
  } catch (err) {
    console.error('Admin Analytics API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
