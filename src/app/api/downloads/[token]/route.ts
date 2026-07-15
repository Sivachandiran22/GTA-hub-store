import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

const SECRET_KEY = process.env.JWT_SECRET || 'gta-hub-store-premium-secret-key-322805b2';

async function signUrl(url: string, filename: string, expiry: number): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY);
  const data = encoder.encode(`${url}|${filename}|${expiry}`);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    data
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const downloadToken = await prisma.downloadToken.findUnique({
      where: { token },
      include: {
        product: true,
      },
    });

    if (!downloadToken) {
      return new Response('Download link invalid or expired', { status: 404 });
    }

    if (new Date() > downloadToken.expiresAt) {
      return new Response('This download link has expired. Please request a new one from your dashboard.', { status: 403 });
    }

    // Increment downloads count on the token
    await prisma.downloadToken.update({
      where: { id: downloadToken.id },
      data: { downloadsCount: { increment: 1 } },
    });

    // Also increment downloads count on the product model
    await prisma.product.update({
      where: { id: downloadToken.productId },
      data: { downloadsCount: { increment: 1 } },
    });

    const filename = `${downloadToken.product.slug}.zip`;
    const zipUrl = downloadToken.product.zipUrl;

    // Generate signed streaming URL valid for 5 minutes
    const expiry = Date.now() + 300000;
    const signature = await signUrl(zipUrl, filename, expiry);

    const streamUrl = new URL('/api/downloads/stream', request.url);
    streamUrl.searchParams.set('url', zipUrl);
    streamUrl.searchParams.set('filename', filename);
    streamUrl.searchParams.set('expiry', expiry.toString());
    streamUrl.searchParams.set('sig', signature);

    return NextResponse.redirect(streamUrl.toString());
  } catch (err) {
    console.error('Download token routing failed:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
