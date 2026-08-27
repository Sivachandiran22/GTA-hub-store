import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gtahub.store';

  // Base static page URLs
  const routes = [
    '',
    '/shop',
    '/blog',
    '/contact',
    '/support',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // Dynamic products from database
    const products = await prisma.product.findMany({
      where: { isVisible: true },
      select: { slug: true, updatedAt: true }
    });

    const productUrls = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Dynamic blogs from database
    const blogs = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, createdAt: true }
    });

    const blogUrls = blogs.map((b) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: b.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...routes, ...productUrls, ...blogUrls];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return routes;
  }
}
