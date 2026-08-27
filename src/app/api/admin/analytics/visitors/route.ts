import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total Page Views
    const totalPageViews = await prisma.visitorLog.count();

    // 2. Unique Visitors (distinct ipHash)
    const uniqueGroups = await prisma.visitorLog.groupBy({
      by: ['ipHash'],
    });
    const totalUniqueVisitors = uniqueGroups.length;

    // 3. Top Visited Paths
    const topPagesGroup = await prisma.visitorLog.groupBy({
      by: ['path'],
      _count: {
        path: true,
      },
      orderBy: {
        _count: {
          path: 'desc',
        },
      },
      take: 10,
    });

    const topPages = topPagesGroup.map((item) => ({
      path: item.path,
      count: item._count.path,
    }));

    // 4. Daily Traffic History (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.visitorLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        ipHash: true,
      },
    });

    const trafficHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      const dayLogs = logs.filter(
        (l) => l.createdAt.toISOString().split('T')[0] === dateString
      );
      const dayViews = dayLogs.length;
      const dayUniques = new Set(dayLogs.map((l) => l.ipHash)).size;

      trafficHistory.push({
        date: dateString,
        pageViews: dayViews,
        uniqueVisitors: dayUniques,
      });
    }

    // 5. Recent 10 Visitor Logs
    const recentLogs = await prisma.visitorLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      totalPageViews,
      totalUniqueVisitors,
      topPages,
      trafficHistory,
      recentLogs,
    });
  } catch (err: any) {
    console.error('Fetch visitor analytics error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

async function getAuthUser(request: Request) {
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
