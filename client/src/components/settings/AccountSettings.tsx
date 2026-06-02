import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/api/supabase'
import { useAuth } from '@/context/auth'
import { useDeleteAccount } from '@/api/hooks/useAccount'
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

  async function handleSendResetEmail() {
    if (sendingReset) return
    setSendingReset(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      })
      if (error) toast.error(error.message)
      else toast.success(`We've sent a password reset link to ${email}.`)
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

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight">Account</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{email}</p>

      <div className="mt-4 flex flex-col divide-y divide-border">
        <SettingRow
          title="Reset password"
          description="We'll email you a link to set a new password."
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendResetEmail}
            disabled={sendingReset}
          >
            {sendingReset ? 'Sending...' : 'Send reset link'}
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
