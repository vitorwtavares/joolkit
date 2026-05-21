import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'

export default function SignIn() {
  const { user, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) return null
  if (user) return <Navigate to="/quick-copy" replace />

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) toast.error(error.message)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-7 text-[13.5px] text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/sign-up"
            className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
          >
            Sign up
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="sign-in-email"
              className="text-[13px] font-semibold text-foreground"
            >
              Email
            </Label>
            <Input
              id="sign-in-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[42px] rounded-[10px] bg-card"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="sign-in-password"
              className="text-[13px] font-semibold text-foreground"
            >
              Password
            </Label>
            <Input
              id="sign-in-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[42px] rounded-[10px] bg-card"
            />
          </div>

          <Button
            type="submit"
            className="mt-3 h-11 w-full rounded-[10px] text-sm font-medium"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
