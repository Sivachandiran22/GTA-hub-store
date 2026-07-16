import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

function extractDriveId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
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

    const zipUrl = downloadToken.product.zipUrl;

    if (zipUrl.startsWith('http://') || zipUrl.startsWith('https://')) {
      let downloadUrl = zipUrl;
      const driveId = extractDriveId(zipUrl);

      // If it's a Google Drive URL, we resolve the direct download link first
      if (driveId && (zipUrl.includes('drive.google.com') || zipUrl.includes('drive.usercontent.google.com'))) {
        try {
          const initialUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
          const initialRes = await fetch(initialUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const contentType = initialRes.headers.get('Content-Type') || '';
          if (contentType.includes('text/html')) {
            const htmlText = await initialRes.text();

            // Extract all hidden inputs from the warning form to bypass warning page
            const hiddenInputs: Record<string, string> = {};
            const inputTagsMatch = htmlText.match(/<input\s+[^>]*type="hidden"[^>]*>/g) || [];

            for (const tag of inputTagsMatch) {
              const nameMatch = tag.match(/name="([^"]+)"/);
              const valueMatch = tag.match(/value="([^"]+)"/);
              if (nameMatch && valueMatch) {
                hiddenInputs[nameMatch[1]] = valueMatch[1];
              }
            }

            if (Object.keys(hiddenInputs).length > 0) {
              const queryParams = new URLSearchParams();
              for (const [k, v] of Object.entries(hiddenInputs)) {
                queryParams.set(k, v);
              }
              downloadUrl = `https://drive.usercontent.google.com/download?${queryParams.toString()}`;
            } else {
              const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_.-]+)/);
              if (confirmMatch) {
                downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${driveId}`;
              } else {
                // Intercept quota or access errors on initial resolution
                if (htmlText.includes('Quota exceeded') || htmlText.includes('too many users')) {
                  return new Response(
                    'Error: The download quota for this Google Drive file has been exceeded. Please contact support at vasigaming2k23@gmail.com to request a direct download mirror link.',
                    { status: 429, headers: { 'Content-Type': 'text/plain' } }
                  );
                }
                if (htmlText.includes('Access Denied') || htmlText.includes('sign in') || htmlText.includes('authorization')) {
                  return new Response(
                    'Error: Access restricted on Google Drive. The file sharing permissions must be set to "Anyone with the link" by the owner. Please contact support at vasigaming2k23@gmail.com.',
                    { status: 403, headers: { 'Content-Type': 'text/plain' } }
                  );
                }
              }
            }
          }
        } catch (fetchErr) {
          console.error('Failed to resolve Google Drive link:', fetchErr);
        }
      }

      // Redirect browser directly to the final resolved download URL
      return NextResponse.redirect(downloadUrl);
    }

    // Serve local uploads
    if (zipUrl.startsWith('private_uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), zipUrl);
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        const fileStats = fs.statSync(filePath);
        const filename = `${downloadToken.product.slug}.zip`;
        return new Response(fileStream as any, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fileStats.size.toString(),
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    return new Response('Error: File location is not valid or unsupported.', { status: 400 });
  } catch (err) {
    console.error('Download token routing failed:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
