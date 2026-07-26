'use client';

import { useState } from 'react';
import { completeOnboarding } from '@/app/actions/invite-actions';
import { Lock, User, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnboardingForm({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const res = await completeOnboarding(token, formData);

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push('/docs');
    }
  }

  return (
    <form className="mt-8 space-y-6" action={handleSubmit}>
      {error && <div className="text-destructive text-sm bg-destructive/10 p-4 rounded-xl border border-destructive/20">{error}</div>}
      
      <div className="space-y-4">
        <div className="relative">
          <label className="sr-only">Full Name</label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            name="name"
            type="text"
            required
            className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
            placeholder="Full Name as it appears on NDA"
          />
        </div>

        <div className="relative">
          <label className="sr-only">New Password</label>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
            placeholder="Secure Password (min 6 chars)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Upload Signed NDA (PDF)
          </label>
          <input
            name="ndaFile"
            type="file"
            accept="application/pdf"
            required
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20 transition-colors"
          />
          <p className="mt-2 text-xs text-muted-foreground">Max file size: 10MB. Must be a valid PDF.</p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all shadow-md shadow-primary/20 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? 'Creating Account & Vaulting NDA...' : 'Secure Account & Upload NDA'}
        </button>
      </div>
    </form>
  );
}
