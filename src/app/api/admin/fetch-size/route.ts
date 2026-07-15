import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ size: '45 MB' });
    }

    let targetUrl = url.trim();
    
    // Parse Google Drive links
    const driveId = extractDriveId(targetUrl);
    if (driveId) {
      targetUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    }

    const response = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    let contentLength = response.headers.get('content-length');

    // If HEAD request yielded no length (often due to redirects or CDNs), perform GET
    if (!contentLength) {
      const getRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      contentLength = getRes.headers.get('content-length');
    }

    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      if (!isNaN(bytes) && bytes > 0) {
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        return NextResponse.json({ size: `${mb} MB` });
      }
    }

    return NextResponse.json({ size: '45 MB' });
  } catch (err) {
    console.error('Fetch size route error:', err);
    return NextResponse.json({ size: '45 MB' });
  }
}

function extractDriveId(url: string) {
  const reg1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const reg2 = /[?&]id=([a-zA-Z0-9_-]+)/;
  const match1 = url.match(reg1);
  if (match1) return match1[1];
  const match2 = url.match(reg2);
  if (match2) return match2[1];
  return null;
}
