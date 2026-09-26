'use client';

import React from 'react';
import { ChatSessionSummary, StudentId, AuthSession, STUDENTS } from '@/lib/types';
import { Plus, MessageSquare, PanelLeftClose, LogOut, ShieldCheck, User } from 'lucide-react';

interface GeminiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent?: (student: StudentId) => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenParentDashboard: () => void;
  onLogout: () => void;
}

export function GeminiSidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  currentUser,
  currentStudent,
  onSelectStudent,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenParentDashboard,
  onLogout,
}: GeminiSidebarProps) {
  const isParent = currentUser.role === 'parent';
  const activeStudentProfile = STUDENTS[currentStudent];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72 sm:md:-ml-80'
        }`}
      >
        {/* Top Header & Close button */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm text-base">
              🦉
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                AI Tutor Socratico
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Spazio di {isParent ? 'supervisione' : activeStudentProfile.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chiudi menu"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini "+ Nuova chat" Action Pill */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm flex items-center gap-3 border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
              <Plus className="w-4 h-4" />
            </div>
            <span>Nuova chat</span>
          </button>
        </div>

        {/* Recent Chats Section (Gemini Style) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Chat recenti
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-10 px-3 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-lg">
                💬
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nessuna chat recente. Fai una domanda a Socrate per iniziare!
              </p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = sess.id === currentSessionId;
              const dateStr = sess.updatedAt
                ? new Date(sess.updatedAt).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                  })
                : '';

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-100 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isSelected
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    <span className="truncate flex-1" title={sess.title}>
                      {sess.title || 'Conversazione con Socrate'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Profile & Actions Section */}
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/50 space-y-2">
          {/* Student Selector if logged in as parent */}
          {isParent && onSelectStudent && (
            <div className="flex items-center justify-between p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-xl text-xs mb-1">
              <span className="text-[11px] text-slate-500 px-1 font-medium">Studente:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSelectStudent('alessio')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    currentStudent === 'alessio'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50'
                  }`}
                >
                  👦 Alessio
                </button>
                <button
                  type="button"
                  onClick={() => onSelectStudent('mattia')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    currentStudent === 'mattia'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300/50'
                  }`}
                >
                  🧒 Mattia
                </button>
              </div>
            </div>
          )}

          {/* User badge */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentUser.avatar}</span>
              <div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isParent ? 'Amministrazione' : 'Scuola Media'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Esci dal profilo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Area Genitori Link */}
          <button
            onClick={() => {
              onOpenParentDashboard();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Area Riservata Genitori
          </button>
        </div>
      </aside>
    </>
  );
}
