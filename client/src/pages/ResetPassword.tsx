import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'

export default function ResetPassword() {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) return null

  if (!session) {
    return (
      <AuthShell>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Link expired
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            This password reset link is invalid or has expired.{' '}
            <span className="whitespace-nowrap">
              <Link
                to="/forgot-password"
                className="font-medium text-foreground underline underline-offset-[3px] transition-colors hover:text-brand"
              >
                Request a new one
              </Link>
              .
            </span>
          </p>
        </div>
      </AuthShell>
    )
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Your password has been updated.')
        navigate('/quick-copy', { replace: true })
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="mb-7 text-[13.5px] text-muted-foreground">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="reset-password"
              className="text-[13px] font-semibold text-foreground"
            >
              New password
            </Label>
            <Input
              id="reset-password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[42px] rounded-[10px] bg-card"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="reset-password-confirm"
              className="text-[13px] font-semibold text-foreground"
            >
              Confirm new password
            </Label>
            <Input
              id="reset-password-confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-[42px] rounded-[10px] bg-card"
            />
          </div>

          <Button
            type="submit"
            className="mt-3 h-11 w-full rounded-[10px] text-sm font-medium"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
