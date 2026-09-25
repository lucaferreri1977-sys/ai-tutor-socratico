'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SubjectId, SUBJECTS, StudentId, STUDENTS, ChatSessionSummary } from '@/lib/types';
import { SubjectSelector } from '@/components/SubjectSelector';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage, MessageData } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SubjectWelcome } from '@/components/SubjectWelcome';
import { ParentModal } from '@/components/ParentModal';
import { ParentDashboardModal } from '@/components/ParentDashboardModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { PinGate } from '@/components/PinGate';
import { fireCelebrationConfetti, shouldCelebrate } from '@/lib/confetti';
import { AlertCircle, Key } from 'lucide-react';

export default function Home() {
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Student State (Alessio vs Mattia)
  const [currentStudent, setCurrentStudent] = useState<StudentId>('alessio');

  // Active Chat & Subject
  const [currentSubject, setCurrentSubject] = useState<SubjectId>('matematica');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Modals & Drawers
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [isParentDashboardOpen, setIsParentDashboardOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Saved sessions for active student
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Check saved PIN & Student on mount
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem('socrate_family_pin');
      if (savedPin) {
        setUnlockedPin(savedPin);
      }
      const savedStudent = localStorage.getItem('socrate_active_student') as StudentId | null;
      if (savedStudent && (savedStudent === 'alessio' || savedStudent === 'mattia')) {
        setCurrentStudent(savedStudent);
      }
    } catch {
      // LocalStorage access fallback
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  // Fetch student sessions from Firestore
  const fetchStudentSessions = useCallback(async (student: StudentId, pin: string) => {
    try {
      const res = await fetch(`/api/sessions?studentId=${student}`, {
        headers: { 'x-family-pin': pin },
      });
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  }, []);

  useEffect(() => {
    if (unlockedPin) {
      fetchStudentSessions(currentStudent, unlockedPin);
    }
  }, [unlockedPin, currentStudent, fetchStudentSessions]);

  // Switch student
  const handleSelectStudent = (studentId: StudentId) => {
    if (studentId === currentStudent) return;
    setCurrentStudent(studentId);
    try {
      localStorage.setItem('socrate_active_student', studentId);
    } catch {}
    // Reset active chat to fresh session for the new student
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Switch subject
  const handleSelectSubject = (newSubject: SubjectId) => {
    if (newSubject === currentSubject) return;
    setCurrentSubject(newSubject);
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Reset / New session
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setApiError(null);
  };

  // Lock application with PIN
  const handleLockApp = () => {
    try {
      localStorage.removeItem('socrate_family_pin');
    } catch {}
    setUnlockedPin(null);
    setCurrentSessionId(null);
    setMessages([]);
  };

  // Load a session from history
  const handleLoadSession = async (sessionId: string) => {
    if (!unlockedPin) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers: { 'x-family-pin': unlockedPin },
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setCurrentSessionId(data.session.id);
        setCurrentSubject(data.session.subject || 'matematica');
        setMessages(data.session.messages || []);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  };

  // Delete a session from history
  const handleDeleteSession = async (sessionId: string) => {
    if (!unlockedPin) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-family-pin': unlockedPin },
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  // Save session to Firebase Firestore
  const saveSessionToCloud = async (sessionIdToSave: string, updatedMessages: MessageData[]) => {
    if (!unlockedPin || updatedMessages.length === 0) return;
    try {
      const activeStudent = STUDENTS[currentStudent];
      await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-family-pin': unlockedPin,
        },
        body: JSON.stringify({
          id: sessionIdToSave,
          studentId: currentStudent,
          studentName: activeStudent.name,
          subject: currentSubject,
          messages: updatedMessages,
        }),
      });

      // Refresh list
      fetchStudentSessions(currentStudent, unlockedPin);
    } catch (e) {
      console.error('Failed to persist session to Firebase:', e);
    }
  };

  // Send message
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if ((!text.trim() && !imageBase64) || isStreaming) return;

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
          'x-family-pin': unlockedPin || '',
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          subject: currentSubject,
          pin: unlockedPin,
          studentName: activeStudentProfile.name,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLockApp();
          throw new Error('PIN non valido o scaduto. Inserisci nuovamente il PIN di famiglia.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Errore del server (${response.status}) durante la richiesta.`
        );
      }

      if (!response.body) {
        throw new Error('Il server non ha restituito uno stream di dati.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
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

      // Final complete messages array
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

  // PIN Gate
  if (!unlockedPin) {
    return (
      <PinGate
        onUnlock={(pin) => {
          setUnlockedPin(pin);
          fetchStudentSessions(currentStudent, pin);
        }}
      />
    );
  }

  const activeSubjectMeta = SUBJECTS[currentSubject];
  const activeStudentProfile = STUDENTS[currentStudent];

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/60 dark:bg-slate-950">
      {/* Top Header */}
      <ChatHeader
        currentSubject={activeSubjectMeta}
        currentStudent={currentStudent}
        onSelectStudent={handleSelectStudent}
        onResetChat={handleNewSession}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenParentDashboard={() => setIsParentDashboardOpen(true)}
        onLockApp={handleLockApp}
        disabled={isStreaming}
      />

      {/* Horizontal Subject Bar */}
      <SubjectSelector
        currentSubject={currentSubject}
        onSelectSubject={handleSelectSubject}
        disabled={isStreaming}
      />

      {/* Error alert banner */}
      {apiError && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 px-4 py-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => setIsParentModalOpen(true)}
            className="text-xs font-semibold underline hover:text-amber-950 dark:hover:text-amber-100 flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <Key className="w-3.5 h-3.5" /> Informazioni
          </button>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto flex flex-col justify-between">
        <div className="flex-1">
          {messages.length === 0 ? (
            <SubjectWelcome
              subject={activeSubjectMeta}
              studentName={activeStudentProfile.name}
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <div className="py-4 space-y-1">
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

      {/* Bottom Fixed Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isStreaming}
        quickPrompts={activeSubjectMeta.quickPrompts}
      />

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        studentName={activeStudentProfile.name}
        onSelectSession={handleLoadSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Area Riservata Genitori Modal */}
      <ParentDashboardModal
        isOpen={isParentDashboardOpen}
        onClose={() => setIsParentDashboardOpen(false)}
        familyPin={unlockedPin}
      />

      {/* Pedagogical Info Modal */}
      <ParentModal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
      />
    </div>
  );
}
