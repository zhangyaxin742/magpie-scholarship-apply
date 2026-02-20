'use client';

import { useState } from 'react';
import { ClipboardCopy } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import type { Essay } from '@/app/components/dashboard/cart/types';

const TOPIC_LABELS: Record<Essay['topic'], string> = {
  personal_statement: 'Personal Statement',
  leadership: 'Leadership',
  challenge: 'Overcoming Challenges',
  community_service: 'Community Service',
  diversity: 'Diversity & Identity',
  career_goals: 'Career Goals',
  academic_interest: 'Academic Interests',
  extracurricular: 'Extracurricular Activities',
  work_experience: 'Work Experience',
  other: 'Other'
};

interface EssayPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  essays: Essay[];
  scholarshipName: string;
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function EssayPickerModal({ isOpen, onClose, essays, scholarshipName }: EssayPickerModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (essay: Essay) => {
    await navigator.clipboard.writeText(essay.text);
    await fetch(`/api/essays/${essay.id}/copy`, { method: 'POST' });
    setCopiedId(essay.id);
    window.setTimeout(() => {
      setCopiedId(null);
      onClose();
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick an essay to copy</DialogTitle>
          <p className="text-sm text-slate-500">For: {scholarshipName}</p>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {essays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-700">No essays saved yet.</p>
              <a
                href="/dashboard/knowledge?tab=essays&action=new"
                className="mt-2 inline-block text-sm font-semibold text-blue-600"
              >
                Add essays in My Knowledge Base
              </a>
            </div>
          ) : (
            essays.map((essay) => (
              <div key={essay.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {TOPIC_LABELS[essay.topic]}
                    </span>
                    <h4 className="mt-2 text-sm font-semibold text-slate-900">
                      {essay.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {(essay.word_count ?? countWords(essay.text))} words
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(essay)}>
                    <ClipboardCopy className="h-4 w-4" />
                    {copiedId === essay.id ? 'Copied! ✅' : 'Copy'}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {essay.text.slice(0, 120)}{essay.text.length > 120 ? '…' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
