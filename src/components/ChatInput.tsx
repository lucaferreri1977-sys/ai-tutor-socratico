'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, imageBase64?: string) => void;
  disabled?: boolean;
  quickPrompts?: string[];
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  quickPrompts = [],
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 6MB)
    if (file.size > 6 * 1024 * 1024) {
      alert('L\'immagine è troppo pesante. Scegli una foto inferiore a 6MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be reselected
    e.target.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedImage) || disabled) return;

    onSendMessage(input.trim(), selectedImage || undefined);
    setInput('');
    setSelectedImage(null);
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
    <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2.5">

        {/* Selected image preview */}
        {selectedImage && (
          <div className="relative inline-flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-sky-400/40 animate-in fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Anteprima foto"
              className="w-14 h-14 object-cover rounded-lg"
            />
            <div className="text-xs text-slate-600 dark:text-slate-300 pr-6">
              <span className="font-semibold block text-sky-600 dark:text-sky-400">Foto allegata</span>
              <span>Socrate leggerà il compito da qui</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-1.5 right-1.5 p-1 bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 rounded-full transition-colors cursor-pointer"
              title="Rimuovi foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Upload photo button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            title="Carica foto del quaderno o del libro"
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text input area */}
          <div className="flex-1 relative rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              placeholder={
                selectedImage
                  ? 'Fai una domanda specifica sulla foto o premi Invio...'
                  : 'Scrivi qui il tuo dubbio o incolla l’esercizio...'
              }
              className="w-full bg-transparent px-3.5 py-2.5 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={disabled || (!input.trim() && !selectedImage)}
            className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 disabled:hover:bg-sky-600 shadow-md shadow-sky-600/20 transition-all cursor-pointer flex-shrink-0 flex items-center justify-center"
            title="Invia messaggio"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
