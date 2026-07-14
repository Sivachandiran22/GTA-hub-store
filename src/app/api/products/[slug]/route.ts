import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Safely await params to support modern Next.js async params
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        gallery: {
          select: { id: true, imageUrl: true, mediaType: true }
        },
        tags: {
          select: { id: true, tagName: true }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error('Single product API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
