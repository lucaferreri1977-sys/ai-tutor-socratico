'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, Paperclip, Trash2, Loader2, FileText } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

export interface AttachedFile {
  url: string;
  name: string;
  type: 'image' | 'pdf';
}

interface ChatInputProps {
  onSendMessage: (text: string, files?: string[] | string, fileNames?: string[]) => void;
  disabled?: boolean;
  quickPrompts?: string[];
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  quickPrompts = [],
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_FILES = 6;

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (attachedFiles.length + files.length > MAX_FILES) {
      alert(`Puoi allegare al massimo ${MAX_FILES} file per messaggio.`);
      e.target.value = '';
      return;
    }

    setIsProcessing(true);

    try {
      const processedList: AttachedFile[] = [];
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          // Comprimi e ottimizza client-side per evitare 413 su Vercel e ridurre i token a singolo tile (1024px)
          const compressed = await compressImage(file);
          processedList.push({
            url: compressed,
            name: file.name,
            type: 'image',
          });
        } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Limite 4MB per rimanere ampiamente dentro il payload serverless di Vercel (4.5MB)
          if (file.size > 4 * 1024 * 1024) {
            alert(`Il file PDF "${file.name}" supera i 4MB. Allega un PDF più leggero o seleziona solo le pagine del capitolo.`);
            continue;
          }

          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });

          processedList.push({
            url: dataUrl,
            name: file.name,
            type: 'pdf',
          });
        } else {
          alert(`Il formato del file "${file.name}" non è supportato. Puoi caricare immagini (JPG, PNG) o documenti PDF.`);
        }
      }

      setAttachedFiles((prev) => {
        const combined = [...prev, ...processedList];
        return combined.slice(0, MAX_FILES);
      });
    } catch (err) {
      console.error('Errore elaborazione allegati:', err);
      alert('Impossibile elaborare alcuni file. Riprova con un formato JPG, PNG o PDF.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || disabled) return;

    const urls = attachedFiles.map((f) => f.url);
    const names = attachedFiles.map((f) => f.name);

    onSendMessage(
      input.trim(),
      urls.length > 0 ? urls : undefined,
      names.length > 0 ? names : undefined
    );
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 sm:p-4 flex-shrink-0"
      style={{
        paddingBottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <div className="max-w-4xl mx-auto space-y-2">

        {/* Processing indicator */}
        {isProcessing && (
          <div className="p-2 sm:p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-2xl border border-sky-400/40 flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="font-medium">Elaborazione e ottimizzazione file in corso...</span>
          </div>
        )}

        {/* Selected files preview list */}
        {attachedFiles.length > 0 && (
          <div className="p-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-sky-400/40 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5 scrollbar-thin">
              {attachedFiles.map((file, idx) => (
                file.type === 'pdf' ? (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 group rounded-xl border-2 border-rose-400/70 bg-white dark:bg-slate-900 p-2 shadow-xs flex flex-col justify-between w-28 h-18 sm:w-32 sm:h-20"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-4">
                      <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[9px] font-bold self-start">
                      PDF
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-90 hover:opacity-100 transition-all cursor-pointer"
                      title={`Rimuovi ${file.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="relative flex-shrink-0 group rounded-xl overflow-hidden border-2 border-sky-400/60 bg-white dark:bg-slate-900 shadow-xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.name || `Foto ${idx + 1}`}
                      className="w-16 h-16 sm:w-18 sm:h-18 object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center font-bold py-0.5">
                      Foto {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-90 hover:opacity-100 transition-all cursor-pointer"
                      title={`Rimuovi foto ${idx + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Main input form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            multiple
            className="hidden"
          />

          {/* Upload photo or PDF button */}
          <button
            type="button"
            disabled={disabled || isProcessing}
            onClick={() => fileInputRef.current?.click()}
            title="Carica foto o documenti PDF (puoi selezionarne più di uno)"
            className="relative w-10 h-10 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0 touch-manipulation disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-sky-600 dark:text-sky-400" />
            ) : (
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {!isProcessing && attachedFiles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {attachedFiles.length}
              </span>
            )}
          </button>

          {/* Text input area */}
          <div className="flex-1 min-h-[40px] sm:min-h-[46px] relative rounded-xl sm:rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all flex items-center overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isProcessing}
              rows={1}
              placeholder={
                isProcessing
                  ? 'Elaborazione file in corso...'
                  : attachedFiles.length > 0
                  ? `Fai una domanda sui ${attachedFiles.length} file allegati o premi Invio...`
                  : 'Scrivi qui il tuo dubbio o esercizio...'
              }
              className="w-full bg-transparent px-3 py-2 sm:px-3.5 sm:py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none leading-normal"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || isProcessing || (!input.trim() && attachedFiles.length === 0)}
            className="w-10 h-10 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 disabled:hover:bg-sky-600 shadow-md shadow-sky-600/20 transition-all cursor-pointer flex-shrink-0 flex items-center justify-center touch-manipulation"
            title="Invia messaggio"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
