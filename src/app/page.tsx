'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectId, SUBJECTS } from '@/lib/types';
import { SubjectSelector } from '@/components/SubjectSelector';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage, MessageData } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SubjectWelcome } from '@/components/SubjectWelcome';
import { ParentModal } from '@/components/ParentModal';
import { fireCelebrationConfetti, shouldCelebrate } from '@/lib/confetti';
import { AlertCircle, Key } from 'lucide-react';

export default function Home() {
  const [currentSubject, setCurrentSubject] = useState<SubjectId>('matematica');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSelectSubject = (newSubject: SubjectId) => {
    if (newSubject === currentSubject) return;
    setCurrentSubject(newSubject);
    // Reset conversation for new subject
    setMessages([]);
    setApiError(null);
  };

  const handleResetChat = () => {
    if (messages.length > 0 && !confirm('Vuoi davvero ricominciare la conversazione su questa materia?')) {
      return;
    }
    setMessages([]);
    setApiError(null);
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if ((!text.trim() && !imageBase64) || isStreaming) return;

    setApiError(null);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: MessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      imageUrl: imageBase64,
      timestamp: timeString,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);

    // Placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    const assistantPlaceholder: MessageData = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: timeString,
    };

    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          subject: currentSubject,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Errore del server (${response.status}) durante la richiesta.`
        );
      }

      if (!response.body) {
        throw new Error('Il server non ha restituito uno stream di dati.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }

      // Check if student achieved success and trigger celebration!
      if (shouldCelebrate(accumulatedText)) {
        fireCelebrationConfetti();
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : 'Errore di connessione.';
      setApiError(errMsg);
      // Remove empty assistant placeholder if failed
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId || msg.content !== ''));
    } finally {
      setIsStreaming(false);
    }
  };

  const activeSubjectMeta = SUBJECTS[currentSubject];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/60 dark:bg-slate-950">
      {/* Top Header */}
      <ChatHeader
        currentSubject={activeSubjectMeta}
        onResetChat={handleResetChat}
        onOpenParentModal={() => setIsParentModalOpen(true)}
        disabled={isStreaming}
      />

      {/* Horizontal Subject Bar */}
      <SubjectSelector
        currentSubject={currentSubject}
        onSelectSubject={handleSelectSubject}
        disabled={isStreaming}
      />

      {/* Error alert banner if API key is missing */}
      {apiError && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 px-4 py-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => setIsParentModalOpen(true)}
            className="text-xs font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <Key className="w-3.5 h-3.5" /> Come configurare la chiave
          </button>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto flex flex-col justify-between">
        <div className="flex-1">
          {messages.length === 0 ? (
            <SubjectWelcome
              subject={activeSubjectMeta}
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <div className="py-4 space-y-1">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && message.role === 'assistant' && !message.content}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Fixed Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isStreaming}
        quickPrompts={activeSubjectMeta.quickPrompts}
      />

      {/* Parent Guidance Modal */}
      <ParentModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
      />
    </div>
  );
}
