'use client';

import React from 'react';
import { ChatSessionSummary, StudentId, SUBJECTS, SubjectId } from '@/lib/types';
import { X, Plus, Trash2, Clock, BookOpen, MessageSquare } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  studentName: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  studentName,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              Cronologia di {studentName}
            </h2>
            <p className="text-xs text-slate-500">I compiti e le conversazioni salvate con Socrate</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuovo Compito / Argomento
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 mx-auto flex items-center justify-center text-xl">
                📚
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Non ci sono ancora sessioni salvate per {studentName}.
              </p>
            </div>
          ) : (
            sessions.map((sess) => {
              const subjMeta = SUBJECTS[sess.subject as SubjectId] || SUBJECTS.matematica;
              const isSelected = sess.id === currentSessionId;
              const dateStr = sess.updatedAt ? new Date(sess.updatedAt).toLocaleDateString([], {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }) : '';

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400/80 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="text-sm">{subjMeta.emoji}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{subjMeta.name}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">{dateStr}</span>
                    </div>

                    <h3 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {sess.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {sess.messageCount} messaggi
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Vuoi davvero cancellare questa sessione?')) {
                        onDeleteSession(sess.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-opacity hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                    title="Elimina sessione"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
