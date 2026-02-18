import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, X, Sparkles, MessageCircle, HelpCircle, Pill, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import type { Message } from '../../../worker/types';
interface DrAuraChatProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}
export function DrAuraChat({ patientId, isOpen, onClose }: DrAuraChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isUserScrolling && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isLoading, isUserScrolling]);
  const loadHistory = async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };
  const handleSend = async (content?: string) => {
    const textToSend = content || input;
    if (!textToSend.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setIsUserScrolling(false);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    try {
      let accumulated = '';
      await chatService.sendMessage(textToSend, undefined, (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      });
      await loadHistory();
      setStreamingContent('');
    } catch (err) {
      console.error("Chat message failed", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    setIsUserScrolling(!isAtBottom);
  };
  const QUICK_ACTIONS = [
    { label: "Medications", icon: Pill, value: "Explain my current medication schedule." },
    { label: "Lab Results", icon: HelpCircle, value: "Help me understand my latest blood work results." },
    { label: "Health Plan", icon: Sparkles, value: "What is the recommended follow-up for my condition?" }
  ];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] sm:w-[420px] h-[650px] max-h-[calc(100vh-8rem)] bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl flex flex-col z-[100] overflow-hidden"
        >
          <div className="p-5 bg-gradient-to-r from-sky-600 to-teal-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Dr. Aura</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-80 uppercase tracking-widest">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  ID: #{patientId.slice(0, 8)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea 
            className="flex-1 p-5" 
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="space-y-6">
              <div className="bg-sky-50/50 dark:bg-sky-900/10 p-3 rounded-2xl border border-sky-100/50 flex items-start gap-2 text-[10px] text-sky-800 dark:text-sky-300">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <p>Aura Clinical AI uses your encrypted health records to provide personalized insights. For emergency care, please call 911 immediately.</p>
              </div>
              {messages.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="h-20 w-20 bg-sky-50 dark:bg-sky-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-sky-500" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2 text-lg">Smart Clinical Assistant</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    How can I help you understand your health profile today? I can explain medications, lab results, or your clinical history.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleSend(action.value)}
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-900/50 rounded-2xl text-xs font-bold transition-all border border-transparent hover:border-sky-200"
                      >
                        <action.icon className="h-3 w-3" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-muted/80 border border-border/50 text-foreground rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm bg-muted/80 border border-border/50 text-foreground rounded-tl-none">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-4 ml-1 bg-sky-500 animate-pulse align-middle" />
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-muted/50 rounded-3xl rounded-tl-none p-4 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    <span className="text-xs font-medium text-muted-foreground italic">Analyzing clinical record...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-1" />
            </div>
          </ScrollArea>
          <div className="p-5 border-t bg-muted/20">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your health..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-background rounded-2xl border-none shadow-inner h-12 px-5 focus-visible:ring-1 focus-visible:ring-sky-500"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-sky-600 hover:bg-sky-700 h-12 w-12 rounded-2xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
               <ShieldCheck className="h-3 w-3 text-muted-foreground" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End-to-End Encrypted HIPAA Session</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}