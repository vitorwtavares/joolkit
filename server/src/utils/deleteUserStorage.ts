import { getSupabase } from '../middleware/auth'

// Every user's uploads are stored under a top-level folder named after their
// user id, across these buckets. The DB cascade doesn't touch Storage, so these
// have to be cleaned up explicitly when an account is deleted.
const USER_STORAGE_BUCKETS = ['resumes', 'cover-letters'] as const

async function listFilesRecursively(
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data, error } = await getSupabase()
    .storage.from(bucket)
    .list(prefix, { limit: 1000 })

  if (error || !data) return []

  const paths: string[] = []
  for (const entry of data) {
    const path = `${prefix}/${entry.name}`
    // Supabase returns folders with a null id; actual files carry an id.
    if (entry.id === null) {
      paths.push(...(await listFilesRecursively(bucket, path)))
    } else {
      paths.push(path)
    }
  }
  return paths
}

export async function deleteUserStorage(userId: string): Promise<void> {
  // Guard against ever listing a bucket root: an empty prefix would enumerate
  // every user's files and delete all of them.
  if (!userId) {
    throw new Error('deleteUserStorage called without a userId')
  }

  for (const bucket of USER_STORAGE_BUCKETS) {
    const paths = await listFilesRecursively(bucket, userId)
    if (paths.length > 0) {
      const { error } = await getSupabase().storage.from(bucket).remove(paths)
      if (error) {
        console.error(
          `Failed to remove ${bucket} files for user ${userId}:`,
          error.message,
        )
      }
    }
  }
}
