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

    // Extract text from PDF using pdf-parse
    let text: string;
    try {
      // Dynamic import to avoid server-side issues
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
      
      console.log(`PDF text extraction successful for ${pdfFile.name}:`, {
        pages: pdfData.numpages,
        textLength: text.length,
        firstChars: text.substring(0, 100)
      });
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      
      // Fallback to placeholder if PDF parsing fails
      text = `[PDF File: ${pdfFile.name}]\n\nPDF text extraction failed. The PDF might be image-based, password-protected, or corrupted.\n\nTo make this content searchable, please:\n1. Open the PDF in a PDF viewer\n2. Select all text (Ctrl/Cmd + A)\n3. Copy the text (Ctrl/Cmd + C)\n4. Paste into a new text file\n5. Save as .txt format\n6. Upload the .txt file instead.\n\nError details: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`;
    }

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
