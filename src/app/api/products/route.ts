import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sort = searchParams.get('sort') || 'newest';
    const type = searchParams.get('type') || 'all'; // 'all', 'free', 'paid'
    const game = searchParams.get('game');
    
    const showHidden = searchParams.get('showHidden') === 'true';
    
    // Build where clause
    const where: any = {};
    if (!showHidden) {
      where.isVisible = true;
    }
    
    if (game && game !== 'all') {
      where.game = game;
    }
    
    if (category && category !== 'all') {
      where.category = { slug: category };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { shortDescription: { contains: search } },
        { longDescription: { contains: search } }
      ];
    }
    
    if (type === 'free') {
      where.isFree = true;
    } else if (type === 'paid') {
      where.isFree = false;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { downloadsCount: 'desc' };
    } else if (sort === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: { name: true, slug: true }
        },
        tags: {
          select: { tagName: true }
        }
      }
    });

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            products: {
              where: {
                isVisible: showHidden ? undefined : true,
                game: (game && game !== 'all') ? game : undefined
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ products, categories });
  } catch (err) {
    console.error('Products API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Admin create product
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload || authPayload.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      shortDescription,
      longDescription,
      price,
      salePrice,
      categoryId,
      thumbnailUrl,
      version,
      downloadSize,
      requirements,
      installationGuide,
      isFeatured,
      isFree,
      zipUrl,
      game,
      isVisible
    } = body;

    if (!title || !slug || !shortDescription || !longDescription || price === undefined || !categoryId || !thumbnailUrl || !zipUrl) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        shortDescription,
        longDescription,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        categoryId,
        thumbnailUrl,
        version: version || '1.0.0',
        downloadSize: downloadSize || '0 MB',
        requirements,
        installationGuide,
        isFeatured: !!isFeatured,
        isFree: !!isFree,
        isVisible: isVisible !== undefined ? !!isVisible : true,
        game: game || 'GTA5',
        zipUrl,
        seoTitle: `${title} - GTA Hub Store`,
        seoDescription: shortDescription,
      },
    });

    return NextResponse.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (err) {
    console.error('Create product API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Helper inline to avoid imports loops
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
