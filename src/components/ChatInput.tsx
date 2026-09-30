'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface ChatInputProps {
  onSendMessage: (text: string, images?: string[] | string) => void;
  disabled?: boolean;
  quickPrompts?: string[];
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  quickPrompts = [],
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_IMAGES = 6;

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedImages.length + files.length > MAX_IMAGES) {
      alert(`Puoi allegare al massimo ${MAX_IMAGES} immagini per messaggio.`);
      e.target.value = '';
      return;
    }

    setIsCompressing(true);

    try {
      const compressedList: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        // Comprimi e ottimizza client-side per evitare 413 su Vercel e ridurre i token a singolo tile (1024px)
        const compressed = await compressImage(file);
        compressedList.push(compressed);
      }

      setSelectedImages((prev) => {
        const combined = [...prev, ...compressedList];
        return combined.slice(0, MAX_IMAGES);
      });
    } catch (err) {
      console.error('Errore elaborazione immagini:', err);
      alert('Impossibile elaborare alcune foto. Riprova con un formato JPG o PNG.');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && selectedImages.length === 0) || disabled) return;

    onSendMessage(input.trim(), selectedImages.length > 0 ? selectedImages : undefined);
    setInput('');
    setSelectedImages([]);
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

        {/* Compressing indicator */}
        {isCompressing && (
          <div className="p-2 sm:p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-2xl border border-sky-400/40 flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="font-medium">Ottimizzazione foto in corso per una risposta rapida e nitida...</span>
          </div>
        )}

        {/* Selected images preview list */}
        {selectedImages.length > 0 && (
          <div className="p-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-sky-400/40 animate-in fade-in">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 px-0.5 scrollbar-thin">
              {selectedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative flex-shrink-0 group rounded-xl overflow-hidden border-2 border-sky-400/60 bg-white dark:bg-slate-900 shadow-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Foto ${idx + 1}`}
                    className="w-16 h-16 sm:w-18 sm:h-18 object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center font-bold py-0.5">
                    Foto {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-90 hover:opacity-100 transition-all cursor-pointer"
                    title={`Rimuovi foto ${idx + 1}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
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
            onChange={handleImageChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {/* Upload photo button */}
          <button
            type="button"
            disabled={disabled || isCompressing}
            onClick={() => fileInputRef.current?.click()}
            title="Carica foto del quaderno o del libro (puoi selezionarne più di una)"
            className="relative w-10 h-10 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0 touch-manipulation disabled:opacity-50"
          >
            {isCompressing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-sky-600 dark:text-sky-400" />
            ) : (
              <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {!isCompressing && selectedImages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {selectedImages.length}
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
              disabled={disabled || isCompressing}
              rows={1}
              placeholder={
                isCompressing
                  ? 'Ottimizzazione immagini in corso...'
                  : selectedImages.length > 0
                  ? `Fai una domanda sulle ${selectedImages.length} foto o premi Invio...`
                  : 'Scrivi qui il tuo dubbio o esercizio...'
              }
              className="w-full bg-transparent px-3 py-2 sm:px-3.5 sm:py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none leading-normal"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || isCompressing || (!input.trim() && selectedImages.length === 0)}
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
