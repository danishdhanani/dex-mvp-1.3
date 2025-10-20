import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { documentService } from '@/lib/documents';

export async function POST(request: NextRequest) {
  try {
    const { message, unitInfo } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get relevant documents for context (unit-specific if unit info provided)
    let contextDocuments: string;
    if (unitInfo && unitInfo.brand && unitInfo.model && unitInfo.unitType) {
      // Use unit-specific document search
      contextDocuments = await documentService.getUnitSpecificContent(message, unitInfo);
    } else {
      // Use general document search
      contextDocuments = await documentService.getRelevantContent(message);
    }
    
    let response: string;
    
    if (contextDocuments.includes('No relevant documents found')) {
      // No documents available, generate response without context
      response = await openaiService.generateResponseWithoutContext(message);
    } else {
      // Generate response with document context and unit information
      response = await openaiService.generateResponse(message, contextDocuments, unitInfo);
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


