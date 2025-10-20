// Test pdf2json package
const PDFParser = require('pdf2json');

console.log('PDFParser:', typeof PDFParser);

// Test with a simple buffer
const testBuffer = Buffer.from('test');
console.log('Testing with PDFParser...');

async function testPDF2JSON() {
  try {
    const pdfParser = new PDFParser();
    console.log('PDFParser instance created');
    
    // Set up event handlers
    pdfParser.on('pdfParser_dataError', errData => {
      console.log('Data error:', errData.parserError);
    });
    
    pdfParser.on('pdfParser_dataReady', pdfData => {
      console.log('Data ready:', typeof pdfData);
      console.log('Pages:', pdfData.Pages ? pdfData.Pages.length : 'No pages');
    });
    
    // Try to parse buffer
    pdfParser.parseBuffer(testBuffer);
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testPDF2JSON();
