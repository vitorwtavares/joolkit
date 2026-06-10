import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'
import { deleteUserStorage } from '../../utils/deleteUserStorage'
import { cancelActiveSubscription } from '../../billing/cancel'

const router = Router()

router.delete('/', async (req, res) => {
  const userId = req.userId!

  // Cancel any live Stripe subscription first so a deleted account stops being
  // billed. Abort on failure — better to block deletion than orphan a paying
  // subscription with no account to manage it.
  try {
    await cancelActiveSubscription(userId)
  } catch (err) {
    console.error('Failed to cancel subscription on account deletion', err)
    res.status(500).json({ error: 'Could not cancel active subscription' })
    return
  }

  const { error } = await getSupabase().auth.admin.deleteUser(userId)
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  // Storage isn't covered by the DB cascade, so clean it up after the account
  // is gone. Best-effort: orphaned files shouldn't fail an otherwise-done delete.
  try {
    await deleteUserStorage(userId)
  } catch {
    // Intentionally ignored — the account is already deleted.
  }

  res.status(204).end()
})

export default router
