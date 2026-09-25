'use client';

import React, { useState } from 'react';
import { MathMarkdown } from './MathMarkdown';
import { Bot, User, Copy, Check, ZoomIn, X } from 'lucide-react';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp?: string;
}

interface ChatMessageProps {
  message: MessageData;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className={`flex w-full gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 transition-all ${
          isAssistant
            ? 'bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800/60'
            : 'bg-transparent'
        }`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 text-lg">
              🦉
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {isAssistant ? 'Socrate (Tutor)' : 'Tu'}
              </span>
              {message.timestamp && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {message.timestamp}
                </span>
              )}
            </div>

            {isAssistant && message.content && (
              <button
                onClick={handleCopy}
                title="Copia risposta"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Attached image if any */}
          {message.imageUrl && (
            <div className="my-2">
              <div
                onClick={() => setIsImageModalOpen(true)}
                className="relative inline-block group cursor-pointer rounded-xl overflow-hidden border-2 border-sky-400/40 shadow-sm hover:shadow-md transition-all max-w-xs sm:max-w-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.imageUrl}
                  alt="Foto esercizio caricata"
                  className="max-h-60 w-auto object-cover group-hover:scale-102 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity gap-1">
                  <ZoomIn className="w-4 h-4" /> Clicca per ingrandire
                </div>
              </div>
            </div>
          )}

          {/* Message text with KaTeX & Markdown */}
          {message.content ? (
            <MathMarkdown content={message.content} />
          ) : isStreaming ? (
            <div className="flex items-center gap-1.5 py-1 text-sky-600 dark:text-sky-400 text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
              <span className="ml-1 text-xs text-slate-400">Socrate sta riflettendo...</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal zoom foto */}
      {isImageModalOpen && message.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt="Foto compito ingrandita"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
