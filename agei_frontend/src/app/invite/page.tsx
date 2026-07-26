import { createClient } from '@/utils/supabase/server'
import { acceptInvitation } from '../actions/invite'
import { ShieldCheck, Lock } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="text-center text-destructive font-bold text-xl">
          Invalid or Missing Invitation Token.
        </div>
      </div>
    )
  }

  // Server-side validation of the token before rendering the form
  const supabase = await createClient()
  const { data: invite, error } = await supabase
    .from('invitations')
    .select('email, status')
    .eq('token', token)
    .single()

  if (error || !invite || invite.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
         <div className="max-w-md w-full space-y-8 bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-destructive/50 shadow-2xl relative z-10 text-center">
            <h2 className="text-2xl font-bold text-destructive">Invitation Expired or Invalid</h2>
            <p className="text-muted-foreground">This invitation link has either already been used, expired, or doesn't exist. Please request a new invite.</p>
         </div>
      </div>
    )
  }

  // Inline Server Action for form submission
  async function completeOnboarding(formData: FormData) {
    'use server'
    const result = await acceptInvitation(token as string, formData)
    if (result.success) {
      redirect('/docs')
    }
    // Simple redirect back with error, in a real app you'd use useActionState for better UX
    redirect(`/invite?token=${token}&error=Failed to create account`)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-card/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border shadow-2xl relative z-10">
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
            <ShieldCheck className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Accept Invitation
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            You have been invited to join AGEI. Create a password for <span className="font-bold text-foreground">{invite.email}</span> to complete your setup.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={completeOnboarding}>
          
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="password" className="sr-only">New Password</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all sm:text-sm placeholder:text-muted-foreground/60"
                placeholder="Secure Password (min 6 chars)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-emerald-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-background transition-all shadow-md shadow-emerald-500/20"
            >
              Secure Account & Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
