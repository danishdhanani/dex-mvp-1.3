import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile') as File;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // For now, create a placeholder for PDF files
    // This allows the upload to work while we implement proper PDF parsing
    const text = `[PDF File: ${pdfFile.name}]\n\nThis is a PDF file. PDF text extraction is currently being implemented. The file has been uploaded successfully and can be referenced by filename.\n\nTo get the full text content searchable by the AI, please:\n1. Open the PDF in a PDF viewer\n2. Select all text (Ctrl/Cmd + A)\n3. Copy the text (Ctrl/Cmd + C)\n4. Paste into a new text file\n5. Save as .txt format\n6. Upload the .txt file instead.\n\nThis ensures the content is fully searchable by the AI assistant.`;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The PDF might be image-based or corrupted.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text: text,
      filename: pdfFile.name
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
