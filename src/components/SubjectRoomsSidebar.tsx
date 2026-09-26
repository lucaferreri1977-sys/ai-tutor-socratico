'use client';

import React from 'react';
import { SubjectId, SUBJECTS, StudentId, AuthSession, STUDENTS, ChatSessionSummary } from '@/lib/types';
import { Plus, Trash2, MessageSquare, PanelLeftClose, LogOut, ShieldCheck, Award, Sparkles, BookOpen } from 'lucide-react';

interface SubjectRoomsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: SubjectId | null;
  onSelectSubject: (subject: SubjectId) => void;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenQuiz: () => void;
  currentUser: AuthSession;
  currentStudent: StudentId;
  onSelectStudent?: (student: StudentId) => void;
  onOpenParentDashboard: () => void;
  onLogout: () => void;
}

export function SubjectRoomsSidebar({
  isOpen,
  onClose,
  currentSubject,
  onSelectSubject,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenQuiz,
  currentUser,
  currentStudent,
  onSelectStudent,
  onOpenParentDashboard,
  onLogout,
}: SubjectRoomsSidebarProps) {
  const isParent = currentUser.role === 'parent';
  const activeStudentProfile = STUDENTS[currentStudent];
  const subjectList = Object.values(SUBJECTS);

  // Filter sessions for current subject if a subject is selected
  const visibleSessions = currentSubject
    ? sessions.filter((s) => s.subject === currentSubject || !s.subject)
    : sessions;

  return (
    <>
      {/* Mobile Backdrop (when open on smartphone) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72 sm:md:-ml-80'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base">
              🦉
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                AI Tutor Socratico
              </h2>
              <p className="text-[11px] text-slate-500">
                Stanze di studio &bull; {activeStudentProfile.name}
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

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* SECTION 1: STANZE DELLE MATERIE */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Stanze delle Materie
            </div>

            <div className="space-y-0.5">
              {subjectList.map((subj) => {
                const isSelected = currentSubject === subj.id;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => {
                      onSelectSubject(subj.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base select-none">{subj.emoji}</span>
                      <span className="truncate">{subj.name}</span>
                    </div>

                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: TEST DI APPRENDIMENTO (NotebookLM Style) */}
          {currentSubject && (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2">
              <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-xs">
                <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Test di Apprendimento</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Mettiti alla prova su {SUBJECTS[currentSubject].name}: quiz interattivo di 5 domande con votazione finale!
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenQuiz();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Avvia Test con Voto
              </button>
            </div>
          )}

          {/* SECTION 3: CHAT RECENTI NELLA STANZA */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {currentSubject ? `Chat in ${SUBJECTS[currentSubject].name}` : 'Tutte le Chat Recenti'}
              </span>
              {currentSubject && (
                <button
                  type="button"
                  onClick={() => {
                    onNewSession();
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  title="Nuova chat"
                >
                  <Plus className="w-3 h-3" /> Nuova
                </button>
              )}
            </div>

            {visibleSessions.length === 0 ? (
              <div className="text-center py-6 px-3">
                <p className="text-xs text-slate-400">
                  Nessuna conversazione ancora salvata qui.
                </p>
              </div>
            ) : (
              visibleSessions.slice(0, 15).map((sess) => {
                const isSelected = sess.id === currentSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-100 font-medium'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
                      <span className="truncate">{sess.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Vuoi eliminare questa chat dalla cronologia?')) {
                          onDeleteSession(sess.id);
                        }
                      }}
                      className="hidden group-hover:flex p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Elimina chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Profile & Admin Section */}
        <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 space-y-2">
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

          {/* User profile */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentUser.avatar}</span>
              <div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isParent ? 'Supervisione' : 'Scuola Media'}
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

          {/* Area Genitori */}
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
