import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Bot, X, ShieldCheck, User, AlertCircle, Database, Sparkles } from 'lucide-react';
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
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isLoading, scrollToBottom]);
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    try {
      let accumulated = '';
      const result = await chatService.sendMessage(text, undefined, (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      });
      if (!result.success) throw new Error(result.error);
      await loadHistory();
      setStreamingContent('');
    } catch (err) {
      toast.error("Registry Node Connection Timeout");
    } finally {
      setIsLoading(false);
    }
  };
  const isExecutingTool = streamingContent.includes('[System: Synchronizing Registry Results...]');
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-slate-200 z-[100] flex flex-col shadow-2xl"
        >
          <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-teal-600 flex items-center justify-center rounded-none shadow-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Dr. Aura Synthesis</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Node 12-B Clinical Engine</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none transition-colors" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-3 bg-amber-50 border-b border-amber-100 flex gap-3 text-[9px] text-amber-900 leading-tight">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
            <p className="font-bold uppercase tracking-tight">Clinical Assistant only. Not for emergency diagnostic use. All session telemetry is ephemeral.</p>
          </div>
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="divide-y divide-slate-100">
              {messages.filter(m => m.role !== 'system').map((m) => (
                <div key={m.id} className={cn("p-6 text-[11px] leading-relaxed", m.role === 'user' ? 'bg-white' : 'bg-slate-50/80')}>
                  <div className="flex items-center gap-2 mb-3">
                    {m.role === 'assistant' ? <Sparkles className="h-3.5 w-3.5 text-teal-700" /> : <User className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {m.role === 'assistant' ? 'Aura Insight' : 'Clinical User'}
                    </span>
                    <span className="text-[8px] font-mono text-slate-300 ml-auto">{new Date(m.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap selection:bg-teal-100">{m.content}</div>
                </div>
              ))}
              {streamingContent && (
                <div className="p-6 text-[11px] leading-relaxed bg-slate-50/80">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aura Insight</span>
                  </div>
                  <div className="text-slate-800 font-medium">{streamingContent}</div>
                </div>
              )}
            </div>
            {isLoading && !streamingContent && (
              <div className="p-6 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Synchronizing registry nodes...</span>
              </div>
            )}
            {isExecutingTool && (
              <div className="mx-6 mb-6 p-3 bg-teal-900 rounded-none border border-teal-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <Database className="h-4 w-4 text-teal-400 animate-pulse" />
                <span className="text-[9px] font-black text-teal-100 uppercase tracking-widest">Registry Retrieval Active • D1_SQL_NODE</span>
              </div>
            )}
            <div ref={bottomRef} className="h-10 w-full" />
          </ScrollArea>
          <div className="p-6 border-t bg-white shadow-2xl">
            <div className="flex gap-2">
              <Input
                placeholder="Query clinical context..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-slate-50 rounded-none border-slate-200 text-[11px] h-11 font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-teal-600 transition-all placeholder:text-slate-300"
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-slate-900 hover:bg-slate-800 h-11 w-11 shrink-0 rounded-none shadow-clinical-bold">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 mt-6 opacity-50">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 / AES-256</span>
               </div>
               <div className="flex items-center gap-2">
                 <Database className="h-3.5 w-3.5 text-slate-500" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Durable Store 3.0</span>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}