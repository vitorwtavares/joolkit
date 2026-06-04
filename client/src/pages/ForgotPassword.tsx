import { useState } from 'react'
import { Navigate, Link } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  formatPasswordResetCooldown,
  usePasswordResetCooldown,
} from '@/hooks/usePasswordResetCooldown'
import { getPasswordResetRedirectUrl } from '@/utils/getPasswordResetRedirectUrl'

export default function ForgotPassword() {
  const { user, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const resetCooldown = usePasswordResetCooldown(email)

  if (isLoading) return null
  if (user) return <Navigate to="/quick-copy" replace />

  async function sendResetEmail() {
    const remainingSeconds = resetCooldown.refreshCooldown()
    if (remainingSeconds > 0) {
      toast.error(
        `Please wait ${formatPasswordResetCooldown(
          remainingSeconds,
        )} before requesting another link.`,
      )
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      })
      if (error) toast.error(error.message)
      else {
        resetCooldown.startNextCooldown()
        setDone(true)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    void sendResetEmail()
  }

  let resetLabel = 'Send reset link'
  if (submitting) resetLabel = 'Sending...'
  else if (resetCooldown.isCoolingDown) {
    resetLabel = `Resend in ${resetCooldown.formattedRemaining}`
  } else if (done) resetLabel = 'Send another link'

  return (
    <AuthShell>
      {done ? (
        <div className="flex flex-col gap-5">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for{' '}
            <span className="text-foreground">{email}</span>, we've sent a link
            to reset your password.
          </p>
          <Button
            type="button"
            className="h-11 w-full rounded-[10px] text-sm font-medium"
            disabled={submitting || resetCooldown.isCoolingDown}
            onClick={() => void sendResetEmail()}
          >
            {resetLabel}
          </Button>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mb-7 text-[13.5px] text-muted-foreground">
            Enter your email and we'll send you a link to set a new password.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="forgot-password-email"
                className="text-[13px] font-semibold text-foreground"
              >
                Email
              </Label>
              <Input
                id="forgot-password-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[42px] rounded-[10px] bg-card"
              />
            </div>

            <Button
              type="submit"
              className="mt-3 h-11 w-full rounded-[10px] text-sm font-medium"
              disabled={submitting || resetCooldown.isCoolingDown}
            >
              {resetLabel}
            </Button>
          </form>

          <p className="mt-7 text-[13.5px] text-muted-foreground">
            Remembered it?{' '}
            <Link
              to="/sign-in"
              className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      )}
    </AuthShell>
  )
}
