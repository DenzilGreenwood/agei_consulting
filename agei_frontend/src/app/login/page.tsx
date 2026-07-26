'use client'

import { useState, Suspense } from 'react'
import { login, signup } from './actions'
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        const res = await login(formData)
        if (res?.error) setError(res.error)
      } else {
        const res = await signup(formData)
        if (res?.error) setError(res.error)
        if (res?.success) setSuccess(res.success)
      }
    } catch (e) {
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-card/60 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-border shadow-2xl relative z-10">
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            {isLogin ? 'Access Evidence Vault' : 'Request Access'}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Sign in here
                </button>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" action={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-start">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-success/10 border border-success/20 text-success text-sm p-4 rounded-xl flex items-start">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm placeholder:text-muted-foreground/60"
                placeholder="Email address"
              />
            </div>
            
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                className="block w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm placeholder:text-muted-foreground/60"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center">
             &larr; Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
