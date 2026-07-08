'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { updateStudentPhoto } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type PhotoUploadFormProps = {
  studentId: string;
  hasPhoto: boolean;
};

export function PhotoUploadForm({ studentId, hasPhoto }: PhotoUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Client-side validations
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('students.photo.errorType'));
      e.target.value = '';
      return;
    }

    if (file.size > 5242880) { // 5MB limit
      setError(t('students.photo.errorSize'));
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const res = await updateStudentPhoto(studentId, formData);
      if (res.success) {
        setSuccess(t('students.photo.success'));
        router.refresh();
      } else {
        setError(res.error ? t(res.error) : t('students.photo.errorUpload'));
      }
      e.target.value = '';
    });
  };

  return (
    <div className="flex flex-col items-center gap-1.5 mt-2">
      <label className={`flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all active:scale-[0.98] ${
        isPending 
          ? 'bg-surface-sunken/50 text-ink-muted pointer-events-none' 
          : 'bg-surface-sunken text-ink-secondary hover:bg-surface-sunken/80'
      }`}>
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        <span>{hasPhoto ? t('students.photo.changeButton') : t('students.photo.uploadButton')}</span>
        <input 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          className="sr-only" 
          onChange={handleFileChange} 
          disabled={isPending} 
        />
      </label>

      {error ? (
        <p className="text-[10px] font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-[10px] font-semibold text-status-positive" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
