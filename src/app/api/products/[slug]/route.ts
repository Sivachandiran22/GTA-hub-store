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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const product = await prisma.product.findUnique({
      where: { slug }
    });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Delete child records to satisfy DB constraints
    await prisma.review.deleteMany({ where: { productId: product.id } });
    await prisma.productGallery.deleteMany({ where: { productId: product.id } });
    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    await prisma.orderItem.deleteMany({ where: { productId: product.id } });
    await prisma.downloadToken.deleteMany({ where: { productId: product.id } });

    await prisma.product.delete({
      where: { slug }
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const body = await request.json();

    const product = await prisma.product.findUnique({
      where: { slug }
    });
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Unpack fields we want to update
    const data: any = {};
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.salePrice !== undefined) data.salePrice = body.salePrice ? parseFloat(body.salePrice) : null;
    if (body.isVisible !== undefined) data.isVisible = !!body.isVisible;
    if (body.isFeatured !== undefined) data.isFeatured = !!body.isFeatured;

    const updated = await prisma.product.update({
      where: { slug },
      data
    });

    return NextResponse.json({ message: 'Product updated successfully', product: updated });
  } catch (err) {
    console.error('Patch product API error:', err);
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
