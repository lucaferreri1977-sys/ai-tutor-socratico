'use client';

import React, { useState } from 'react';
import { MathMarkdown } from './MathMarkdown';
import { Bot, User, Copy, Check, ZoomIn, X, FileText, ExternalLink } from 'lucide-react';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  fileNames?: string[];
  timestamp?: string;
}

interface ChatMessageProps {
  message: MessageData;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const rawAttachments = (message.imageUrls && message.imageUrls.length > 0)
    ? message.imageUrls
    : (message.imageUrl ? [message.imageUrl] : []);

  const imageAttachments = rawAttachments
    .map((url, idx) => ({
      url,
      name: message.fileNames?.[idx] || `Foto ${idx + 1}`,
      isPdf: url.startsWith('data:application/pdf'),
      idx,
    }))
    .filter((item) => !item.isPdf);

  const pdfAttachments = rawAttachments
    .map((url, idx) => ({
      url,
      name: message.fileNames?.[idx] || `Documento_${idx + 1}.pdf`,
      isPdf: url.startsWith('data:application/pdf'),
      idx,
    }))
    .filter((item) => item.isPdf);

  const handleOpenPdf = (dataUrl: string, fileName: string) => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Fallback se il popup blocker blocca window.open
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      window.open(dataUrl, '_blank');
    }
  };

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
                {isAssistant ? 'Socrate' : 'Tu'}
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

          {/* Attached files & images */}
          {(imageAttachments.length > 0 || pdfAttachments.length > 0) && (
            <div className="my-2.5 space-y-2">
              {/* PDF Documents */}
              {pdfAttachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {pdfAttachments.length} {pdfAttachments.length === 1 ? 'documento PDF allegato:' : 'documenti PDF allegati:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pdfAttachments.map((pdf, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => handleOpenPdf(pdf.url, pdf.name)}
                        className="group flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer"
                        title={`Apri ${pdf.name}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                              {pdf.name}
                            </p>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                              Documento PDF
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors flex-shrink-0"
                          title="Visualizza documento"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {imageAttachments.length > 0 && (
                imageAttachments.length === 1 ? (
                  <div
                    onClick={() => setZoomedImageUrl(imageAttachments[0].url)}
                    className="relative inline-block group cursor-pointer rounded-2xl overflow-hidden border-2 border-sky-400/40 shadow-sm hover:shadow-md transition-all max-w-xs sm:max-w-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageAttachments[0].url}
                      alt={imageAttachments[0].name}
                      className="max-h-60 w-auto object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity gap-1">
                      <ZoomIn className="w-4 h-4" /> Clicca per ingrandire
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {imageAttachments.length} foto allegate:
                    </span>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {imageAttachments.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setZoomedImageUrl(img.url)}
                          className="relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border-2 border-sky-400/40 shadow-xs hover:shadow-md transition-all w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] sm:text-[10px] font-bold">
                            Foto {idx + 1}
                          </span>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
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
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImageUrl}
              alt="Foto compito ingrandita"
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
