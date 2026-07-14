import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ message: 'Missing coupon code' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, message: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ valid: false, message: 'Coupon code has expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (err) {
    console.error('Coupon validation API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
