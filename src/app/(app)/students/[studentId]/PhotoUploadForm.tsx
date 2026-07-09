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

async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 512, 512);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            const optimizedFile = new File([blob], 'student-photo.webp', {
              type: 'image/webp',
            });
            resolve(optimizedFile);
          },
          'image/webp',
          0.82
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function PhotoUploadForm({ studentId, hasPhoto }: PhotoUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optimizedSize, setOptimizedSize] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setOptimizedSize(null);

    // Client-side validation for input file type/size before processing
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

    startTransition(async () => {
      try {
        const optimized = await optimizeImage(file);
        setOptimizedSize(optimized.size);

        const formData = new FormData();
        formData.append('file', optimized);

        const res = await updateStudentPhoto(studentId, formData);
        if (res.success) {
          setSuccess(t('students.photo.success'));
          router.refresh();
        } else {
          setError(res.error ? t(res.error) : t('students.photo.errorUpload'));
        }
      } catch (err) {
        console.error('Photo optimization or upload failed:', err);
        setError(t('students.photo.errorOptimize'));
      }
      e.target.value = '';
    });
  };

  return (
    <div className="flex flex-col items-center gap-1.5 mt-2 text-center">
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

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-[200px]">
        {t('students.photo.optimizationNotice')}
      </p>

      {optimizedSize ? (
        <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
          {t('students.photo.optimizedSize').replace('{size}', String(Math.round(optimizedSize / 1024)))}
        </p>
      ) : null}

      {error ? (
        <p className="text-[10px] font-semibold text-status-critical max-w-[200px]" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-[10px] font-semibold text-status-positive max-w-[200px]" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
