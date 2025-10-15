import { NextRequest } from 'next/server';
import { openaiService } from '@/lib/openai';
import { documentService } from '@/lib/documents';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 });
    }

    // Get relevant documents for context
    const contextDocuments = await documentService.getRelevantContent(message);
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response: string;
          
          if (contextDocuments.includes('No relevant documents found')) {
            // No documents available, generate response without context
            response = await openaiService.generateResponseWithoutContext(message);
          } else {
            // Generate response with document context
            response = await openaiService.generateResponse(message, contextDocuments);
          }

          // Stream the response word by word
          const words = response.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(encoder.encode(chunk));
            
            // Add small delay between words for streaming effect
            await new Promise(resolve => setTimeout(resolve, 20));
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
