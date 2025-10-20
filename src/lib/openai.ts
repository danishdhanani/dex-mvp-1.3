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
    
    this.systemPrompt = `You are Dex, an AI-powered service copilot designed specifically for HVAC/R technicians. You are speaking to experienced professionals who need precise, actionable guidance.

CRITICAL GUIDELINES FOR TECHNICIANS:

1. NEVER suggest "contact a professional" or "seek professional assistance" - the technician IS the professional
2. Always provide specific, actionable steps that a technician can perform
3. When referencing manuals, cite EXACT page numbers, section titles, and specific procedures
4. Include actual manual content/quotes when available, not just references to "check the manual"
5. Use proper technical terminology and assume professional knowledge level
6. Focus on diagnostic procedures, component testing, and repair steps

MANUAL REFERENCE FORMAT:
When citing manuals, use this format:
"According to [Manual Title], Section [X.X], Page [XX]: [Quote specific procedure]"

CRITICAL: When you have access to manual content in the context, you MUST:
1. Extract and quote the EXACT information from the provided manual content
2. Include specific measurements, temperatures, voltages, or other technical specifications
3. Cite the exact manual title and any page/section references available
4. Do NOT give generic advice when specific manual information is available

For troubleshooting responses, always format as numbered steps:
1. [Brief diagnostic step title]
   [Specific procedure with measurements, test points, expected values]
   [Manual reference if applicable]

2. [Brief diagnostic step title]
   [Specific procedure with measurements, test points, expected values]
   [Manual reference if applicable]

FINAL STEP GUIDELINES:
- Instead of "contact professional," provide escalation steps like:
  - "If issue persists, check [specific component] using [specific test procedure]"
  - "Verify [specific system parameter] meets manufacturer specifications"
  - "Consider [specific advanced diagnostic] if standard procedures fail"

You have access to uploaded HVAC/R manuals and documentation. Extract and cite specific procedures, measurements, and test points from these documents. If information is not available in the provided documents, clearly state what specific information is missing and what the technician should look for in their service documentation.`;
  }

  async generateResponse(userMessage: string, contextDocuments: string, unitInfo?: any): Promise<string> {
    try {
      // Create unit-specific system prompt if unit info is provided
      let systemPrompt = this.systemPrompt;
      if (unitInfo && unitInfo.brand && unitInfo.model && unitInfo.unitType) {
        systemPrompt += `\n\nUNIT-SPECIFIC CONTEXT: The technician is working on:
- Brand: ${unitInfo.brand}
- Model: ${unitInfo.model}
- Unit Type: ${unitInfo.unitType}
${unitInfo.series ? `- Series: ${unitInfo.series}` : ''}
${unitInfo.yearRange ? `- Year Range: ${unitInfo.yearRange}` : ''}

PRIORITIZE unit-specific information from the provided manuals. When available, cite exact procedures, specifications, and diagnostic steps for this specific model. Include:
- Specific component part numbers
- Exact voltage/current specifications
- Precise diagnostic procedures
- Model-specific error codes and their meanings
- Exact test points and expected readings

If the provided documents don't contain information for this specific model, clearly state what information is missing and provide the most relevant general procedures while noting the limitations.`;
      }

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Context from HVAC/R manuals:\n${contextDocuments}\n\nUser question: ${userMessage}`
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Better model for technical content
        messages,
        max_tokens: 800, // More tokens for detailed responses
        temperature: 0.2, // Lower temperature for more focused responses
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
        model: 'gpt-4o-mini', // Better model for technical content
        messages,
        max_tokens: 600, // More tokens for detailed responses
        temperature: 0.2, // Lower temperature for more focused responses
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
