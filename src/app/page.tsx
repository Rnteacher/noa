import { redirect } from 'next/navigation';
import { getCurrentAccessState } from '@/lib/auth/session';

export default async function RootPage() {
  const accessState = await getCurrentAccessState();

  if (accessState === 'authorized') {
    redirect('/dashboard');
  }

  if (accessState === 'access_denied') {
    redirect('/access-denied');
  }

  if (accessState === 'access_pending') {
    redirect('/access-pending');
  }

  redirect('/login');
}
