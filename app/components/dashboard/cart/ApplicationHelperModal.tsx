'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, ExternalLink } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import type { Essay, Scholarship } from '@/app/components/dashboard/cart/types';

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

interface ApplicationHelperModalProps {
  isOpen: boolean;
  scholarship: Scholarship | null;
  essays: Essay[];
  onApplied: () => void;
  onClose: () => void;
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function ApplicationHelperModal({
  isOpen,
  scholarship,
  essays,
  onApplied,
  onClose
}: ApplicationHelperModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recommendedEssays = useMemo(() => {
    if (!scholarship) return [];
    const promptText = (scholarship.essay_prompts ?? []).join(' ').toLowerCase();

    const scored = essays.map((essay) => {
      const label = TOPIC_LABELS[essay.topic].toLowerCase();
      const slug = essay.topic.replace(/_/g, ' ');
      const promptMatch =
        promptText.includes(slug) || promptText.includes(label) || promptText.includes(essay.topic);
      const score = promptMatch ? 2 : 0;
      const usage = essay.times_used ?? 0;
      const createdAt = essay.created_at ? new Date(essay.created_at).getTime() : 0;
      return { essay, score, usage, createdAt };
    });

    return scored
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.usage !== b.usage) return b.usage - a.usage;
        return b.createdAt - a.createdAt;
      })
      .slice(0, 3)
      .map((item) => item.essay);
  }, [essays, scholarship]);

  const handleCopy = async (essay: Essay) => {
    await navigator.clipboard.writeText(essay.text);
    await fetch(`/api/essays/${essay.id}/copy`, { method: 'POST' });
    setCopiedId(essay.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Applying to {scholarship?.name ?? 'this scholarship'}</DialogTitle>
        </DialogHeader>

        {scholarship ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Application URL</span>
                <a
                  href={scholarship.application_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600"
                >
                  Open link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-2 break-all text-xs text-slate-500">
                {scholarship.application_url}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">From your Knowledge Base</p>
              {essays.length === 0 ? (
                <a
                  href="/dashboard/knowledge?tab=essays&action=new"
                  className="text-sm font-semibold text-blue-600"
                >
                  Add essays to your knowledge base
                </a>
              ) : (
                <div className="space-y-3">
                  {recommendedEssays.map((essay) => (
                    <div
                      key={essay.id}
                      className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {TOPIC_LABELS[essay.topic]}
                          </span>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {essay.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {essay.word_count ?? countWords(essay.text)} words
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(essay)}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          {copiedId === essay.id ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900">
                After you apply, come back and confirm:
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full rounded-xl bg-green-600 text-base text-white hover:bg-green-700"
                onClick={onApplied}
              >
                ✓ I Applied
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
