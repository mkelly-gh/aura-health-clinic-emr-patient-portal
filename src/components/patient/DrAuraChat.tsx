import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Send, Loader2, Bot, X, Sparkles, MessageCircle, Pill, ShieldCheck, User, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
  const [isError, setIsError] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadHistory = useCallback(async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) setMessages(res.data.messages);
    } catch (err) {
      console.error("History sync failure", err);
    }
  }, []);
  useEffect(() => {
    if (isOpen) loadHistory();
  }, [isOpen, loadHistory]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isLoading]);
  const handleSend = async (content?: string) => {
    const textToSend = content || input;
    if (!textToSend.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    setIsError(false);
    setStreamingContent('');
    const userMsg: Message = { id: uuid(), role: 'user', content: textToSend.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    try {
      let accumulated = '';
      const result = await chatService.sendMessage(textToSend, undefined, (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      });
      if (!result.success) throw new Error(result.error);
      await loadHistory();
      setStreamingContent('');
    } catch (err) {
      setIsError(true);
      toast.error("Node Connection Failure");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l shadow-clinical z-[100] flex flex-col"
        >
          {/* Professional DOCKED Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded bg-teal-600 flex items-center justify-center border border-teal-500 shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight uppercase">Dr. Aura Clinical AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Active Registry Node</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-md" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex gap-3 text-[11px] text-amber-800 leading-relaxed shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-widest text-[9px]">Clinical Disclaimer</p>
                  <p className="font-medium">AI synthesis is for guidance only. Consult clinical attending for critical diagnosis.</p>
                </div>
              </div>
              {messages.filter(m => m.role !== 'system').map((m) => (
                <div key={m.id} className={cn("flex flex-col gap-2", m.role === 'user' ? 'items-end' : 'items-start')}>
                  <div className={cn(
                    "px-4 py-3 text-xs leading-relaxed max-w-[90%] border shadow-sm",
                    m.role === 'user' 
                      ? 'bg-slate-50 border-slate-200 rounded-lg rounded-tr-none text-slate-900' 
                      : 'bg-white border-teal-100 rounded-lg rounded-tl-none text-slate-800'
                  )}>
                    {m.content}
                  </div>
                  <div className="flex items-center gap-2 px-1 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                    {m.role === 'assistant' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex flex-col items-start gap-2">
                  <div className="px-4 py-3 text-xs leading-relaxed max-w-[90%] border border-teal-100 rounded-lg rounded-tl-none bg-white shadow-sm text-slate-800">
                    {streamingContent}
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex items-center gap-3 py-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic">Synthesizing Context...</span>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          </ScrollArea>
          <div className="p-5 border-t bg-slate-50">
            <div className="flex gap-2">
              <Input
                placeholder="Query patient chart..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-white rounded-md border-slate-200 text-xs h-10 shadow-sm focus-visible:ring-teal-600"
                disabled={isLoading}
              />
              <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-teal-700 hover:bg-teal-800 h-10 w-10 shrink-0 shadow-sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-50 grayscale">
               <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">HIPAA Synchronized Session</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}