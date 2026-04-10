export async function downloadFile(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`Download failed: ${res.status} ${res.statusText}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
