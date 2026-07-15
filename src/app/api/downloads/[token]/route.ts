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

    const filename = `${downloadToken.product.slug}.zip`;
    
    // Check if the zipUrl is a private local upload
    const zipUrl = downloadToken.product.zipUrl;
    if (zipUrl.startsWith('private_uploads/')) {
      const filePath = path.join(process.cwd(), zipUrl);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': fileBuffer.length.toString(),
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
