import { NextRequest, NextResponse } from 'next/server';
import { manualLibrary } from '@/lib/manual-library';

// GET /api/admin/manuals - List all manuals
export async function GET() {
  try {
    const manuals = await manualLibrary.getAllManuals();
    const stats = await manualLibrary.getLibraryStats();
    
    return NextResponse.json({
      manuals,
      stats
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve manuals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/manuals - Add a new manual
export async function POST(request: NextRequest) {
  try {
    const { title, filename, content, category, tags } = await request.json();

    if (!title || !filename || !content) {
      return NextResponse.json(
        { error: 'Title, filename, and content are required' },
        { status: 400 }
      );
    }

    // Validate content length (max 5MB of text)
    if (content.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File content too large. Please upload files smaller than 5MB.' },
        { status: 400 }
      );
    }

    const manualId = await manualLibrary.addManual(
      title,
      filename,
      content,
      category || 'General',
      tags || []
    );

    return NextResponse.json({
      success: true,
      manualId,
      message: 'Manual added successfully'
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to add manual' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/manuals - Delete a manual
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manualId = searchParams.get('id');

    if (!manualId) {
      return NextResponse.json(
        { error: 'Manual ID is required' },
        { status: 400 }
      );
    }

    const success = await manualLibrary.deleteManual(manualId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Manual not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Manual deleted successfully'
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete manual' },
      { status: 500 }
    );
  }
}
