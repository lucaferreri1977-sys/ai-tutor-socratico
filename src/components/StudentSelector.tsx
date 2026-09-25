'use client';

import React from 'react';
import { StudentId, STUDENTS } from '@/lib/types';
import { Users } from 'lucide-react';

interface StudentSelectorProps {
  currentStudent: StudentId;
  onSelectStudent: (id: StudentId) => void;
  disabled?: boolean;
}

export function StudentSelector({
  currentStudent,
  onSelectStudent,
  disabled = false,
}: StudentSelectorProps) {
  const studentsList = Object.values(STUDENTS);

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
      {studentsList.map((student) => {
        const isSelected = student.id === currentStudent;
        return (
          <button
            key={student.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectStudent(student.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs scale-102 ring-1 ring-sky-300 dark:ring-sky-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-base">{student.avatar}</span>
            <span>{student.name}</span>
          </button>
        );
      })}
    </div>
  );
}
