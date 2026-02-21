import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { Send, Loader2, Bot, X, Sparkles, MessageCircle, HelpCircle, Pill, ShieldCheck, User, Check, RefreshCw, AlertCircle } from 'lucide-react';
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
    setIsError(false);
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
      const result = await chatService.sendMessage(textToSend, undefined, (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      });
      if (!result.success) throw new Error(result.error || "Node fault");
      await loadHistory();
      setStreamingContent('');
    } catch (err) {
      console.error("Chat failure", err);
      setIsError(true);
      toast.error("Clinical Intelligence Node Offline", {
        description: "Communication was interrupted. Please retry."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 150;
    setIsUserScrolling(!isAtBottom);
  };
  const QUICK_ACTIONS = [
    { label: "Medication Schedule", icon: Pill, value: "Explain my current medication schedule based on my record." },
    { label: "Health Insights", icon: HelpCircle, value: "Synthesize a wellness summary based on my active diagnoses." },
    { label: "Care Recommendations", icon: Sparkles, value: "What are the recommended care steps for my clinical profile?" }
  ];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, y: 40, filter: 'blur(10px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-32 right-6 w-[calc(100vw-3rem)] sm:w-[480px] h-[750px] max-h-[calc(100vh-12rem)] bg-white/90 dark:bg-card/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-glass rounded-[3rem] flex flex-col z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-sky-600 to-teal-700 text-white flex items-center justify-between shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-black text-xl leading-tight tracking-tight uppercase">Dr. Aura</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[9px] font-black opacity-80 uppercase tracking-[0.2em]">Context Synchronized</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-2xl h-12 w-12 relative z-10 transition-transform active:scale-90"
              onClick={onClose}
            >
              <X className="h-7 w-7" />
            </Button>
          </div>
          {/* Messages Area */}
          <ScrollArea
            className="flex-1 p-8"
            ref={scrollAreaRef}
            onScrollCapture={handleScroll}
          >
            <div className="space-y-10 pb-6">
              {/* Clinical Disclosure Notice */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/90 dark:bg-amber-950/20 p-5 rounded-[2rem] border border-amber-100/50 dark:border-amber-800/20 flex items-start gap-4 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed shadow-sm"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-[9px]">Mandatory Clinical Notice</p>
                  <p className="font-medium opacity-90">Dr. Aura utilizes advanced LLM synthesis for guidance. For immediate medical needs, contact emergency services or your human physician.</p>
                </div>
              </motion.div>
              {messages.length <= 1 && !isLoading && (
                <div className="text-center py-6 px-4">
                  <div className="h-28 w-28 bg-gradient-to-tr from-sky-50 to-teal-50 dark:from-sky-900/20 dark:to-teal-900/20 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner border border-white/50 dark:border-white/5">
                    <Sparkles className="h-14 w-14 text-sky-500 animate-pulse" />
                  </div>
                  <h4 className="font-black text-2xl text-foreground mb-4 tracking-tight">How can I assist you?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-12 font-medium">
                    I've ingested your latest {patientId.slice(0, 4)} clinical telemetry. Select a path or ask a custom question.
                  </p>
                  <div className="flex flex-col gap-3">
                    {QUICK_ACTIONS.map((action, idx) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, type: 'spring' }}
                        onClick={() => handleSend(action.value)}
                        className="flex items-center gap-4 px-6 py-5 bg-white/60 dark:bg-muted/30 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 rounded-2xl text-[13px] font-bold transition-all border border-slate-100 dark:border-white/5 shadow-sm group active:scale-[0.98]"
                      >
                        <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                          <action.icon className="h-5 w-5 text-sky-600 group-hover:text-white" />
                        </div>
                        <span className="flex-1 text-left">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {messages.filter(m => m.role !== 'system').map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex w-full group", m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn("flex flex-col max-w-[88%]", m.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn(
                      "rounded-[2rem] px-6 py-5 text-[15px] leading-relaxed shadow-sm transition-colors",
                      m.role === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-muted/50 border border-slate-100 dark:border-white/5 text-foreground rounded-tl-none'
                    )}>
                      {m.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 px-2 text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.role === 'assistant' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.role === 'user' && <Check className="h-3 w-3 text-sky-500" />}
                    </div>
                  </div>
                </motion.div>
              ))}
              {streamingContent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="max-w-[88%] rounded-[2rem] rounded-tl-none px-6 py-5 text-[15px] leading-relaxed shadow-sm bg-white dark:bg-muted/50 border border-slate-100 dark:border-white/5 text-foreground">
                    {streamingContent}
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1.5 h-4 ml-1 bg-sky-500 align-middle" />
                  </div>
                </motion.div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-muted/30 rounded-[2rem] rounded-tl-none px-6 py-5 flex items-center gap-4 border border-dashed border-sky-300/30">
                    <div className="flex gap-1.5">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-2 w-2 rounded-full bg-sky-400" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="h-2 w-2 rounded-full bg-sky-500" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="h-2 w-2 rounded-full bg-sky-600" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest italic">Aura is reasoning...</span>
                  </div>
                </div>
              )}
              {isError && (
                <div className="flex justify-start">
                  <div className="bg-destructive/10 text-destructive rounded-[2rem] rounded-tl-none px-6 py-5 flex flex-col gap-4 border border-destructive/20 max-w-[88%] shadow-sm">
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <AlertCircle className="h-4 w-4" /> Node Failure
                    </div>
                    <p className="text-sm font-medium">The clinical intelligence node encountered an edge communication circuit break.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSend(messages[messages.length - 1]?.content)}
                      className="rounded-xl border-destructive/30 hover:bg-destructive hover:text-white font-bold"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" /> Retry Pulse
                    </Button>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4 shrink-0" />
            </div>
          </ScrollArea>
          {/* Input Area */}
          <div className="p-8 border-t bg-slate-50/50 dark:bg-muted/20 relative shrink-0">
            <div className="flex gap-4 relative z-10">
              <div className="relative flex-1 group">
                <Input
                  placeholder="Ask Aura anything about your chart..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="bg-white dark:bg-background rounded-2xl border-slate-200 dark:border-white/10 shadow-inner h-16 pl-6 pr-14 focus-visible:ring-4 focus-visible:ring-sky-500/20 transition-all text-base"
                  disabled={isLoading}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none group-focus-within:text-sky-500/60 transition-colors">
                  <MessageCircle className="h-6 w-6" />
                </div>
              </div>
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="bg-sky-600 hover:bg-sky-700 h-16 w-16 rounded-2xl shadow-lg shadow-sky-600/30 active:scale-90 transition-all shrink-0"
              >
                {isLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Send className="h-7 w-7" />}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 opacity-30 grayscale pointer-events-none">
               <ShieldCheck className="h-4 w-4 text-sky-600" />
               <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">Secure Clinical Isolate Session</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}