import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignUp() {
  const { user, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) return null
  if (user) return <Navigate to="/quick-copy" replace />

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) toast.error(error.message)
      else setDone(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background px-4">
      <div className="absolute top-10 left-1/2 -translate-x-1/2">
        <span className="text-[52px] leading-none font-normal tracking-[-1.8px] text-brand">
          noloop
        </span>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to{' '}
                <span className="text-foreground">{email}</span>.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Create an account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/sign-in"
                    className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
