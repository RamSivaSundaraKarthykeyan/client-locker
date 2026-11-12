import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/app/components/LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'partner') redirect('/partner/dashboard');
    if (session.role === 'staff') redirect('/staff/dashboard');
    redirect('/client/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <LoginForm />
    </div>
  );
}

