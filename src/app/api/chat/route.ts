import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { documentService } from '@/lib/documents';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get relevant documents for context
    const contextDocuments = await documentService.getRelevantContent(message);
    
    let response: string;
    
    if (contextDocuments.includes('No relevant documents found')) {
      // No documents available, generate response without context
      response = await openaiService.generateResponseWithoutContext(message);
    } else {
      // Generate response with document context
      response = await openaiService.generateResponse(message, contextDocuments);
    }
    
    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        response: 'Sorry, I encountered an error while processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
}


