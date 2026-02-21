import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Send, Loader2, Bot, X, ShieldCheck, User, AlertCircle, Database } from 'lucide-react';
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
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, streamingContent, isLoading]);
  const handleSend = async (content?: string) => {
    const textToSend = content || input;
    if (!textToSend.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
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
      toast.error("Node Connection Failure");
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
          transition={{ type: 'tween', duration: 0.2 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white border-l border-slate-200 z-[100] flex flex-col shadow-2xl"
        >
          <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Dr. Aura Assist</h3>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Node 12-B Online</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-3 bg-amber-50 border-b border-amber-100 flex gap-2 text-[9px] text-amber-900 leading-tight">
            <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
            <p className="font-bold uppercase tracking-tight">Professional Guidance Only. Not for Clinical Crisis.</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-100">
              {messages.filter(m => m.role !== 'system').map((m) => (
                <div key={m.id} className={cn("p-6 text-[11px] leading-relaxed", m.role === 'user' ? 'bg-white' : 'bg-slate-50/80')}>
                  <div className="flex items-center gap-2 mb-2">
                    {m.role === 'assistant' ? <Bot className="h-4 w-4 text-teal-700" /> : <User className="h-4 w-4 text-slate-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {m.role === 'assistant' ? 'Dr. Aura Synthesis' : 'Clinical User'}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {streamingContent && (
                <div className="p-6 text-[11px] leading-relaxed bg-slate-50/80">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-teal-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dr. Aura Synthesis</span>
                  </div>
                  <div className="text-slate-800 font-medium">{streamingContent}</div>
                </div>
              )}
            </div>
            {isLoading && !streamingContent && (
              <div className="p-6 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Querying SQL...</span>
              </div>
            )}
            {isExecutingTool && (
              <div className="mx-6 mb-6 p-2 bg-teal-50 border border-teal-100 flex items-center gap-2">
                <Database className="h-3 w-3 text-teal-600 animate-bounce" />
                <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest">Registry Retrieval...</span>
              </div>
            )}
            <div ref={bottomRef} className="h-8 w-full" />
          </ScrollArea>
          <div className="p-6 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Query Clinical Context..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-slate-50 rounded-none border-slate-200 text-[11px] h-10 font-bold uppercase tracking-wider focus-visible:ring-1 focus-visible:ring-teal-600"
                disabled={isLoading}
              />
              <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-slate-900 hover:bg-slate-800 h-10 w-10 shrink-0 rounded-none">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 opacity-40">
               <div className="flex items-center gap-1.5">
                 <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Database className="h-3.5 w-3.5 text-slate-500" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">D1_SQL</span>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}