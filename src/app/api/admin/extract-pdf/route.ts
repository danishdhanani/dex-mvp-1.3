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

    // Extract text from PDF using multiple approaches
    let text: string = '';
    let extractionMethod = '';
    
    try {
      // Method 1: Try pdf2json first
      try {
        const PDFParser = require('pdf2json');
        
               const parsePDF = (buffer: Buffer): Promise<string> => {
                 return new Promise((resolve, reject) => {
                   const pdfParser = new PDFParser();
                   
                   // Set a timeout for the entire parsing operation
                   const timeout = setTimeout(() => {
                     reject(new Error('PDF parsing timeout - pdf2json took too long'));
                   }, 20000); // 20 second timeout

                   pdfParser.on('pdfParser_dataError', (errData: any) => {
                     clearTimeout(timeout);
                     reject(new Error(errData.parserError));
                   });

                   pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                     clearTimeout(timeout);
                     try {
                       let extractedText = '';

                       if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
                         // Limit to first 10 pages to prevent memory issues
                         const pagesToProcess = pdfData.Pages.slice(0, 10);
                         
                         for (const page of pagesToProcess) {
                           if (page.Texts && Array.isArray(page.Texts)) {
                             for (const textItem of page.Texts) {
                               if (textItem.R && Array.isArray(textItem.R)) {
                                 for (const run of textItem.R) {
                                   if (run.T) {
                                     extractedText += decodeURIComponent(run.T) + ' ';
                                   }
                                 }
                               }
                             }
                           }
                         }
                       }

                       resolve(extractedText.trim());
                     } catch (error) {
                       reject(error);
                     }
                   });

                   pdfParser.parseBuffer(buffer);
                 });
               };
        
        text = await parsePDF(buffer);
        extractionMethod = 'pdf2json';
        
        console.log(`PDF text extraction with pdf2json for ${pdfFile.name}:`, {
          textLength: text.length,
          firstChars: text.substring(0, 100)
        });
        
             } catch (pdf2jsonError) {
               console.log('pdf2json failed, trying pdfreader...', pdf2jsonError instanceof Error ? pdf2jsonError.message : String(pdf2jsonError));
        
        // Method 2: Try pdfreader as fallback
        const { PdfReader } = require('pdfreader');
        
        const parsePDFWithReader = (buffer: Buffer): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new PdfReader();
            const textLines: string[] = [];
            let hasError = false;
            
            // Set a timeout to prevent hanging
            const timeout = setTimeout(() => {
              if (!hasError) {
                hasError = true;
                reject(new Error('PDF parsing timeout - pdfreader took too long'));
              }
            }, 30000); // 30 second timeout
            
            reader.parseBuffer(buffer, (err: any, item: any) => {
              if (hasError) return;
              
              if (err) {
                hasError = true;
                clearTimeout(timeout);
                reject(err);
              } else if (!item) {
                // End of file
                hasError = true;
                clearTimeout(timeout);
                resolve(textLines.join('\n').trim());
              } else if (item.text) {
                textLines.push(item.text);
              }
            });
          });
        };
        
        text = await parsePDFWithReader(buffer);
        extractionMethod = 'pdfreader';
        
        console.log(`PDF text extraction with pdfreader for ${pdfFile.name}:`, {
          textLength: text.length,
          firstChars: text.substring(0, 100)
        });
      }
      
      // Check if we got meaningful text
      if (!text || text.trim().length === 0) {
        // Try to provide more specific error message
        const errorMessage = extractionMethod === 'pdf2json' 
          ? 'No text content could be extracted from this PDF. It may be an image-based PDF (scanned document) that requires OCR (Optical Character Recognition) to extract text.'
          : 'No text content could be extracted from this PDF. It may be an image-based PDF or contain only non-text elements.';
        
        throw new Error(errorMessage);
      }
      
      // Check if the extracted text is too short (might indicate parsing issues)
      if (text.trim().length < 50) {
        console.warn(`PDF ${pdfFile.name} extracted only ${text.trim().length} characters with ${extractionMethod}, which might indicate parsing issues`);
      }
      
           } catch (pdfError) {
             console.error('PDF parsing error:', pdfError);

             // Return error instead of fallback text when PDF parsing fails
             return NextResponse.json(
               {
                 error: 'PDF text extraction failed. The PDF might be image-based, password-protected, or corrupted. Please try uploading a text file instead.',
                 details: pdfError instanceof Error ? pdfError.message : 'Unknown error',
                 suggestion: 'For image-based PDFs, consider using an OCR tool to convert to text first.'
               },
               { status: 400 }
             );
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
