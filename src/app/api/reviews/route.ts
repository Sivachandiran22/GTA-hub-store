import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const authPayload = getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating || !comment) {
      return NextResponse.json({ message: 'Missing review parameters' }, { status: 400 });
    }

    // 1. Check if user already reviewed this product to avoid duplicates
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: authPayload.id
      }
    });

    if (existingReview) {
      return NextResponse.json({ message: 'You have already reviewed this product' }, { status: 409 });
    }

    // 2. Check if user bought the product to tag verified purchase
    const completedOrder = await prisma.order.findFirst({
      where: {
        userId: authPayload.id,
        status: 'COMPLETED',
        orderItems: {
          some: { productId }
        }
      }
    });

    const isVerifiedPurchase = !!completedOrder;

    // 3. Create the review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: authPayload.id,
        rating: parseInt(rating),
        comment,
        isVerifiedPurchase,
        helpfulVotes: 0
      },
      include: {
        user: { select: { fullName: true } }
      }
    });

    // 4. Recalculate average product rating
    const allReviews = await prisma.review.findMany({
      where: { productId }
    });

    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: parseFloat(averageRating.toFixed(1)) }
    });

    return NextResponse.json({ message: 'Review posted successfully', review }, { status: 201 });
  } catch (err) {
    console.error('Review submit API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
