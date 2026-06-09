import { Router } from 'express'
import { getSupabase } from '../../middleware/auth'
import { deleteUserStorage } from '../../utils/deleteUserStorage'

const router = Router()

router.delete('/', async (req, res) => {
  const userId = req.userId!

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
