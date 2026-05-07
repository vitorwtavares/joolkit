import { Globe, Link2, Mail, MapPin, Phone, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth'
import { useProfile, useUpdateProfile } from '@/api/hooks/useProfile'
import {
  useCoverLetters,
  useDeleteCoverLetterTemplate,
  useUpdateCoverLetterFile,
} from '@/api/hooks/useCoverLetters'
import { CopyButton } from '@/components/quick-copy/CopyButton'
import { ResumeButton } from '@/components/quick-copy/ResumeButton'
import { CoverLetterCard } from '@/components/quick-copy/CoverLetterCard'
import type { UpdateProfilePayload } from '@/api/hooks/useProfile'
import { LinkedInIcon } from '@/icons/LinkedInIcon'
import { GitHubIcon } from '@/icons/GitHubIcon'

const personalFields: {
  key: keyof UpdateProfilePayload
  label: string
  icon: React.ReactNode
  emptyText: string
  splitName?: boolean
}[] = [
  {
    key: 'name',
    label: 'Name',
    icon: <User size={14} className="text-muted-foreground" />,
    emptyText: 'Add name...',
    splitName: true,
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail size={14} className="text-muted-foreground" />,
    emptyText: 'Add email...',
  },
  {
    key: 'phone',
    label: 'Phone',
    icon: <Phone size={14} className="text-muted-foreground" />,
    emptyText: 'Add phone...',
  },
  {
    key: 'address',
    label: 'Address',
    icon: <MapPin size={14} className="text-muted-foreground" />,
    emptyText: 'Add address...',
  },
]

const linkFields: {
  key: keyof UpdateProfilePayload
  label: string
  icon: React.ReactNode
  iconBg?: string
  emptyText: string
}[] = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <LinkedInIcon />,
    iconBg: 'bg-surface-raised',
    emptyText: 'Add link...',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: <GitHubIcon />,
    iconBg: 'bg-surface-raised',
    emptyText: 'Add link...',
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: <Globe size={14} className="text-muted-foreground" />,
    emptyText: 'Add link...',
  },
  {
    key: 'other_link',
    label: 'Other link',
    icon: <Link2 size={14} className="text-muted-foreground" />,
    emptyText: 'Add link...',
  },
]

export default function QuickCopy() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()
  const { mutate: updateProfile } = useUpdateProfile()
  const { data: templates = [] } = useCoverLetters()
  const { mutate: updateCoverLetterFile } = useUpdateCoverLetterFile()
  const { mutateAsync: deleteCoverLetterTemplate } =
    useDeleteCoverLetterTemplate()

  function handleProfileSave(
    field: keyof UpdateProfilePayload,
    value: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      updateProfile(
        { [field]: value || null },
        {
          onSuccess: () => resolve(),
          onError: (err) => {
            toast.error('Failed to save')
            reject(
              err instanceof Error ? err : new Error('Failed to save profile'),
            )
          },
        },
      )
    })
  }

  function handleFileUploaded(variation: 'formal' | 'light', path: string) {
    updateCoverLetterFile(
      { variation, file_url: path },
      { onError: () => toast.error('Failed to save file info') },
    )
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="flex-1 overflow-y-auto p-16 pb-6">
      <PageHeader
        title="Quick copy"
        subtitle="Click any filled field to copy. Click the pencil to edit."
      />

      <section className="mb-10">
        <h2 className="mb-2.5 text-[12px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Personal info
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {personalFields.map(({ key, label, icon, emptyText, splitName }) => (
            <CopyButton
              key={key}
              label={label}
              value={profile[key] ?? null}
              icon={icon}
              emptyText={emptyText}
              splitName={splitName}
              onSave={(value) => handleProfileSave(key, value)}
            />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-2.5 text-[12px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Links
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {linkFields.map(({ key, label, icon, iconBg, emptyText }) => (
            <CopyButton
              key={key}
              label={label}
              value={profile[key] ?? null}
              icon={icon}
              iconBg={iconBg}
              emptyText={emptyText}
              onSave={(value) => handleProfileSave(key, value)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-[12px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
          Files
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          <ResumeButton
            resumeUrl={profile.resume_url}
            userId={user.id}
            onUploaded={(path) => handleProfileSave('resume_url', path)}
            onRemoved={() =>
              updateProfile(
                { resume_url: null },
                {
                  onSuccess: () => toast.success('Resume removed'),
                  onError: () => toast.error('Failed to remove resume'),
                },
              )
            }
          />
          <div className="col-span-3">
            <CoverLetterCard
              templates={templates}
              userId={user.id}
              onFileUploaded={handleFileUploaded}
              onFileRemoved={async (variation) => {
                try {
                  await deleteCoverLetterTemplate(variation)
                  toast.success(
                    `${variation.charAt(0).toUpperCase() + variation.slice(1)} template removed`,
                  )
                } catch {
                  toast.error('Failed to remove template')
                }
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
