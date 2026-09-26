'use client';

import React, { useState } from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, ChatSessionSummary, QuizTestRecord } from '@/lib/types';
import { Plus, MessageSquare, PanelLeftClose, Award, ChevronRight } from 'lucide-react';

interface SubjectRoomsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: SubjectId | null;
  onSelectSubject: (subject: SubjectId) => void;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onOpenQuiz: () => void;
  onOpenTestHistory: () => void;
  onSelectQuizDetail?: (quiz: QuizTestRecord) => void;
  currentStudent: StudentId;
  quizzes?: QuizTestRecord[];
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
  onOpenQuiz,
  onOpenTestHistory,
  onSelectQuizDetail,
  currentStudent,
  quizzes = [],
}: SubjectRoomsSidebarProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'quizzes'>('chats');

  const activeStudentProfile = STUDENTS[currentStudent];
  const subjectList = Object.values(SUBJECTS);

  // Filter sessions for current subject if a subject is selected
  const visibleSessions = currentSubject
    ? sessions.filter((s) => s.subject === currentSubject || !s.subject)
    : sessions;

  // Filter quizzes for current student (and current subject if selected)
  const studentQuizzes = quizzes.filter((q) => q.studentId === currentStudent);
  const visibleQuizzes = currentSubject
    ? studentQuizzes.filter((q) => q.subject === currentSubject)
    : studentQuizzes;

  return (
    <>
      {/* Mobile Backdrop */}
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
        {/* Top Header - Semplice, pulito */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs text-base">
              🦉
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                Stanze di Studio
              </h2>
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
              Materie
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

          {/* SECTION 2: ATTIVITÀ (Tabs tra Chat e Storico Test) */}
          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            {/* Tab Switcher */}
            <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'chats'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
                {visibleSessions.length > 0 && (
                  <span className="text-[10px] opacity-75">({visibleSessions.length})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quizzes')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'quizzes'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Verifiche</span>
                {visibleQuizzes.length > 0 && (
                  <span className="text-[10px] opacity-75">({visibleQuizzes.length})</span>
                )}
              </button>
            </div>

            {/* TAB CONTENT: CHATS */}
            {activeTab === 'chats' && (
              <div className="space-y-1">
                {/* Singolo pulsante "Nuova chat" se in una stanza */}
                {currentSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      onNewSession();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center gap-2 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer mb-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuova chat</span>
                  </button>
                )}

                {visibleSessions.length === 0 ? (
                  <div className="text-center py-6 px-3">
                    <p className="text-xs text-slate-400">
                      Nessuna conversazione ancora salvata.
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
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-100 font-medium'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{sess.title}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB CONTENT: QUIZZES (STORICO TEST) */}
            {activeTab === 'quizzes' && (
              <div className="space-y-1.5">
                {/* Pulsante 1: Vedi tutti i test completati */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenTestHistory();
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer mb-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Vedi tutti i test completati</span>
                </button>

                {/* Pulsante 2: Avvia verifica nella materia attiva */}
                {currentSubject && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuiz();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer mb-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Avvia verifica in {SUBJECTS[currentSubject].name.split(' ')[0]}</span>
                  </button>
                )}

                {visibleQuizzes.length === 0 ? (
                  <div className="text-center py-6 px-3">
                    <p className="text-xs text-slate-400">
                      Nessun test ancora svolto.
                    </p>
                  </div>
                ) : (
                  visibleQuizzes.slice(0, 15).map((quiz) => (
                    <div
                      key={quiz.id}
                      onClick={() => {
                        if (onSelectQuizDetail) {
                          onSelectQuizDetail(quiz);
                        } else {
                          onOpenTestHistory();
                        }
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-800 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>{SUBJECTS[quiz.subject as SubjectId]?.emoji}</span>
                          <span className="truncate">{quiz.topic}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {new Date(quiz.completedAt).toLocaleDateString([], {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                            quiz.grade >= 8
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : quiz.grade >= 6
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {quiz.grade}/10
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
