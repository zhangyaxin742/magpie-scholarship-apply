'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ClipboardCopy,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/app/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/app/components/ui/tooltip';
import { cn } from '@/lib/utils';

const TOPIC_LABELS = {
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
} as const;

type EssayTopic = keyof typeof TOPIC_LABELS;

type TabValue = 'essays' | 'activities';

interface Essay {
  id: string;
  topic: EssayTopic;
  title: string | null;
  text: string;
  word_count: number | null;
  tags: string[] | null;
  times_used: number | null;
  created_at: string | null;
}

interface Activity {
  id: string;
  title: string;
  position: string | null;
  description_short: string | null;
  description_medium: string | null;
  description_long: string | null;
  hours_per_week: number | null;
  weeks_per_year: number | null;
  grades: number[] | null;
  times_used: number | null;
  created_at: string | null;
}

interface KnowledgeBaseClientProps {
  initialEssays: Essay[];
  initialActivities: Activity[];
}

interface EssayFormState {
  topic: EssayTopic;
  title: string;
  text: string;
  tags: string[];
}

interface ActivityFormState {
  title: string;
  position: string;
  hours_per_week: string;
  weeks_per_year: string;
  grades: number[];
  description_long: string;
  description_medium: string;
  description_short: string;
}

const fetchJson = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const smartTruncate = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutPoint = lastSpace > maxLen * 0.8 ? lastSpace : maxLen;
  return text.slice(0, cutPoint).trimEnd() + '…';
};

const emptyEssayForm: EssayFormState = {
  topic: 'personal_statement',
  title: '',
  text: '',
  tags: []
};

const emptyActivityForm: ActivityFormState = {
  title: '',
  position: '',
  hours_per_week: '',
  weeks_per_year: '',
  grades: [],
  description_long: '',
  description_medium: '',
  description_short: ''
};

export function KnowledgeBaseClient({ initialEssays, initialActivities }: KnowledgeBaseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');
  const initialTab: TabValue = tabParam === 'activities' ? 'activities' : 'essays';

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEssayFormOpen, setIsEssayFormOpen] = useState(false);
  const [editingEssay, setEditingEssay] = useState<Essay | null>(null);
  const [essayForm, setEssayForm] = useState<EssayFormState>(emptyEssayForm);
  const [essayTagInput, setEssayTagInput] = useState('');
  const [essayCopiedId, setEssayCopiedId] = useState<string | null>(null);
  const [essayFormCopied, setEssayFormCopied] = useState(false);
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());

  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityFormState>(emptyActivityForm);
  const [activityTouched, setActivityTouched] = useState<Set<string>>(new Set());
  const [activityCopiedKey, setActivityCopiedKey] = useState<string | null>(null);

  const actionHandledRef = useRef(false);
  const essayTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activityLongRef = useRef<HTMLTextAreaElement | null>(null);
  const activityMediumRef = useRef<HTMLTextAreaElement | null>(null);
  const activityShortRef = useRef<HTMLTextAreaElement | null>(null);

  const essaysQuery = useQuery({
    queryKey: ['essays'],
    queryFn: () => fetchJson<Essay[]>('/api/essays'),
    initialData: initialEssays
  });

  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetchJson<Activity[]>('/api/activities'),
    initialData: initialActivities
  });

  useEffect(() => {
    if (tabParam !== activeTab) {
      const nextTab: TabValue = tabParam === 'activities' ? 'activities' : 'essays';
      setActiveTab(nextTab);
    }
  }, [tabParam, activeTab]);

  useEffect(() => {
    if (actionHandledRef.current) return;
    if (actionParam !== 'new') return;
    actionHandledRef.current = true;
    if (initialTab === 'activities') {
      handleNewActivity();
    } else {
      handleNewEssay();
    }
    router.replace(`/dashboard/knowledge?tab=${initialTab}`, { scroll: false });
  }, [actionParam, initialTab, router]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!essayTextareaRef.current) return;
    essayTextareaRef.current.style.height = 'auto';
    essayTextareaRef.current.style.height = `${essayTextareaRef.current.scrollHeight}px`;
  }, [essayForm.text]);

  useEffect(() => {
    if (!activityLongRef.current) return;
    activityLongRef.current.style.height = 'auto';
    activityLongRef.current.style.height = `${activityLongRef.current.scrollHeight}px`;
  }, [activityForm.description_long]);

  useEffect(() => {
    if (!activityMediumRef.current) return;
    activityMediumRef.current.style.height = 'auto';
    activityMediumRef.current.style.height = `${activityMediumRef.current.scrollHeight}px`;
  }, [activityForm.description_medium]);

  useEffect(() => {
    if (!activityShortRef.current) return;
    activityShortRef.current.style.height = 'auto';
    activityShortRef.current.style.height = `${activityShortRef.current.scrollHeight}px`;
  }, [activityForm.description_short]);

  const wordCount = useMemo(() => countWords(essayForm.text), [essayForm.text]);
  const [wordCountDisplay, setWordCountDisplay] = useState(wordCount);

  useEffect(() => {
    const timer = window.setTimeout(() => setWordCountDisplay(wordCount), 100);
    return () => window.clearTimeout(timer);
  }, [wordCount]);

  useEffect(() => {
    if (!activityForm.description_long) return;
    const timer = window.setTimeout(() => {
      setActivityForm((prev) => {
        const updates: Partial<ActivityFormState> = {};
        if (!activityTouched.has('description_medium')) {
          updates.description_medium = smartTruncate(prev.description_long, 150);
        }
        if (!activityTouched.has('description_short')) {
          updates.description_short = smartTruncate(prev.description_long, 50);
        }
        return Object.keys(updates).length ? { ...prev, ...updates } : prev;
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [activityForm.description_long, activityTouched]);

  const createEssayMutation = useMutation({
    mutationFn: (payload: EssayFormState) =>
      fetchJson<Essay>('/api/essays', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          title: payload.title || undefined,
          word_count: countWords(payload.text),
          tags: payload.tags
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      setToastMessage('Essay saved to your library.');
      resetEssayForm();
    }
  });

  const updateEssayMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EssayFormState }) =>
      fetchJson<Essay>(`/api/essays/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...payload,
          title: payload.title || undefined,
          word_count: countWords(payload.text),
          tags: payload.tags
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      setToastMessage('Essay updated.');
      resetEssayForm();
    }
  });

  const deleteEssayMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: true }>(`/api/essays/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essays'] });
      setToastMessage('Essay deleted.');
    }
  });

  const copyEssayMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ times_used: number }>(`/api/essays/${id}/copy`, {
        method: 'POST'
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['essays'] })
  });

  const createActivityMutation = useMutation({
    mutationFn: (payload: ActivityFormState) =>
      fetchJson<Activity>('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          position: payload.position || undefined,
          description_long: payload.description_long || undefined,
          description_medium: payload.description_medium || undefined,
          description_short: payload.description_short || undefined,
          hours_per_week: payload.hours_per_week ? Number(payload.hours_per_week) : undefined,
          weeks_per_year: payload.weeks_per_year ? Number(payload.weeks_per_year) : undefined,
          grades: payload.grades.length ? payload.grades : undefined
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setToastMessage('Activity added.');
      resetActivityForm();
    }
  });

  const updateActivityMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActivityFormState }) =>
      fetchJson<Activity>(`/api/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: payload.title,
          position: payload.position || undefined,
          description_long: payload.description_long || undefined,
          description_medium: payload.description_medium || undefined,
          description_short: payload.description_short || undefined,
          hours_per_week: payload.hours_per_week ? Number(payload.hours_per_week) : undefined,
          weeks_per_year: payload.weeks_per_year ? Number(payload.weeks_per_year) : undefined,
          grades: payload.grades.length ? payload.grades : undefined
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setToastMessage('Activity updated.');
      resetActivityForm();
    }
  });

  const deleteActivityMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: true }>(`/api/activities/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setToastMessage('Activity deleted.');
    }
  });

  const copyActivityMutation = useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ times_used: number }>(`/api/activities/${id}/copy`, {
        method: 'POST'
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] })
  });

  const essays = essaysQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];

  const essayGroups = useMemo(() => {
    return essays.reduce<Record<string, Essay[]>>((acc, essay) => {
      const existing = acc[essay.topic] ?? [];
      existing.push(essay);
      acc[essay.topic] = existing;
      return acc;
    }, {});
  }, [essays]);

  const orderedTopics = useMemo(
    () =>
      Object.keys(TOPIC_LABELS).filter((topic) =>
        essayGroups[topic]?.length ? true : topic === 'other'
      ),
    [essayGroups]
  );

  const toggleTopic = (topic: string) => {
    setCollapsedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  };

  const handleTabChange = (value: string) => {
    const nextTab = value === 'activities' ? 'activities' : 'essays';
    setActiveTab(nextTab);
    router.replace(`/dashboard/knowledge?tab=${nextTab}`, { scroll: false });
  };

  const handleNewEssay = () => {
    setEditingEssay(null);
    setEssayForm(emptyEssayForm);
    setEssayTagInput('');
    setIsEssayFormOpen(true);
  };

  const handleEditEssay = (essay: Essay) => {
    setEditingEssay(essay);
    setEssayForm({
      topic: essay.topic,
      title: essay.title ?? '',
      text: essay.text,
      tags: essay.tags ?? []
    });
    setEssayTagInput('');
    setIsEssayFormOpen(true);
  };

  const resetEssayForm = () => {
    setIsEssayFormOpen(false);
    setEditingEssay(null);
    setEssayForm(emptyEssayForm);
    setEssayTagInput('');
    setEssayFormCopied(false);
  };

  const handleEssaySubmit = () => {
    if (!essayForm.text.trim()) return;
    if (editingEssay) {
      updateEssayMutation.mutate({ id: editingEssay.id, payload: essayForm });
    } else {
      createEssayMutation.mutate(essayForm);
    }
  };

  const handleEssayCopy = async (essay: Essay) => {
    await navigator.clipboard.writeText(essay.text);
    setEssayCopiedId(essay.id);
    window.setTimeout(() => setEssayCopiedId(null), 2000);
    copyEssayMutation.mutate(essay.id);
  };

  const handleEssayFormCopy = async () => {
    if (!essayForm.text.trim()) return;
    await navigator.clipboard.writeText(essayForm.text);
    setEssayFormCopied(true);
    window.setTimeout(() => setEssayFormCopied(false), 2000);
    if (editingEssay) {
      copyEssayMutation.mutate(editingEssay.id);
    }
  };

  const handleAddTag = () => {
    const nextTags = essayTagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!nextTags.length) return;
    setEssayForm((prev) => {
      const unique = new Set([...prev.tags, ...nextTags]);
      return { ...prev, tags: Array.from(unique) };
    });
    setEssayTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEssayForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag)
    }));
  };

  const handleNewActivity = () => {
    setEditingActivity(null);
    setActivityForm(emptyActivityForm);
    setActivityTouched(new Set());
    setIsActivityFormOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityForm({
      title: activity.title,
      position: activity.position ?? '',
      hours_per_week: activity.hours_per_week?.toString() ?? '',
      weeks_per_year: activity.weeks_per_year?.toString() ?? '',
      grades: activity.grades ?? [],
      description_long: activity.description_long ?? '',
      description_medium: activity.description_medium ?? '',
      description_short: activity.description_short ?? ''
    });
    setActivityTouched(new Set());
    setIsActivityFormOpen(true);
  };

  const resetActivityForm = () => {
    setIsActivityFormOpen(false);
    setEditingActivity(null);
    setActivityForm(emptyActivityForm);
    setActivityTouched(new Set());
  };

  const handleActivitySubmit = () => {
    if (!activityForm.title.trim()) return;
    if (editingActivity) {
      updateActivityMutation.mutate({ id: editingActivity.id, payload: activityForm });
    } else {
      createActivityMutation.mutate(activityForm);
    }
  };

  const handleActivityCopy = async (activity: Activity, value: string, key: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setActivityCopiedKey(key);
    window.setTimeout(() => setActivityCopiedKey(null), 2000);
    copyActivityMutation.mutate(activity.id);
  };

  const toggleGrade = (grade: number) => {
    setActivityForm((prev) => {
      const exists = prev.grades.includes(grade);
      const nextGrades = exists
        ? prev.grades.filter((item) => item !== grade)
        : [...prev.grades, grade];
      return { ...prev, grades: nextGrades };
    });
  };

  const markTouched = (field: 'description_medium' | 'description_short') => {
    setActivityTouched((prev) => new Set(prev).add(field));
  };

  const handleResync = (field: 'description_medium' | 'description_short', maxLen: number) => {
    setActivityForm((prev) => ({
      ...prev,
      [field]: prev.description_long ? smartTruncate(prev.description_long, maxLen) : ''
    }));
    setActivityTouched((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const longCount = activityForm.description_long.length;
  const mediumCount = activityForm.description_medium.length;
  const shortCount = activityForm.description_short.length;
  const longCounterTone = longCount >= 500 ? 'text-red-600' : longCount >= 400 ? 'text-yellow-600' : 'text-slate-500';
  const longBorderTone = longCount >= 500 ? 'border-red-400 focus-visible:ring-red-400' : '';

  return (
    <TooltipProvider>
      <section className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl backdrop-blur">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="relative space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Magpie Knowledge Base</p>
            <h1 className="text-3xl font-bold text-slate-900">My Knowledge Base</h1>
            <p className="max-w-2xl text-slate-600">
              Save your best essays and activity descriptions once, then reuse them instantly across
              scholarship applications.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {toastMessage ? (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm"
            >
              {toastMessage}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="essays">Essays</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="essays">
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">My Essays</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {essays.length} essays
                    </span>
                  </div>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleNewEssay}
                  >
                    <Plus className="h-4 w-4" /> New Essay
                  </Button>
                </div>

                <AnimatePresence>
                  {isEssayFormOpen ? (
                    <motion.div
                      key="essay-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-md">
                        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Topic
                            </label>
                            <Select
                              value={essayForm.topic}
                              onValueChange={(value) =>
                                setEssayForm((prev) => ({
                                  ...prev,
                                  topic: value as EssayTopic
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select topic" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TOPIC_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Title
                            </label>
                            <Input
                              placeholder="Give this essay a title (optional)"
                              value={essayForm.title}
                              onChange={(event) =>
                                setEssayForm((prev) => ({ ...prev, title: event.target.value }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Tags
                          </label>
                          <Input
                            value={essayTagInput}
                            placeholder="Type a tag and press Enter"
                            onChange={(event) => setEssayTagInput(event.target.value)}
                            onKeyDown={handleTagKeyDown}
                            onBlur={handleAddTag}
                          />
                          {essayForm.tags.length ? (
                            <div className="flex flex-wrap gap-2">
                              {essayForm.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    className="text-slate-400 hover:text-slate-700"
                                    onClick={() => handleRemoveTag(tag)}
                                    aria-label={`Remove ${tag}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Essay Text
                          </label>
                          <Textarea
                            ref={essayTextareaRef}
                            rows={8}
                            value={essayForm.text}
                            onChange={(event) =>
                              setEssayForm((prev) => ({ ...prev, text: event.target.value }))
                            }
                            className="min-h-[200px]"
                          />
                          <p className="text-sm text-slate-500">{wordCountDisplay} words</p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                          <Button variant="ghost" onClick={resetEssayForm}>
                            Cancel
                          </Button>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={handleEssayFormCopy}>
                              <ClipboardCopy className="h-4 w-4" />
                              {essayFormCopied ? 'Copied!' : 'Copy to Clipboard'}
                            </Button>
                            <Button onClick={handleEssaySubmit} disabled={!essayForm.text.trim()}>
                              Save Essay
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {essays.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
                    <div className="text-4xl">📝</div>
                    <h4 className="mt-4 text-lg font-semibold text-slate-900">No essays yet</h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Add your first essay to your knowledge base. You&apos;ll be able to copy it into
                      scholarship applications instantly.
                    </p>
                    <Button className="mt-5" onClick={handleNewEssay}>
                      Add Your First Essay
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderedTopics.map((topicKey) => {
                      const topicEssays = essayGroups[topicKey] ?? [];
                      if (topicEssays.length === 0) return null;
                      const isCollapsed = collapsedTopics.has(topicKey);
                      return (
                        <div
                          key={topicKey}
                          className="rounded-2xl border border-white/50 bg-white/85 shadow-sm"
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                            onClick={() => toggleTopic(topicKey)}
                          >
                            <div>
                              <p className="text-base font-semibold text-slate-900">
                                {TOPIC_LABELS[topicKey as EssayTopic]}
                              </p>
                              <p className="text-xs text-slate-500">{topicEssays.length} essays</p>
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-5 w-5 text-slate-400 transition-transform',
                                isCollapsed ? '-rotate-90' : 'rotate-0'
                              )}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {!isCollapsed ? (
                              <motion.div
                                key="essay-group"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                <div className="divide-y divide-slate-100">
                                  {topicEssays.map((essay) => {
                                    const title = essay.title
                                      ? essay.title
                                      : `${essay.text.slice(0, 50)}${essay.text.length > 50 ? '…' : ''}`;
                                    return (
                                      <div
                                        key={essay.id}
                                        className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                                      >
                                        <div className="space-y-2">
                                          <p className="text-sm font-semibold text-slate-900">
                                            {title}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                                              {essay.word_count ?? countWords(essay.text)} words
                                            </span>
                                            <span>Used {essay.times_used ?? 0} times</span>
                                          </div>
                                          {essay.tags?.length ? (
                                            <div className="flex flex-wrap gap-2">
                                              {essay.tags.map((tag) => (
                                                <span
                                                  key={tag}
                                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                                >
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button
                                                type="button"
                                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                                                onClick={() => handleEditEssay(essay)}
                                                aria-label="Edit essay"
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button
                                                type="button"
                                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                                                onClick={() => handleEssayCopy(essay)}
                                                aria-label="Copy essay"
                                              >
                                                <ClipboardCopy className="h-4 w-4" />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              {essayCopiedId === essay.id ? 'Copied!' : 'Copy'}
                                            </TooltipContent>
                                          </Tooltip>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <button
                                                type="button"
                                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                                                aria-label="Delete essay"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete essay?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this essay? This cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => deleteEssayMutation.mutate(essay.id)}
                                                  className="bg-red-600 text-white hover:bg-red-700"
                                                >
                                                  Delete Essay
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activities">
              <div className="space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">My Activities</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {activities.length} activities
                    </span>
                  </div>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleNewActivity}
                  >
                    <Plus className="h-4 w-4" /> New Activity
                  </Button>
                </div>

                <AnimatePresence>
                  {isActivityFormOpen ? (
                    <motion.div
                      key="activity-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-white/60 bg-white/90 p-6 shadow-md">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Title
                            </label>
                            <Input
                              value={activityForm.title}
                              onChange={(event) =>
                                setActivityForm((prev) => ({
                                  ...prev,
                                  title: event.target.value
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Position
                            </label>
                            <Input
                              placeholder="e.g. Captain, Volunteer, Founder"
                              value={activityForm.position}
                              onChange={(event) =>
                                setActivityForm((prev) => ({
                                  ...prev,
                                  position: event.target.value
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Hours per week
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={168}
                              value={activityForm.hours_per_week}
                              onChange={(event) =>
                                setActivityForm((prev) => ({
                                  ...prev,
                                  hours_per_week: event.target.value
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Weeks per year
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={52}
                              value={activityForm.weeks_per_year}
                              onChange={(event) =>
                                setActivityForm((prev) => ({
                                  ...prev,
                                  weeks_per_year: event.target.value
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Grades active
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[9, 10, 11, 12].map((grade) => (
                              <label
                                key={grade}
                                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600"
                              >
                                <Checkbox
                                  checked={activityForm.grades.includes(grade)}
                                  onCheckedChange={() => toggleGrade(grade)}
                                />
                                {grade}th
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Full Description
                            </label>
                            <span className={cn('text-xs font-semibold', longCounterTone)}>
                              {longCount} / 500
                            </span>
                          </div>
                          <Textarea
                            ref={activityLongRef}
                            maxLength={500}
                            value={activityForm.description_long}
                            onChange={(event) =>
                              setActivityForm((prev) => ({
                                ...prev,
                                description_long: event.target.value
                              }))
                            }
                            className={cn('min-h-[140px]', longBorderTone)}
                          />
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                150 chars
                              </label>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                {activityTouched.has('description_medium') ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-blue-600"
                                    onClick={() => handleResync('description_medium', 150)}
                                  >
                                    <RefreshCcw className="h-3 w-3" /> Re-sync
                                  </button>
                                ) : null}
                                <span>{mediumCount} / 150</span>
                              </div>
                            </div>
                            <Textarea
                              ref={activityMediumRef}
                              maxLength={150}
                              value={activityForm.description_medium}
                              onChange={(event) => {
                                markTouched('description_medium');
                                setActivityForm((prev) => ({
                                  ...prev,
                                  description_medium: event.target.value
                                }));
                              }}
                              className="min-h-[120px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                50 chars
                              </label>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                {activityTouched.has('description_short') ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-blue-600"
                                    onClick={() => handleResync('description_short', 50)}
                                  >
                                    <RefreshCcw className="h-3 w-3" /> Re-sync
                                  </button>
                                ) : null}
                                <span>{shortCount} / 50</span>
                              </div>
                            </div>
                            <Textarea
                              ref={activityShortRef}
                              maxLength={50}
                              value={activityForm.description_short}
                              onChange={(event) => {
                                markTouched('description_short');
                                setActivityForm((prev) => ({
                                  ...prev,
                                  description_short: event.target.value
                                }));
                              }}
                              className="min-h-[120px]"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                          <Button variant="ghost" onClick={resetActivityForm}>
                            Cancel
                          </Button>
                          <Button onClick={handleActivitySubmit} disabled={!activityForm.title.trim()}>
                            Save Activity
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {activities.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
                    <div className="text-4xl">🏆</div>
                    <h4 className="mt-4 text-lg font-semibold text-slate-900">No activities yet</h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Add extracurriculars, jobs, and volunteer work. Magpie generates 50, 150, and
                      500-character versions you can copy into any application.
                    </p>
                    <Button className="mt-5" onClick={handleNewActivity}>
                      Add First Activity
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const gradesLabel = activity.grades?.length
                        ? `Grades: ${activity.grades.join(', ')}`
                        : 'Grades: —';
                      const hoursLabel = activity.hours_per_week
                        ? `${activity.hours_per_week}h/wk`
                        : 'Hours: —';
                      const weeksLabel = activity.weeks_per_year
                        ? `${activity.weeks_per_year} weeks/yr`
                        : 'Weeks: —';

                      return (
                        <div
                          key={activity.id}
                          className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-slate-900">{activity.title}</p>
                              {activity.position ? (
                                <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                  {activity.position}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-400">
                              Used {activity.times_used ?? 0} times
                            </p>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {hoursLabel} · {weeksLabel} · {gradesLabel}
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {([
                              {
                                label: '50 chars',
                                tone: 'bg-slate-50',
                                text: activity.description_short,
                                key: 'short'
                              },
                              {
                                label: '150 chars',
                                tone: 'border border-blue-200 bg-blue-50/50',
                                text: activity.description_medium,
                                key: 'medium'
                              },
                              {
                                label: '500 chars',
                                tone: 'bg-white',
                                text: activity.description_long,
                                key: 'long'
                              }
                            ] as const).map((version) => (
                              <div
                                key={version.key}
                                className={cn(
                                  'flex h-full flex-col justify-between rounded-xl p-3',
                                  version.tone
                                )}
                              >
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {version.label}
                                  </p>
                                  <p className="text-sm text-slate-700">
                                    {version.text ? (
                                      version.text
                                    ) : (
                                      <span className="italic text-slate-300">Not set</span>
                                    )}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3 justify-center"
                                  onClick={() =>
                                    handleActivityCopy(
                                      activity,
                                      version.text ?? '',
                                      `${activity.id}-${version.key}`
                                    )
                                  }
                                  disabled={!version.text}
                                >
                                  {activityCopiedKey === `${activity.id}-${version.key}`
                                    ? 'Copied!'
                                    : 'Copy'}
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => handleEditActivity(activity)}>
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete activity?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this activity? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteActivityMutation.mutate(activity.id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Delete Activity
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </TooltipProvider>
  );
}
