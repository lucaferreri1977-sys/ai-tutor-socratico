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
import { ParentDashboardView } from '@/components/ParentDashboardView';
import { LoginScreen } from '@/components/LoginScreen';
import { fireCelebrationConfetti, shouldCelebrate } from '@/lib/confetti';
import { AlertCircle } from 'lucide-react';

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
  const [selectedQuizForModal, setSelectedQuizForModal] = useState<QuizTestRecord | null>(null);
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
    setIsQuizModalOpen(false);
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
  const handleSendMessage = async (text: string, imageOrImages?: string | string[]) => {
    const images: string[] = Array.isArray(imageOrImages)
      ? imageOrImages
      : (imageOrImages ? [imageOrImages] : []);

    if ((!text.trim() && images.length === 0) || isStreaming || !currentUser || !currentSubject) return;

    setApiError(null);

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activeStudentProfile = STUDENTS[currentStudent];

    const userMessage: MessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      imageUrl: images[0],
      imageUrls: images,
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
      // Mantieni le immagini solo per il messaggio più recente che le contiene,
      // azzerando il payload delle immagini nei messaggi precedenti per evitare accumuli di peso e 413
      const lastIndexWithImgs = newMessages.reduce(
        (acc, m, idx) => ((m.imageUrls && m.imageUrls.length > 0) || m.imageUrl ? idx : acc),
        -1
      );

      const payloadMessages = newMessages.map((m, idx) => ({
        role: m.role,
        content: m.content,
        imageUrl: idx === lastIndexWithImgs ? m.imageUrl : undefined,
        imageUrls: idx === lastIndexWithImgs ? m.imageUrls : undefined,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-auth': currentUser.token,
          'x-family-pin': currentUser.token,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          subject: currentSubject,
          studentName: activeStudentProfile.name,
        }),
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Le foto allegate sono troppo pesanti per il server. Riprova con meno foto o scattando a risoluzione standard.');
        }
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

  // Se l'utente autenticato è il Genitore, mostra ESCLUSIVAMENTE la pagina statistiche dedicata ai genitori
  if (currentUser.role === 'parent') {
    return (
      <ParentDashboardView
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  const activeStudentProfile = STUDENTS[currentStudent];
  const activeSubjectMeta = currentSubject ? SUBJECTS[currentSubject] : null;
  const studentQuizzes = quizzes.filter((q) => q.studentId === currentStudent);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-slate-100/60 dark:bg-slate-950">
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
        onOpenTestHistory={() => {
          setSelectedQuizForModal(null);
          setIsTestHistoryOpen(true);
        }}
        onSelectQuizDetail={(quiz) => {
          setSelectedQuizForModal(quiz);
          setIsTestHistoryOpen(true);
        }}
        currentStudent={currentStudent}
        quizzes={quizzes}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] max-h-[100dvh] overflow-hidden">
        {/* Top Header */}
        <ChatHeader
          currentUser={currentUser}
          currentStudent={currentStudent}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
          onTitleClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
          disabled={isStreaming}
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
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
            {/* 1. SE NESSUNA STANZA È SELEZIONATA: Schermata Iniziale di Benvenuto */}
            {!currentSubject || !activeSubjectMeta ? (
              <InitialWelcomeScreen
                studentName={activeStudentProfile.name}
                onSelectSubject={handleSelectSubject}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />
            ) : messages.length === 0 ? (
              /* 2. SE DENTRO UNA STANZA MA NESSUN MESSAGGIO: Schermata pulita solo icona e titolo */
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 px-4 py-4 my-auto animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center text-2xl sm:text-3xl mx-auto shadow-xs select-none">
                    {activeSubjectMeta.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                      {activeSubjectMeta.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      {activeSubjectMeta.description}
                    </p>
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
      {isQuizModalOpen && currentSubject && (
        <QuizModal
          key={`${currentStudent}-${currentSubject}`}
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
        onClose={() => {
          setIsTestHistoryOpen(false);
          setSelectedQuizForModal(null);
        }}
        studentId={currentStudent}
        quizzes={quizzes}
        currentSubject={currentSubject}
        selectedQuiz={selectedQuizForModal}
        onOpenNewTest={() => {
          setIsTestHistoryOpen(false);
          setSelectedQuizForModal(null);
          if (currentSubject) {
            setIsQuizModalOpen(true);
          }
        }}
      />
    </div>
  );
}
