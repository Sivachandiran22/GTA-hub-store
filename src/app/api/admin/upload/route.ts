import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    // 1. Authorize user is admin
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'thumbnail' | 'zip'

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate file size string
    const sizeInBytes = file.size;
    let sizeStr = '';
    if (sizeInBytes >= 1024 * 1024) {
      sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeStr = `${(sizeInBytes / 1024).toFixed(0)} KB`;
    }

    // Clean file name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    let relativePath = '';
    let absoluteDirPath = '';

    if (type === 'zip') {
      relativePath = `private_uploads/${fileName}`;
      absoluteDirPath = path.join(process.cwd(), 'private_uploads');
    } else {
      relativePath = `/uploads/${fileName}`;
      absoluteDirPath = path.join(process.cwd(), 'public', 'uploads');
    }

    // Ensure directory exists
    if (!fs.existsSync(absoluteDirPath)) {
      fs.mkdirSync(absoluteDirPath, { recursive: true });
    }

    const absoluteFilePath = path.join(absoluteDirPath, fileName);
    fs.writeFileSync(absoluteFilePath, buffer);

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: relativePath,
      size: sizeStr
    });
  } catch (err) {
    console.error('File upload API error:', err);
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
