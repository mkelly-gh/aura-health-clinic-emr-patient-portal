import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Send, Loader2, Bot, X, Sparkles, MessageCircle, HelpCircle, Pill, ShieldCheck, Info, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
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
  const loadHistory = useCallback(async () => {
    try {
      const res = await chatService.getMessages();
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }, []);
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, messages.length, loadHistory]);
  useEffect(() => {
    if (!isUserScrolling && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isLoading, isUserScrolling]);
  const handleSend = async (content?: string) => {
    const textToSend = content || input;
    if (!textToSend.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setIsUserScrolling(false);
    const userMsg: Message = {
      id: uuid(),
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
      // After streaming finishes, refresh to get the official message objects from backend if needed,
      // but for better UX we just rely on local state or final re-fetch.
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
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
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
          initial={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] sm:w-[440px] h-[700px] max-h-[calc(100vh-10rem)] bg-white/80 dark:bg-card/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[2.5rem] flex flex-col z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-sky-600 to-teal-700 text-white flex items-center justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight tracking-tight">Dr. Aura</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-black opacity-80 uppercase tracking-[0.15em]">Clinical Node Active</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-2xl h-10 w-10 relative z-10 transition-transform active:scale-90" 
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          {/* Messages Area */}
          <ScrollArea
            className="flex-1 p-6"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="space-y-8 pb-4">
              {/* Disclaimer */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-sky-50/80 dark:bg-sky-950/30 p-4 rounded-3xl border border-sky-100/50 dark:border-sky-800/30 flex items-start gap-3 text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed shadow-sm"
              >
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-sky-600" />
                <p>Aura AI uses your encrypted medical history to provide personalized health insights. <strong>Not a replacement for emergency care.</strong></p>
              </motion.div>
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-10 px-6">
                  <div className="h-24 w-24 bg-gradient-to-tr from-sky-50 to-teal-50 dark:from-sky-900/20 dark:to-teal-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/50 dark:border-white/5">
                    <Sparkles className="h-12 w-12 text-sky-500 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-xl text-foreground mb-3">Your Health, Guided.</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-10">
                    I've reviewed your chart. How can I help you understand your wellness journey today?
                  </p>
                  <div className="flex flex-col gap-3">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSend(action.value)}
                        className="flex items-center gap-4 px-5 py-4 bg-white/50 dark:bg-muted/30 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-600 rounded-2xl text-sm font-bold transition-all border border-slate-100 dark:border-slate-800 shadow-sm group active:scale-[0.98]"
                      >
                        <div className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <action.icon className="h-4 w-4 text-sky-600 group-hover:text-white" />
                        </div>
                        <span className="flex-1 text-left">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {messages.filter(m => m.role !== 'system').map((m, idx) => (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className={cn("flex w-full group", m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    "flex flex-col max-w-[85%]",
                    m.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      "rounded-[1.75rem] px-5 py-4 text-[14px] leading-relaxed shadow-sm",
                      m.role === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none shadow-sky-200 dark:shadow-none'
                      : 'bg-white dark:bg-muted/50 border border-slate-100 dark:border-white/5 text-foreground rounded-tl-none'
                    )}>
                      {m.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-1 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.role === 'assistant' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.role === 'user' && <Check className="h-3 w-3 text-sky-500" />}
                    </div>
                  </div>
                </motion.div>
              ))}
              {streamingContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] rounded-[1.75rem] rounded-tl-none px-5 py-4 text-[14px] leading-relaxed shadow-sm bg-white dark:bg-muted/50 border border-slate-100 dark:border-white/5 text-foreground">
                    {streamingContent}
                    <motion.span 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-1.5 h-4 ml-1 bg-sky-500 align-middle" 
                    />
                  </div>
                </motion.div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-muted/30 rounded-[1.75rem] rounded-tl-none px-5 py-4 flex items-center gap-4 border border-dashed border-sky-200/50 dark:border-sky-800/30">
                    <div className="flex gap-1">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest italic">Aura is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-2" />
            </div>
          </ScrollArea>
          {/* Input Area */}
          <div className="p-6 border-t bg-slate-50/50 dark:bg-muted/20 relative">
            <div className="flex gap-3 relative z-10">
              <div className="relative flex-1 group">
                <Input
                  placeholder="Ask Aura anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="bg-white dark:bg-background rounded-2xl border-slate-200 dark:border-white/10 shadow-inner h-14 pl-5 pr-12 focus-visible:ring-2 focus-visible:ring-sky-500 transition-all text-[15px]"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none group-focus-within:text-sky-500/40 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-sky-600 hover:bg-sky-700 h-14 w-14 rounded-2xl shadow-[0_8px_16px_-4px_rgba(2,132,199,0.3)] active:scale-90 transition-all shrink-0"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-5 opacity-40">
               <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
               <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Secure Clinical Isolate Session</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}