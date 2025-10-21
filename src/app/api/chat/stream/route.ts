import { NextRequest } from 'next/server';
import { openaiService } from '@/lib/openai';
import { documentService } from '@/lib/documents';

export async function POST(request: NextRequest) {
  try {
    const { message, unitInfo, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 });
    }

    // Check if unit info is provided and complete (brand and model must be non-empty)
    const hasCompleteUnitInfo = unitInfo && unitInfo.brand && unitInfo.model && unitInfo.unitType && 
                                unitInfo.brand.trim() !== '' && unitInfo.model.trim() !== '';
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response: string;
          
          if (hasCompleteUnitInfo) {
            // Get unit-specific documents for context
            const contextDocuments = await documentService.getUnitSpecificContent(message, unitInfo);
            
            if (contextDocuments.includes('No manuals found') || contextDocuments.includes('No relevant content found')) {
              // No unit-specific documents available, generate general response
              response = await openaiService.generateResponseWithoutContext(message, conversationHistory);
            } else {
              // Generate response with unit-specific document context
              response = await openaiService.generateResponse(message, contextDocuments, unitInfo, conversationHistory);
            }
          } else {
            // No unit info provided - generate general HVAC/R response without manual content
            response = await openaiService.generateResponseWithoutContext(message, conversationHistory);
          }

          // Stream the response word by word
          const words = response.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(encoder.encode(chunk));
            
            // Add small delay between words for streaming effect
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          // Add source content at the end (hidden by default) - only for unit-specific responses
          if (hasCompleteUnitInfo && (response.includes('*Source:') || response.includes('*Inferred from'))) {
            controller.enqueue(encoder.encode('\n\n---SOURCE_CONTENT_START---\n'));
            if (hasCompleteUnitInfo) {
              const contextDocuments = await documentService.getUnitSpecificContent(message, unitInfo);
              controller.enqueue(encoder.encode(contextDocuments));
            }
            controller.enqueue(encoder.encode('\n---SOURCE_CONTENT_END---'));
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode('Sorry, I encountered an error while processing your request.'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
