import { Download, RotateCcw, Trash2, Upload } from 'lucide-react'
import { CoverLetterActionButton } from './CoverLetterActionButton'

interface CoverLetterToolbarProps {
  onUpload: () => void
  onRemove: () => void
  onRestore: () => void
  onDownload: () => void
  isUploading: boolean
  isRemoving: boolean
  isRestoring: boolean
  isDownloading: boolean
  canRemove: boolean
  canRestore: boolean
  downloadDisabled: boolean
}

export function CoverLetterToolbar({
  onUpload,
  onRemove,
  onRestore,
  onDownload,
  isUploading,
  isRemoving,
  isRestoring,
  isDownloading,
  canRemove,
  canRestore,
  downloadDisabled,
}: CoverLetterToolbarProps) {
  const busy = isUploading || isRemoving || isRestoring

  return (
    <div className="flex items-center gap-1.5">
      <CoverLetterActionButton
        layout="toolbar"
        variant="outline"
        icon={Upload}
        label="Upload file"
        compactLabel="Upload"
        onClick={onUpload}
        loading={isUploading}
        disabled={busy}
      />
      <CoverLetterActionButton
        layout="toolbar"
        variant="outline"
        icon={Trash2}
        label="Remove"
        compactLabel="Remove"
        onClick={onRemove}
        loading={isRemoving}
        disabled={busy || !canRemove}
      />
      <CoverLetterActionButton
        layout="toolbar"
        variant="outline"
        icon={RotateCcw}
        label="Restore original file"
        compactLabel="Restore"
        onClick={onRestore}
        loading={isRestoring}
        disabled={busy || !canRestore}
      />
      <CoverLetterActionButton
        layout="toolbar"
        icon={Download}
        label="Download PDF"
        compactLabel="Download"
        onClick={onDownload}
        loading={isDownloading}
        disabled={downloadDisabled || isDownloading}
      />
    </div>
  )
}
