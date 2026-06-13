import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { useDeleteAccount } from '@/api/hooks/useAccount'
import {
  formatPasswordResetCooldown,
  usePasswordResetCooldown,
} from '@/hooks/usePasswordResetCooldown'
import { getPasswordResetRedirectUrl } from '@/utils/getPasswordResetRedirectUrl'
import { Button } from '@/components/ui/button'
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog'
import { SettingRow } from './SettingRow'

export function AccountSettings() {
  const { user, signOut } = useAuth()
  const email = user?.email ?? ''
  const deleteAccount = useDeleteAccount()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const resetCooldown = usePasswordResetCooldown(email)

  async function handleSendResetEmail() {
    if (sendingReset) return

    const remainingSeconds = resetCooldown.refreshCooldown()
    if (remainingSeconds > 0) {
      toast.error(
        `Please wait ${formatPasswordResetCooldown(
          remainingSeconds,
        )} before requesting another link.`,
      )
      return
    }

    setSendingReset(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success(`We've sent a password reset link to ${email}.`)
        resetCooldown.startNextCooldown()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSendingReset(false)
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync()
    } catch {
      toast.error('Failed to delete account. Please try again.')
      return
    }
    toast.success('Your account has been deleted.')
    await signOut().catch(() => {})
  }

  let resetLabel = 'Send reset link'
  if (sendingReset) resetLabel = 'Sending...'
  else if (resetCooldown.isCoolingDown) {
    resetLabel = `Resend in ${resetCooldown.formattedRemaining}`
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight">Account</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Manage how you sign in and what happens to your data.
      </p>

      <div className="mt-6 flex flex-col divide-y divide-border">
        <div className="pb-6">
          <p className="text-[12px] font-medium tracking-[0.08em] text-text-faint uppercase">
            Email
          </p>
          <p className="mt-1 text-[15px] text-foreground">{email}</p>
        </div>

        <SettingRow
          title="Reset password"
          description="We'll email you a link to set a new password."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendResetEmail}
            disabled={sendingReset || resetCooldown.isCoolingDown}
          >
            {resetLabel}
          </Button>
        </SettingRow>

        <SettingRow
          title="Delete account"
          description="Permanently delete your account and all of your data."
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </SettingRow>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        email={email}
        isDeleting={deleteAccount.isPending}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
