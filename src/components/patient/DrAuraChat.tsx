import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, ChevronDown, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  const loadHistory = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setIsLoading(true);
    // Optimistic update
    const tempId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: tempId,
      role: 'user',
      content: userMsg,
      timestamp: Date.now()
    }]);
    try {
      const res = await chatService.sendMessage(userMsg);
      if (res.success) {
        await loadHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-card border shadow-2xl rounded-2xl flex flex-col z-[100] overflow-hidden"
        >
          <div className="p-4 bg-sky-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Dr. Aura Assistant</h3>
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Context-Aware Active
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-10 w-10 text-sky-200 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ask Dr. Aura about your medications, test results, or health summary.</p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    m.role === 'user' 
                    ? 'bg-sky-600 text-white' 
                    : 'bg-muted border border-border text-foreground'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                    <span className="text-xs text-muted-foreground italic">Dr. Aura is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-background"
              />
              <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-sky-600 hover:bg-sky-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-3">
              AI insights are for informational purposes. Always consult a human doctor.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}