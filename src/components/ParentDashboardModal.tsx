'use client';

import React, { useState, useEffect } from 'react';
import { StudentId, STUDENTS, SUBJECTS, SubjectId } from '@/lib/types';
import { X, ShieldCheck, Users, BarChart3, MessageSquare, BookOpen, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { MathMarkdown } from './MathMarkdown';

interface ParentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyPin: string;
}

export function ParentDashboardModal({
  isOpen,
  onClose,
  familyPin,
}: ParentDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'sessions'>('stats');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<'all' | 'alessio' | 'mattia'>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [viewingSession, setViewingSession] = useState<any | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parent/analytics', {
        headers: { 'x-family-pin': familyPin },
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setAnalytics(data.stats);
      }
    } catch (e) {
      console.error('Failed to load parent analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { 'x-family-pin': familyPin },
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setViewingSession(data.session);
      }
    } catch (e) {
      console.error('Failed to load session details:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  if (!isOpen) return null;

  const filteredSessions = analytics?.allSessions?.filter((s: any) => {
    if (selectedStudentFilter === 'all') return true;
    return s.studentId === selectedStudentFilter;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Area Riservata Genitori
              </h2>
              <p className="text-xs text-slate-500">
                Monitoraggio dello studio e delle attività con Socrate per Alessio e Mattia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {!viewingSession && (
          <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'stats'
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Panoramica & Attività
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sessions'
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Rileggi le Chat dei Compiti
              </button>
            </div>

            {/* Student Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setSelectedStudentFilter('all')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedStudentFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold' : 'text-slate-500'
                }`}
              >
                Tutti
              </button>
              <button
                onClick={() => setSelectedStudentFilter('alessio')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedStudentFilter === 'alessio' ? 'bg-white dark:bg-slate-900 text-sky-600 font-semibold shadow-2xs' : 'text-slate-500'
                }`}
              >
                👦 Alessio
              </button>
              <button
                onClick={() => setSelectedStudentFilter('mattia')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedStudentFilter === 'mattia' ? 'bg-white dark:bg-slate-900 text-indigo-600 font-semibold shadow-2xs' : 'text-slate-500'
                }`}
              >
                🧒 Mattia
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {viewingSession ? (
            /* Single Session Transcript Viewer for Parent */
            <div className="space-y-4">
              <button
                onClick={() => setViewingSession(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Torna all&apos;elenco sessioni
              </button>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewingSession.studentName}</span>
                    <span>•</span>
                    <span>{SUBJECTS[viewingSession.subject as SubjectId]?.name || viewingSession.subject}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-0.5">
                    {viewingSession.title}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(viewingSession.updatedAt).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Transcript list */}
              <div className="space-y-3 pt-2">
                {viewingSession.messages?.map((msg: any, idx: number) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 ml-4'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1 text-slate-600 dark:text-slate-300">
                        {isAssistant ? '🦉 Socrate (Tutor):' : `👤 ${viewingSession.studentName}:`}
                      </div>
                      <MathMarkdown content={msg.content} />
                      {msg.imageUrl && (
                        <div className="mt-2 text-xs text-sky-600">
                          📷 [Foto del compito allegata dal ragazzo]
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'stats' ? (
            /* Stats Tab */
            <div className="space-y-5">
              {/* Student Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Alessio Card */}
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">👦</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-200/60 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                      Alessio
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Sessioni</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics?.alessio?.totalSessions || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Messaggi</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics?.alessio?.totalMessages || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mattia Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">🧒</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                      Mattia
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Sessioni</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics?.mattia?.totalSessions || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Messaggi</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {analytics?.mattia?.totalMessages || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Note for Parents */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  💡 Come leggere l&apos;attività dei tuoi figli
                </h4>
                <p className="leading-relaxed">
                  Socrate registra ogni interazione nel tuo database Firebase sicuro. Puoi usare la scheda{' '}
                  <strong>&quot;Rileggi le Chat dei Compiti&quot;</strong> per verificare se i tuoi figli hanno compreso gli argomenti 
                  o se ci sono materie (es. frazioni, analisi logica o verbi inglesi) in cui hanno mostrato più dubbi.
                </p>
              </div>
            </div>
          ) : (
            /* Sessions Tab (Chat History Inspector) */
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                  Nessuna sessione trovata per questo filtro.
                </div>
              ) : (
                filteredSessions.map((sess: any) => {
                  const subjMeta = SUBJECTS[sess.subject as SubjectId] || SUBJECTS.matematica;
                  const dateStr = new Date(sess.updatedAt).toLocaleDateString([], {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => loadSessionDetails(sess.id)}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {sess.studentName === 'Alessio' ? '👦 Alessio' : '🧒 Mattia'}
                          </span>
                          <span>•</span>
                          <span>{subjMeta.emoji} {subjMeta.name}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-400">{dateStr}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {sess.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                        <span>Rileggi</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
