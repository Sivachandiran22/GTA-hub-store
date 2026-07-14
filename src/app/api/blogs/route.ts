import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error('Blogs API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
