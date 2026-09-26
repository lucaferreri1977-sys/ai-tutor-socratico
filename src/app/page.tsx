'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, ChatSessionSummary, AuthSession, QuizTestRecord } from '@/lib/types';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage, MessageData } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SubjectRoomsSidebar } from '@/components/SubjectRoomsSidebar';
import { InitialWelcomeScreen } from '@/components/InitialWelcomeScreen';
import { QuizModal } from '@/components/QuizModal';
import { TestHistoryModal } from '@/components/TestHistoryModal';
import { ParentDashboardModal } from '@/components/ParentDashboardModal';
import { LoginScreen } from '@/components/LoginScreen';
import { fireCelebrationConfetti, shouldCelebrate } from '@/lib/confetti';
import { AlertCircle, Award, Sparkles } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Student State (Alessio vs Mattia)
  const [currentStudent, setCurrentStudent] = useState<StudentId>('alessio');

  // Fixed Subject Room (null initially to show the welcome prompt screen!)
  const [currentSubject, setCurrentSubject] = useState<SubjectId | null>(null);

  // Active Chat Session
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isTestHistoryOpen, setIsTestHistoryOpen] = useState(false);
  const [isParentDashboardOpen, setIsParentDashboardOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Saved sessions and quizzes for active student
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [quizzes, setQuizzes] = useState<QuizTestRecord[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Set initial sidebar state based on screen width on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Check saved session on mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem('socrate_auth_session');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth) as AuthSession;
        if (parsed && parsed.role && parsed.token) {
          setCurrentUser(parsed);
          if (parsed.role === 'alessio' || parsed.role === 'mattia') {
            setCurrentStudent(parsed.role);
          }
        }
      }
    } catch {
      // LocalStorage fallback
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Fetch student sessions from Firestore
  const fetchStudentSessions = useCallback(async (student: StudentId, token: string) => {
    try {
      const res = await fetch(`/api/sessions?studentId=${student}`, {
        headers: { 'x-user-auth': token, 'x-family-pin': token },
      });
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  }, []);

  // Fetch student quizzes from Firestore
  const fetchStudentQuizzes = useCallback(async (student: StudentId, token: string) => {
    try {
      const res = await fetch(`/api/quiz?studentId=${student}`, {
        headers: { 'x-user-auth': token, 'x-family-pin': token },
      });
      const data = await res.json();
      if (res.ok && data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (e) {
      console.error('Error fetching quizzes:', e);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStudentSessions(currentStudent, currentUser.token);
      fetchStudentQuizzes(currentStudent, currentUser.token);
    }
  }, [currentUser, currentStudent, fetchStudentSessions, fetchStudentQuizzes]);

  // Login handler
  const handleLoginSuccess = (session: AuthSession) => {
    setCurrentUser(session);
    if (session.role === 'alessio' || session.role === 'mattia') {
      setCurrentStudent(session.role);
    }
    if (session.role === 'parent') {
      setIsParentDashboardOpen(true);
    }
  };

  // Logout / Switch User
  const handleLogout = () => {
    try {
      localStorage.removeItem('socrate_auth_session');
    } catch {}
    setCurrentUser(null);
    setCurrentSubject(null);
    setCurrentSessionId(null);
    setMessages([]);
    setSessions([]);
    setQuizzes([]);
    setIsParentDashboardOpen(false);
    setIsTestHistoryOpen(false);
    setIsQuizModalOpen(false);
  };

  // Switch student
  const handleSelectStudent = (studentId: StudentId) => {
    if (studentId === currentStudent) return;
    setCurrentStudent(studentId);
    setCurrentSubject(null);
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Select Subject Room
  const handleSelectSubject = (subjectId: SubjectId) => {
    setCurrentSubject(subjectId);
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Reset / New Chat in current room
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Load a session from history
  const handleLoadSession = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { 'x-user-auth': currentUser.token, 'x-family-pin': currentUser.token },
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setCurrentSessionId(data.session.id);
        if (data.session.subject && SUBJECTS[data.session.subject as SubjectId]) {
          setCurrentSubject(data.session.subject as SubjectId);
        }
        setMessages(data.session.messages || []);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  };

  // Real-time quiz completion callback
  const handleQuizCompleted = (newRecord: QuizTestRecord) => {
    setQuizzes((prev) => [newRecord, ...prev]);
  };

  // Save session to Firebase Firestore
  const saveSessionToCloud = async (sessionIdToSave: string, updatedMessages: MessageData[]) => {
    if (!currentUser || updatedMessages.length === 0 || !currentSubject) return;
    try {
      const activeStudent = STUDENTS[currentStudent];
      await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': currentUser.token,
          'x-family-pin': currentUser.token,
        },
        body: JSON.stringify({
          id: sessionIdToSave,
          studentId: currentStudent,
          studentName: activeStudent.name,
          subject: currentSubject,
          messages: updatedMessages,
        }),
      });

      fetchStudentSessions(currentStudent, currentUser.token);
    } catch (e) {
      console.error('Failed to persist session to Firebase:', e);
    }
  };

  // Send message
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if ((!text.trim() && !imageBase64) || isStreaming || !currentUser || !currentSubject) return;

    setApiError(null);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeStudentProfile = STUDENTS[currentStudent];

    const userMessage: MessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      imageUrl: imageBase64,
      timestamp: timeString,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);

    // Placeholder assistant message
    const assistantId = `assistant-${Date.now()}`;
    const assistantPlaceholder: MessageData = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: timeString,
    };

    setMessages([...newMessages, assistantPlaceholder]);

    // Ensure session ID exists
    const activeSessionId = currentSessionId || `session-${Date.now()}`;
    if (!currentSessionId) {
      setCurrentSessionId(activeSessionId);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': currentUser.token,
          'x-family-pin': currentUser.token,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          subject: currentSubject,
          studentName: activeStudentProfile.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Errore del server (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Nessun flusso di risposta ricevuto dal server.');
      }

      // Stream handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
          )
        );
      }

      const completedMessages: MessageData[] = [
        ...newMessages,
        {
          id: assistantId,
          role: 'assistant',
          content: accumulatedText,
          timestamp: timeString,
        },
      ];

      // Save to Firebase Firestore in real-time
      saveSessionToCloud(activeSessionId, completedMessages);

      // Trigger celebration if student succeeded
      if (shouldCelebrate(accumulatedText)) {
        fireCelebrationConfetti();
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : 'Errore di connessione.';
      setApiError(errMsg);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantId || msg.content !== ''));
    } finally {
      setIsStreaming(false);
    }
  };

  // Auth checking loader
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 flex items-center justify-center text-2xl animate-pulse">
          🦉
        </div>
      </div>
    );
  }

  // If not logged in, show LoginScreen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const activeStudentProfile = STUDENTS[currentStudent];
  const activeSubjectMeta = currentSubject ? SUBJECTS[currentSubject] : null;
  const studentQuizzes = quizzes.filter((q) => q.studentId === currentStudent);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/60 dark:bg-slate-950">
      {/* Sidebar con Stanze delle Materie fisse e Cronologia senza eliminazione */}
      <SubjectRoomsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentSubject={currentSubject}
        onSelectSubject={handleSelectSubject}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleLoadSession}
        onNewSession={handleNewSession}
        onOpenQuiz={() => setIsQuizModalOpen(true)}
        onOpenTestHistory={() => setIsTestHistoryOpen(true)}
        currentStudent={currentStudent}
        quizzes={quizzes}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <ChatHeader
          currentSubject={currentSubject}
          currentUser={currentUser}
          currentStudent={currentStudent}
          onSelectStudent={handleSelectStudent}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenQuiz={() => setIsQuizModalOpen(true)}
          onOpenTestHistory={() => setIsTestHistoryOpen(true)}
          onLogout={handleLogout}
          disabled={isStreaming}
          testCount={studentQuizzes.length}
        />

        {/* Error Alert Banner */}
        {apiError && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{apiError}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 flex flex-col justify-between">
          <div className="flex-1 max-w-4xl w-full mx-auto">
            {/* 1. SE NESSUNA STANZA È SELEZIONATA: Schermata Iniziale di Benvenuto */}
            {!currentSubject || !activeSubjectMeta ? (
              <InitialWelcomeScreen
                studentName={activeStudentProfile.name}
                onSelectSubject={handleSelectSubject}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />
            ) : messages.length === 0 ? (
              /* 2. SE DENTRO UNA STANZA MA NESSUN MESSAGGIO: Schermata pulita senza doppioni */
              <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-4 py-8 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center text-3xl mx-auto shadow-xs select-none">
                    {activeSubjectMeta.emoji}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      {activeSubjectMeta.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      {activeSubjectMeta.description}
                    </p>
                  </div>
                </div>

                {/* Pulsanti Rapidi Azione: Nuova Verifica e Storico */}
                <div className="flex items-center justify-center gap-2.5 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(true)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Nuova Verifica con Voto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTestHistoryOpen(true)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Storico Test</span>
                  </button>
                </div>

                {/* Quick Subject Prompts */}
                <div className="w-full max-w-md space-y-2 text-left pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Chiedi aiuto a Socrate su:
                  </span>
                  <div className="space-y-1.5">
                    {activeSubjectMeta.quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800 text-left text-xs text-slate-700 dark:text-slate-300 transition-all cursor-pointer truncate"
                      >
                        👉 {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* 3. CONVERSAZIONE ATTIVA NELLA STANZA */
              <div className="py-4 space-y-2">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming && message.role === 'assistant' && !message.content}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Bottom Chat Input */}
        {currentSubject && (
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
          />
        )}
      </div>

      {/* Quiz Modal con supporto foto del libro e senza titoli ridondanti */}
      {currentSubject && (
        <QuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          subject={currentSubject}
          studentId={currentStudent}
          studentName={activeStudentProfile.name}
          authToken={currentUser.token}
          onQuizCompleted={handleQuizCompleted}
        />
      )}

      {/* Storico Test Modal accessibile da studenti e genitori */}
      <TestHistoryModal
        isOpen={isTestHistoryOpen}
        onClose={() => setIsTestHistoryOpen(false)}
        studentId={currentStudent}
        quizzes={quizzes}
        currentSubject={currentSubject}
        onOpenNewTest={() => {
          setIsTestHistoryOpen(false);
          if (currentSubject) {
            setIsQuizModalOpen(true);
          }
        }}
      />

      {/* Area Riservata Genitori Modal */}
      <ParentDashboardModal
        isOpen={isParentDashboardOpen}
        onClose={() => setIsParentDashboardOpen(false)}
        authToken={currentUser.token}
        isParentRole={currentUser.role === 'parent'}
      />
    </div>
  );
}
