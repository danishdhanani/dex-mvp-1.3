import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';
    
    console.log('Requested filename:', filename, 'Download:', isDownload);
    
    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    console.log('Looking for file at:', filePath);
    console.log('Uploads directory exists:', fs.existsSync(uploadsDir));
    
    // List all files in uploads directory for debugging
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads directory:', files);
    }

    // Check if file exists
    let actualFilePath = filePath;
    if (!fs.existsSync(filePath)) {
      console.log('File not found with exact name, searching for files with suffix:', filename);
      
      // Try to find a file that ends with the requested filename
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        const matchingFile = files.find(file => file.endsWith(filename));
        
        if (matchingFile) {
          actualFilePath = path.join(uploadsDir, matchingFile);
          console.log('Found matching file:', matchingFile);
        } else {
          console.log('No matching file found');
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
    }

    // Read the file
    const fileBuffer = fs.readFileSync(actualFilePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.md':
        contentType = 'text/markdown';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
    }

    // Return the file with appropriate headers
    const contentDisposition = isDownload 
      ? `attachment; filename="${filename}"` 
      : `inline; filename="${filename}"`;
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
