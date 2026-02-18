'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useParsedOnboardingStore } from '@/lib/onboarding/parsedStore';
import type { ParsedOnboardingState } from '@/lib/onboarding/parsedStore';
import type { ParsedOnboardingPayload } from '@/lib/onboarding/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function PDFUploader() {
  const router = useRouter();
  const setParsedPayload = useParsedOnboardingStore((state: ParsedOnboardingState) => state.setParsedPayload);
  const clearParsedPayload = useParsedOnboardingStore((state: ParsedOnboardingState) => state.clearParsedPayload);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lowConfidence, setLowConfidence] = useState<ParsedOnboardingPayload | null>(null);

  const validateFile = useCallback((candidate: File) => {
    if (candidate.type !== 'application/pdf') {
      return 'Please upload a PDF file under 10MB.';
    }
    if (candidate.size > MAX_FILE_SIZE) {
      return 'Please upload a PDF file under 10MB.';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (candidate: File) => {
      const validationError = validateFile(candidate);
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      setFile(candidate);
      setError(null);
      setProgress(0);
      setLowConfidence(null);
      clearParsedPayload();
    },
    [clearParsedPayload, validateFile]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      handleFile(selected);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      handleFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setProgress(12);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => (prev < 80 ? prev + 8 : prev));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/parse-common-app', {
        method: 'POST',
        body: formData
      });

      const result = (await response.json()) as {
        success: boolean;
        confidence: number;
        data: ParsedOnboardingPayload['data'];
        errors: string[];
        error?: string;
      };

      window.clearInterval(progressTimer);
      setProgress(100);

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Upload failed. Please try again or fill out manually.');
        setUploading(false);
        return;
      }

      const payload: ParsedOnboardingPayload = {
        data: result.data,
        confidence: result.confidence,
        errors: result.errors ?? []
      };

      setParsedPayload(payload);

      if (result.confidence === 0) {
        clearParsedPayload();
        router.push('/onboarding/manual');
        return;
      }

      if (result.confidence < 0.7) {
        setLowConfidence(payload);
        setUploading(false);
        return;
      }

      router.push('/onboarding/confirm');
    } catch (err) {
      window.clearInterval(progressTimer);
      console.error(err);
      setError('Upload failed. Please try again or fill out manually.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border-2 border-dashed border-blue-200 bg-slate-50 p-8 text-center transition hover:border-blue-400"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <p className="text-sm font-semibold text-blue-600">FASTEST (30 seconds)</p>
        <p className="mt-2 text-xl font-semibold text-slate-900">📄 Upload Common App PDF</p>
        <p className="mt-2 text-sm text-slate-600">Drop file or click to upload. Accepted: .pdf • Max: 10MB</p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {file ? 'Choose another file' : 'Choose File'}
        </button>

        {file ? (
          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-left shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : null}
      </div>

      {progress > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{uploading ? 'Parsing your PDF...' : 'Ready'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <motion.div
              layoutId="upload-progress"
              className="h-full rounded-full bg-blue-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {lowConfidence ? (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <p className="font-semibold">Some fields couldn&apos;t be parsed.</p>
          <p className="mt-1 text-yellow-800">Review what we found or switch to manual entry.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/onboarding/confirm')}
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white"
            >
              Review parsed info
            </button>
            <button
              type="button"
              onClick={() => router.push('/onboarding/manual')}
              className="rounded-full border border-blue-200 px-5 py-2 text-xs font-semibold text-blue-700"
            >
              Fill out manually
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? 'Processing…' : 'Continue →'}
      </button>
    </div>
  );
}
