import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { legalUrl } from '@/utils/legalUrl'

export default function SignUp() {
  const { user, isLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) return null
  if (user) return <Navigate to="/quick-copy" replace />

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (!agreed) return
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

          <OAuthButtons />

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

            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="sign-up-terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="shrink-0"
              />
              <Label
                htmlFor="sign-up-terms"
                className="block text-[13px] leading-snug font-normal text-muted-foreground"
              >
                I agree to the{' '}
                <a
                  href={legalUrl('/terms')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href={legalUrl('/privacy')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
                >
                  Privacy Policy
                </a>
                .
              </Label>
            </div>

            <Button
              type="submit"
              className="mt-3 h-11 w-full rounded-[10px] text-sm font-medium"
              disabled={submitting || !agreed}
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>
      )}
    </AuthShell>
  )
}
