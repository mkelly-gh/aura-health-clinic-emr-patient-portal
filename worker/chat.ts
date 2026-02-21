import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    systemPromptOverride?: string,
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory, systemPromptOverride);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 4000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, systemPromptOverride, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 4000,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory, systemPromptOverride);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    systemPromptOverride: string | undefined,
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: any[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (const deltaToolCall of delta.tool_calls) {
            const index = deltaToolCall.index;
            if (index === undefined) continue;
            if (!accumulatedToolCalls[index]) {
              accumulatedToolCalls[index] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${index}`,
                type: 'function',
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || ''
                }
              };
            } else {
              if (deltaToolCall.function?.name) {
                accumulatedToolCalls[index].function.name += deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[index].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Clinical context synchronization failed.');
    }
    const validToolCalls = accumulatedToolCalls.filter(tc => tc && tc.function && tc.function.name);
    if (validToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(validToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, validToolCalls as any, executedTools, systemPromptOverride);
      // Ensure the user sees the final tool-augmented response in the stream
      if (onChunk && finalResponse) {
        // Clear or separate from previous content if any was partially emitted
        onChunk(`\n\n[System: Synchronizing Registry Results...]\n\n${finalResponse}`);
      }
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent.trim() || 'Clinical synthesis complete.' };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[],
    systemPromptOverride?: string
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'Empty response from clinical node.' };
    if (!responseMessage.tool_calls) {
      return { content: (responseMessage.content || '').trim() || 'Clinical synthesis complete.' };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as any[]);
    const finalResponse = await this.generateToolResponse(
      message,
      conversationHistory,
      responseMessage.tool_calls,
      toolCalls,
      systemPromptOverride
    );
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: any[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: 'Node execution failed' } };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[],
    systemPromptOverride?: string
  ): Promise<string> {
    const followUpCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPromptOverride || 'You are Dr. Aura, a professional medical AI assistant.' },
        ...history.filter(m => m.role !== 'system').slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        { role: 'assistant', content: null, tool_calls: openAiToolCalls },
        ...toolResults.map((result, index) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: openAiToolCalls[index]?.id || result.id
        }))
      ] as any,
      max_tokens: 2000
    });
    return (followUpCompletion.choices[0]?.message?.content || 'Clinical data retrieval processed.').trim();
  }
  private buildConversationMessages(userMessage: string, history: Message[], systemPromptOverride?: string) {
    const systemContent = systemPromptOverride || 'You are Dr. Aura, the clinical AI assistant. Provide professional, evidence-based guidance based on patient history.';
    // Filter out existing system messages from history to prevent duplication of the context prompt
    return [
      { role: 'system', content: systemContent },
      ...history.filter(m => m.role !== 'system').slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];
  }
}