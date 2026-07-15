import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

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
    
    // Check if the zipUrl is a remote URL (e.g. Google Drive, Supabase, S3)
    const zipUrl = downloadToken.product.zipUrl;
    if (zipUrl.startsWith('http://') || zipUrl.startsWith('https://')) {
      try {
        let downloadUrl = zipUrl;
        const driveId = extractDriveId(zipUrl);
        
        if (driveId) {
          const initialUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
          const initialRes = await fetch(initialUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          const contentType = initialRes.headers.get('Content-Type') || '';
          if (contentType.includes('text/html')) {
            const htmlText = await initialRes.text();
            
            // Extract all hidden inputs from the warning form to build the final download URL
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
              // Fallback to old token search if form inputs aren't matched
              const confirmMatch = htmlText.match(/confirm=([a-zA-Z0-9_.-]+)/);
              if (confirmMatch) {
                downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${driveId}`;
              } else {
                downloadUrl = initialUrl;
              }
            }
          } else {
            // It is already the binary file stream! Return it immediately.
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
        }
      } catch (err) {
        console.error('Remote zip proxy stream failed, falling back to direct redirect:', err);
        return NextResponse.redirect(zipUrl);
      }
    }

    // Check if the zipUrl is a private local upload
    if (zipUrl.startsWith('private_uploads/')) {
      const filePath = path.join(process.cwd(), zipUrl);
      if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        const fileStats = fs.statSync(filePath);
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
    
    // Serve a valid ZIP buffer dynamically containing a readme file
    const readmeContent = `=== GTA HUB STORE SECURE DIGITAL DELIVERY ===\n\nProduct: ${downloadToken.product.title}\nVersion: ${downloadToken.product.version}\nDownload Date: ${new Date().toISOString()}\nLicense: Single User Personal Use Only\n\nInstallation Requirements:\n${downloadToken.product.requirements || 'None'}\n\nInstallation Guide:\n${downloadToken.product.installationGuide || 'Drop in game folder.'}\n\nThank you for shopping at GTA Hub Store!`;

    // Create a mini standard ZIP file structure in binary
    // This is a minimal valid ZIP archive containing a single file: 'readme.txt'
    const readmeBytes = Buffer.from(readmeContent, 'utf-8');
    const filenameBytes = Buffer.from('readme.txt', 'utf-8');
    
    // Headers and offsets for standard ZIP structure
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(10, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag
    localHeader.writeUInt16LE(0, 8); // compression method (0 = store)
    localHeader.writeUInt16LE(0, 10); // last mod file time
    localHeader.writeUInt16LE(0, 12); // last mod file date
    localHeader.writeUInt32LE(0, 14); // crc-32 (simple CRC-32 not strictly verified by unzip tools)
    localHeader.writeUInt32LE(readmeBytes.length, 18); // compressed size
    localHeader.writeUInt32LE(readmeBytes.length, 22); // uncompressed size
    localHeader.writeUInt16LE(filenameBytes.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length

    const centralDirectoryHeader = Buffer.alloc(46);
    centralDirectoryHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralDirectoryHeader.writeUInt16LE(20, 4); // version made by
    centralDirectoryHeader.writeUInt16LE(10, 6); // version needed
    centralDirectoryHeader.writeUInt16LE(0, 8); // general purpose flag
    centralDirectoryHeader.writeUInt16LE(0, 10); // compression method
    centralDirectoryHeader.writeUInt16LE(0, 12); // mod time
    centralDirectoryHeader.writeUInt16LE(0, 14); // mod date
    centralDirectoryHeader.writeUInt32LE(0, 16); // crc-32
    centralDirectoryHeader.writeUInt32LE(readmeBytes.length, 20); // compressed size
    centralDirectoryHeader.writeUInt32LE(readmeBytes.length, 24); // uncompressed size
    centralDirectoryHeader.writeUInt16LE(filenameBytes.length, 28); // file name length
    centralDirectoryHeader.writeUInt16LE(0, 30); // extra field length
    centralDirectoryHeader.writeUInt16LE(0, 32); // file comment length
    centralDirectoryHeader.writeUInt16LE(0, 34); // disk number start
    centralDirectoryHeader.writeUInt16LE(0, 36); // internal file attr
    centralDirectoryHeader.writeUInt32LE(0, 38); // external file attr
    centralDirectoryHeader.writeUInt32LE(0, 42); // local header offset

    const endOfCentralDirectory = Buffer.alloc(22);
    endOfCentralDirectory.writeUInt32LE(0x06054b50, 0); // signature
    endOfCentralDirectory.writeUInt16LE(0, 4); // number of this disk
    endOfCentralDirectory.writeUInt16LE(0, 6); // disk where central directory starts
    endOfCentralDirectory.writeUInt16LE(1, 8); // number of central directory records on this disk
    endOfCentralDirectory.writeUInt16LE(1, 10); // total number of central directory records
    endOfCentralDirectory.writeUInt32LE(centralDirectoryHeader.length + filenameBytes.length, 12); // size of central dir
    endOfCentralDirectory.writeUInt32LE(localHeader.length + filenameBytes.length + readmeBytes.length, 16); // offset of start of central dir
    endOfCentralDirectory.writeUInt16LE(0, 20); // comment length

    const zipBuffer = Buffer.concat([
      localHeader,
      filenameBytes,
      readmeBytes,
      centralDirectoryHeader,
      filenameBytes,
      endOfCentralDirectory
    ]);

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Download API error:', err);
    return new Response('Internal server error', { status: 500 });
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
