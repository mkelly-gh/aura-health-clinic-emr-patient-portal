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
  const scrollViewportRef = useRef<HTMLDivElement>(null);
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
  // Enhanced pinning logic for rapid streaming updates
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
      toast.error("Node Connection Failure", { description: "Telemetry link severed during synthesis." });
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
          <div className="h-14 px-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-teal-400" />
              <div>
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Dr. Aura Assist</h3>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-teal-400 uppercase tracking-widest">Active Node 12-B</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 bg-amber-50 border-b border-amber-100 flex gap-2 text-[10px] text-amber-900 leading-tight">
            <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
            <p className="font-medium uppercase tracking-tight">Guidance node only. Not for primary clinical diagnosis or critical care decisions.</p>
          </div>
          <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
            <div className="divide-y divide-slate-100">
              {messages.filter(m => m.role !== 'system').map((m) => (
                <div 
                  key={m.id} 
                  data-clinical-id={m.id}
                  className={cn("p-4 text-[11px] leading-relaxed", m.role === 'user' ? 'bg-white' : 'bg-slate-50/80')}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {m.role === 'assistant' ? <Bot className="h-3.5 w-3.5 text-teal-700" /> : <User className="h-3.5 w-3.5 text-slate-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {m.role === 'assistant' ? 'Dr. Aura Synthesis' : 'Clinical User'}
                    </span>
                    <span className="text-[8px] font-mono text-slate-300 ml-auto">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              {streamingContent && (
                <div className="p-4 text-[11px] leading-relaxed bg-slate-50/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot className="h-3.5 w-3.5 text-teal-700" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dr. Aura Synthesis</span>
                  </div>
                  <div className="text-slate-800 font-medium">{streamingContent}</div>
                </div>
              )}
            </div>
            {isLoading && !streamingContent && (
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Querying SQL Registry...</span>
                </div>
              </div>
            )}
            {isExecutingTool && (
              <div className="mx-4 mb-4 p-2 bg-teal-50 border border-teal-100 flex items-center gap-2">
                <Database className="h-3 w-3 text-teal-600 animate-bounce" />
                <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest">Retrieving Clinical Data...</span>
              </div>
            )}
            <div ref={bottomRef} className="h-8 w-full" />
          </ScrollArea>
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="QUERY CLINICAL CONTEXT..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-slate-50 rounded-none border-slate-200 text-[11px] h-9 font-bold uppercase tracking-wider focus-visible:ring-teal-600"
                disabled={isLoading}
              />
              <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-slate-900 hover:bg-slate-800 h-9 w-9 shrink-0 rounded-none">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 opacity-40 grayscale">
               <div className="flex items-center gap-1.5">
                 <ShieldCheck className="h-3 w-3 text-teal-700" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 SECURE</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Database className="h-3 w-3 text-slate-500" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">D1_SQL_NODE</span>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}