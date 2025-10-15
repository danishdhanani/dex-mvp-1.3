// OpenAI API integration for custom GPT
import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;
  private systemPrompt: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is required');
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    try {
      this.client = new OpenAI({ apiKey });
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      throw new Error('Failed to initialize OpenAI client');
    }
    
    this.systemPrompt = `You are Dex, an AI-powered service copilot specializing in HVAC/R (Heating, Ventilation, Air Conditioning, and Refrigeration) systems. 

Your role is to help HVAC/R technicians with:
- Troubleshooting system issues
- Installation procedures
- Maintenance schedules
- Safety protocols
- Equipment specifications
- Code compliance
- Best practices

When answering questions:
1. Always prioritize safety first
2. Provide step-by-step instructions when appropriate
3. Reference specific manual sections when available
4. Suggest follow-up actions or verification steps
5. If you don't have specific information, clearly state what you don't know
6. Use technical terminology appropriately for HVAC/R professionals

You have access to uploaded HVAC/R manuals and documentation. Use this information to provide accurate, helpful responses. If the user's question requires information not in the provided documents, let them know and suggest they upload additional manuals or contact a specialist.`;
  }

  async generateResponse(userMessage: string, contextDocuments: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        {
          role: 'user',
          content: `Context from HVAC/R manuals:\n${contextDocuments}\n\nUser question: ${userMessage}`
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo', // Faster and cheaper model
        messages,
        max_tokens: 500, // Shorter responses for speed
        temperature: 0.3, // Lower temperature for more focused responses
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from AI assistant');
    }
  }

  async generateResponseWithoutContext(userMessage: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemPrompt + '\n\nNote: You do not have access to specific manual documents for this query. Provide general HVAC/R guidance and suggest that the user upload relevant manuals for more specific information.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo', // Faster and cheaper model
        messages,
        max_tokens: 400, // Shorter responses for speed
        temperature: 0.3, // Lower temperature for more focused responses
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from AI assistant');
    }
  }
}

export const openaiService = new OpenAIService();
