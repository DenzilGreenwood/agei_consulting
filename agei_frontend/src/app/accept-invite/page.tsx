import { createClient } from '@/utils/supabase/server';
import { ShieldCheck } from 'lucide-react';
import OnboardingForm from './OnboardingForm';

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 bg-background text-destructive font-bold text-xl">
        Invalid or Missing Invitation Token.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from('invitations')
    .select('email, status')
    .eq('token', token)
    .single();

  if (error || !invite || invite.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background relative overflow-hidden">
         <div className="max-w-md w-full space-y-8 bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-destructive/50 shadow-2xl relative z-10 text-center">
            <h2 className="text-2xl font-bold text-destructive">Invitation Expired or Invalid</h2>
            <p className="text-muted-foreground">This invitation link has either already been used, expired, or doesn't exist.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-card/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border shadow-2xl relative z-10">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 border border-primary/30 mb-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Complete Registration
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Register your account for <span className="font-bold text-foreground">{invite.email}</span> and upload your signed Mutual NDA to gain access.
          </p>
        </div>

        <OnboardingForm token={token} />
      </div>
    </div>
  );
}
