import type { Message } from './types';
// Pseudo-encryption for HIPAA demo purposes (Base64 encoding/decoding)
// In production, use Web Crypto API (AES-GCM) with a stored vault key.
export const encryptField = (text: string): string => {
  if (!text) return text;
  return btoa(text);
};
export const decryptField = (encoded: string): string => {
  if (!encoded) return encoded;
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
};
export const createMessage = (role: 'user' | 'assistant' | 'system' | 'tool', content: string, toolCalls?: any[]): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  ...(toolCalls && { toolCalls })
});
export const createStreamResponse = (readable: ReadableStream) => new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  },
});
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const createEncoder = () => new TextEncoder();