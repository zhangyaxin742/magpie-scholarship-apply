'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

type EmailPreferences = {
  deadlineReminders: boolean;
  newMatches: boolean;
  weeklyDigest: boolean;
};

type SettingsUser = {
  email: string;
  created_at: string | null;
  email_preferences: EmailPreferences | null;
};

type SettingsProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  high_school: string | null;
  graduation_year: number | null;
  gpa: string | null;
  weighted_gpa: string | null;
  sat_score: number | null;
  act_score: number | null;
  class_rank: string | null;
  gender: string | null;
  ethnicity: string[] | null;
  first_generation: boolean | null;
  agi_range: string | null;
  updated_at: string | null;
};

interface SettingsClientProps {
  profile: SettingsProfile | null;
  user: SettingsUser;
}

const defaultEmailPreferences: EmailPreferences = {
  deadlineReminders: true,
  newMatches: true,
  weeklyDigest: false
};

const optionalString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional()
  );

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined;
      if (typeof value === 'string') return Number(value);
      return value;
    },
    schema.optional()
  );

const profileFormSchema = z.object({
  first_name: optionalString(z.string().min(1, 'First name is required').max(50)),
  last_name: optionalString(z.string().min(1, 'Last name is required').max(50)),
  email: optionalString(z.string().email('Enter a valid email address')),
  phone: optionalString(z.string()),
  street_address: optionalString(z.string()),
  city: optionalString(z.string()),
  state: optionalString(z.string().length(2, 'State must be 2 letters')),
  zip: optionalString(z.string()),
  high_school: optionalString(z.string()),
  graduation_year: optionalNumber(z.number().int().min(2020).max(2035)),
  gpa: optionalNumber(z.number().min(0).max(5)),
  weighted_gpa: optionalNumber(z.number().min(0).max(5)),
  sat_score: optionalNumber(z.number().int().min(400).max(1600)),
  act_score: optionalNumber(z.number().int().min(1).max(36)),
  class_rank: optionalString(z.string()),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', 'other']).optional(),
  agi_range: z.enum(['under_30k', '30k_60k', '60k_100k', 'over_100k']).optional(),
  first_generation: z.boolean().optional(),
  ethnicity: z.array(z.string()).optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type NotificationStatus = 'idle' | 'saving' | 'saved' | 'error';

type PreferenceKey = keyof EmailPreferences;

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateFormatter.format(parsed);
};

export function SettingsClient({ profile, user }: SettingsClientProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'account'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>(
    user.email_preferences ?? defaultEmailPreferences
  );
  const [preferenceStatus, setPreferenceStatus] = useState<Record<PreferenceKey, NotificationStatus>>({
    deadlineReminders: 'idle',
    newMatches: 'idle',
    weeklyDigest: 'idle'
  });
  const saveTimeoutRef = useRef<number | null>(null);

  const toNumberValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const defaultValues = useMemo<ProfileFormValues>(
    () => ({
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      email: profile?.email ?? user.email,
      phone: profile?.phone ?? '',
      street_address: profile?.street_address ?? '',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
      zip: profile?.zip ?? '',
      high_school: profile?.high_school ?? '',
      graduation_year: toNumberValue(profile?.graduation_year),
      gpa: toNumberValue(profile?.gpa),
      weighted_gpa: toNumberValue(profile?.weighted_gpa),
      sat_score: toNumberValue(profile?.sat_score),
      act_score: toNumberValue(profile?.act_score),
      class_rank: profile?.class_rank ?? '',
      gender: (profile?.gender ?? undefined) as ProfileFormValues['gender'],
      agi_range: (profile?.agi_range ?? undefined) as ProfileFormValues['agi_range'],
      first_generation: profile?.first_generation ?? false,
      ethnicity: profile?.ethnicity ?? []
    }),
    [profile, user.email]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onBlur'
  });

  const ethnicityValues = watch('ethnicity') ?? [];
  const [ethnicityInput, setEthnicityInput] = useState('');

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setPreferences(user.email_preferences ?? defaultEmailPreferences);
  }, [user.email_preferences]);

  const setEthnicity = (next: string[]) => {
    setValue('ethnicity', next, { shouldDirty: true });
  };

  const handleAddEthnicity = () => {
    const nextTags = ethnicityInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!nextTags.length) return;
    const unique = new Set([...(ethnicityValues ?? []), ...nextTags]);
    setEthnicity(Array.from(unique));
    setEthnicityInput('');
  };

  const handleEthnicityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddEthnicity();
    }
  };

  const handleRemoveEthnicity = (tag: string) => {
    setEthnicity((ethnicityValues ?? []).filter((item) => item !== tag));
  };

  const applyIssueErrors = (issues: Array<{ path: Array<string | number>; message: string }>) => {
    issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field === 'string') {
        setError(field as keyof ProfileFormValues, {
          type: 'server',
          message: issue.message
        });
      }
    });
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSubmitError(null);
    const parsed = profileFormSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload?.issues) {
          applyIssueErrors(payload.issues as Array<{ path: Array<string | number>; message: string }>);
        }
        throw new Error(payload?.error ?? 'Failed to update profile');
      }

      setToastMessage('Profile updated ✓');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      setSubmitError(message);
    }
  };

  const schedulePreferenceSave = (key: PreferenceKey, nextPreferences: EmailPreferences) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    setPreferenceStatus((prev) => ({ ...prev, [key]: 'saving' }));

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailPreferences: nextPreferences })
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }

        setPreferenceStatus((prev) => ({ ...prev, [key]: 'saved' }));
        window.setTimeout(() => {
          setPreferenceStatus((prev) => ({ ...prev, [key]: 'idle' }));
        }, 1500);
      } catch {
        setPreferenceStatus((prev) => ({ ...prev, [key]: 'error' }));
      }
    }, 500);
  };

  const handlePreferenceToggle = (key: PreferenceKey) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      schedulePreferenceSave(key, next);
      return next;
    });
  };

  const statusLabel = (key: PreferenceKey) => {
    const status = preferenceStatus[key];
    if (status === 'saving') return 'Saving...';
    if (status === 'saved') return 'Saved ✓';
    if (status === 'error') return 'Retry';
    return '';
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/account', { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? 'Failed to delete account');
      }
      setToastMessage('Account deleted.');
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      await signOut();
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      setSubmitError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const lastUpdated = profile?.updated_at ?? null;
  const memberSince = user.created_at ?? null;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Settings</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Your account</h1>
        <p className="mt-2 text-slate-600">Manage your profile and notification preferences.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <AnimatePresence>
            {toastMessage ? (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
              >
                {toastMessage}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <TabsContent value="profile">
            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    First name
                    <Input {...register('first_name')} placeholder="First name" />
                    {errors.first_name ? (
                      <p className="text-xs text-red-600">{errors.first_name.message}</p>
                    ) : null}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Last name
                    <Input {...register('last_name')} placeholder="Last name" />
                    {errors.last_name ? (
                      <p className="text-xs text-red-600">{errors.last_name.message}</p>
                    ) : null}
                  </label>
                </div>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Email
                  <Input {...register('email')} readOnly className="bg-slate-50" />
                  <p className="text-xs text-slate-400">Managed by Clerk</p>
                  {errors.email ? (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  ) : null}
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Phone
                  <Input {...register('phone')} placeholder="(555) 555-5555" />
                </label>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">Address</h2>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Street address
                  <Input {...register('street_address')} placeholder="123 Main St" />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    City
                    <Input {...register('city')} placeholder="City" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    State
                    <Input {...register('state')} placeholder="CA" />
                    {errors.state ? (
                      <p className="text-xs text-red-600">{errors.state.message}</p>
                    ) : null}
                  </label>
                </div>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  ZIP code
                  <Input {...register('zip')} placeholder="94102" />
                </label>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">Academic Information</h2>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  High school
                  <Input {...register('high_school')} placeholder="Your high school" />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Graduation year
                    <Input
                      {...register('graduation_year')}
                      type="number"
                      inputMode="numeric"
                      placeholder="2028"
                    />
                    {errors.graduation_year ? (
                      <p className="text-xs text-red-600">{errors.graduation_year.message}</p>
                    ) : null}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    GPA
                    <Input
                      {...register('gpa')}
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="3.8"
                    />
                    {errors.gpa ? <p className="text-xs text-red-600">{errors.gpa.message}</p> : null}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Weighted GPA
                    <Input
                      {...register('weighted_gpa')}
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="4.2"
                    />
                    {errors.weighted_gpa ? (
                      <p className="text-xs text-red-600">{errors.weighted_gpa.message}</p>
                    ) : null}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    SAT score
                    <Input {...register('sat_score')} type="number" inputMode="numeric" placeholder="1350" />
                    {errors.sat_score ? (
                      <p className="text-xs text-red-600">{errors.sat_score.message}</p>
                    ) : null}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    ACT score
                    <Input {...register('act_score')} type="number" inputMode="numeric" placeholder="30" />
                    {errors.act_score ? (
                      <p className="text-xs text-red-600">{errors.act_score.message}</p>
                    ) : null}
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Class rank
                    <Input {...register('class_rank')} placeholder="Top 10%" />
                  </label>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-semibold text-slate-900">Background</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Gender
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non_binary">Non-binary</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Income range
                    <Controller
                      name="agi_range"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_30k">Under $30K</SelectItem>
                            <SelectItem value="30k_60k">$30K–$60K</SelectItem>
                            <SelectItem value="60k_100k">$60K–$100K</SelectItem>
                            <SelectItem value="over_100k">Over $100K</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Controller
                    name="first_generation"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      />
                    )}
                  />
                  <span className="text-sm text-slate-700">First-generation college student</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ethnicity</label>
                  <Input
                    value={ethnicityInput}
                    onChange={(event) => setEthnicityInput(event.target.value)}
                    onKeyDown={handleEthnicityKeyDown}
                    onBlur={handleAddEthnicity}
                    placeholder="Type and press Enter"
                  />
                  {ethnicityValues.length ? (
                    <div className="flex flex-wrap gap-2">
                      {ethnicityValues.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        >
                          {tag}
                          <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => handleRemoveEthnicity(tag)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
                <p className="text-xs text-slate-400">Last updated: {formatDate(lastUpdated)}</p>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Email Preferences</h2>
                <p className="text-sm text-slate-600">Control what Magpie sends you.</p>
              </div>
              <div className="space-y-4">
                {(
                  [
                    {
                      key: 'deadlineReminders',
                      label: 'Deadline reminders',
                      description: 'Get reminded 7, 3, and 1 day before each deadline'
                    },
                    {
                      key: 'newMatches',
                      label: 'New scholarship matches',
                      description: 'Know when new scholarships match your profile'
                    },
                    {
                      key: 'weeklyDigest',
                      label: 'Weekly digest',
                      description: 'A weekly summary of your scholarship progress'
                    }
                  ] as Array<{ key: PreferenceKey; label: string; description: string }>
                ).map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                        {statusLabel(item.key) ? (
                          <span
                            className={cn(
                              'text-xs font-medium',
                              preferenceStatus[item.key] === 'saved'
                                ? 'text-emerald-600'
                                : preferenceStatus[item.key] === 'error'
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                            )}
                          >
                            {statusLabel(item.key)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                    <Switch
                      checked={preferences[item.key]}
                      aria-label={`Toggle ${item.label}`}
                      onCheckedChange={() => handlePreferenceToggle(item.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Email: {user.email}</p>
                  <p>Member since: {formatDate(memberSince)}</p>
                  <a
                    href="https://accounts.clerk.com/user"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Manage password &amp; security →
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Permanently delete your account and all data including your profile, essays, activities, and
                  scholarship history. This cannot be undone.
                </p>
                <div className="mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete everything. Type DELETE below to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Confirmation</label>
                        <Input
                          value={deleteInput}
                          onChange={(event) => setDeleteInput(event.target.value)}
                          placeholder="Type DELETE"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          disabled={deleteInput !== 'DELETE' || isDeleting}
                          onClick={handleDeleteAccount}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
