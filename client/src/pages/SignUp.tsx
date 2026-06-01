import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'

export default function SignUp() {
  const { user, isLoading } = useAuth()
  const [fullName, setFullName] = useState('')
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) toast.error(error.message)
      else setDone(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      {done ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to{' '}
            <span className="text-foreground">{email}</span>.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="mb-7 text-[13.5px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/sign-in"
              className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="sign-up-name"
                className="text-[13px] font-semibold text-foreground"
              >
                Full name
              </Label>
              <Input
                id="sign-up-name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-[42px] rounded-[10px] bg-card"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="sign-up-email"
                className="text-[13px] font-semibold text-foreground"
              >
                Email
              </Label>
              <Input
                id="sign-up-email"
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
                htmlFor="sign-up-password"
                className="text-[13px] font-semibold text-foreground"
              >
                Password
              </Label>
              <Input
                id="sign-up-password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
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
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  )
}
