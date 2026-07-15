import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SECRET_KEY = process.env.JWT_SECRET || 'gta-hub-store-premium-secret-key-322805b2';

async function verifySignature(url: string, filename: string, expiry: number, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const data = encoder.encode(`${url}|${filename}|${expiry}`);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBytes,
      data
    );
  } catch (e) {
    return false;
  }
}

function extractDriveId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename');
    const expiryStr = searchParams.get('expiry');
    const sig = searchParams.get('sig');

    if (!url || !filename || !expiryStr || !sig) {
      return new Response('Bad Request: Missing parameters', { status: 400 });
    }

    const expiry = parseInt(expiryStr);
    if (Date.now() > expiry) {
      return new Response('Forbidden: The signed streaming URL has expired. Please try downloading again.', { status: 403 });
    }

    // Verify signature to prevent URL tampering
    const isValid = await verifySignature(url, filename, expiry, sig);
    if (!isValid) {
      return new Response('Forbidden: Signature mismatch. Access denied.', { status: 403 });
    }

    // Proxy the remote file
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        let downloadUrl = url;
        const driveId = extractDriveId(url);
        
        if (driveId && (url.includes('drive.google.com') || url.includes('drive.usercontent.google.com'))) {
          const initialUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
          const initialRes = await fetch(initialUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const contentType = initialRes.headers.get('Content-Type') || '';
          if (contentType.includes('text/html')) {
            const htmlText = await initialRes.text();
            
            // Extract hidden inputs from warning page
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
                // Hard error handling
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
                return new Response(
                  'Error: Google Drive blocked the direct download. The file is private, deleted, or has exceeded its transfer limits. Please contact support at vasigaming2k23@gmail.com.',
                  { status: 502, headers: { 'Content-Type': 'text/plain' } }
                );
              }
            }
          } else {
            // Binary stream returned immediately
            if (initialRes.ok && initialRes.body) {
              const headers: any = {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache',
              };
              const contentLength = initialRes.headers.get('Content-Length');
              if (contentLength) {
                headers['Content-Length'] = contentLength;
              }
              return new Response(initialRes.body, { headers });
            }
          }
        }

        const response = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (response.ok && response.body) {
          const finalContentType = response.headers.get('Content-Type') || '';
          if (finalContentType.includes('text/html')) {
            const htmlContent = await response.text();
            if (htmlContent.includes('Quota exceeded') || htmlContent.includes('too many users')) {
              return new Response(
                'Error: The download quota for this Google Drive file has been exceeded. Please contact support at vasigaming2k23@gmail.com to request an alternative mirror link.',
                { status: 429, headers: { 'Content-Type': 'text/plain' } }
              );
            }
            if (htmlContent.includes('Access Denied') || htmlContent.includes('sign in') || htmlContent.includes('authorization')) {
              return new Response(
                'Error: Access restricted. The owner of the Google Drive link must set the file sharing permissions to "Anyone with the link". Please contact support at vasigaming2k23@gmail.com.',
                { status: 403, headers: { 'Content-Type': 'text/plain' } }
              );
            }
            return new Response(
              'Error: The secure asset file is currently offline or unreachable. The download link is dead or restricted. Please contact support at vasigaming2k23@gmail.com.',
              { status: 502, headers: { 'Content-Type': 'text/plain' } }
            );
          }

          const headers: any = {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache',
          };
          const contentLength = response.headers.get('Content-Length');
          if (contentLength) {
            headers['Content-Length'] = contentLength;
          }
          return new Response(response.body, { headers });
        } else {
          throw new Error(`Remote file download returned status ${response.status}`);
        }
      } catch (err) {
        console.error('Remote zip proxy stream failed:', err);
        return new Response(
          'Error: The secure asset file is currently offline or unreachable. The download link is dead or restricted. Please contact support at vasigaming2k23@gmail.com.',
          { status: 502, headers: { 'Content-Type': 'text/plain' } }
        );
      }
    }

    return new Response('Error: File location is not valid or unsupported.', { status: 400 });
  } catch (err) {
    console.error('Secure streaming runtime error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
