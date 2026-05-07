import { TextCell } from '../cells/TextCell'
import { EnumCell } from '../cells/EnumCell'
import { DateCell } from '../cells/DateCell'
import { LocationCell } from '../cells/LocationCell'
import { SkillsCell } from '../cells/SkillsCell'
import { EmptyCell } from '../cells/EmptyCell'
import { Field } from './Field'
import { WORK_STYLE_OPTIONS, VISA_OPTIONS, VISA_COLORS } from '../enumOptions'
import type { Application } from '@/api/hooks/useApplications'
import type { CreateApplicationPayload } from '@/api/hooks/useApplications'

interface DrawerMetaFieldsProps {
  app: Application
  save: (fields: CreateApplicationPayload) => void
}

export function DrawerMetaFields({ app, save }: DrawerMetaFieldsProps) {
  const visaColor = app.visa_support ? VISA_COLORS[app.visa_support] : undefined

  return (
    <div className="flex-shrink-0 border-b border-border-subtle px-16 py-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        <Field label="Job link">
          <TextCell
            value={app.job_url}
            url={app.job_url}
            linkClassName="text-info hover:text-info/80"
            onSave={(v) => save({ job_url: v })}
          />
        </Field>
        <Field label="Careers page link">
          <TextCell
            value={app.careers_url}
            url={app.careers_url}
            linkClassName="text-info hover:text-info/80"
            onSave={(v) => save({ careers_url: v })}
          />
        </Field>
        <Field label="Location">
          <LocationCell
            value={app.location}
            onSave={(locationId) => save({ location_id: locationId })}
          />
        </Field>
        <Field label="Work style">
          <EnumCell
            value={app.work_style}
            options={WORK_STYLE_OPTIONS}
            onSave={(v) => save({ work_style: v })}
          />
        </Field>
        <Field label="Salary">
          <TextCell value={app.salary} onSave={(v) => save({ salary: v })} />
        </Field>
        <Field label="Visa support">
          <EnumCell
            value={app.visa_support}
            options={VISA_OPTIONS}
            renderDisplay={(v) =>
              v == null ? (
                <EmptyCell />
              ) : (
                <span style={{ color: visaColor }}>
                  {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unknown'}
                </span>
              )
            }
            onSave={(v) => save({ visa_support: v })}
          />
        </Field>
        <Field label="Date applied">
          <DateCell
            value={app.date_applied}
            onSave={(v) => save({ date_applied: v })}
            extended
          />
        </Field>
        <Field label="Next deadline">
          <DateCell
            value={app.next_deadline}
            onSave={(v) => save({ next_deadline: v })}
            extended
          />
        </Field>
        <Field label="Skills" className="col-span-2">
          <SkillsCell
            value={app.skills ?? []}
            onSave={(skillIds) => save({ skill_ids: skillIds })}
          />
        </Field>
      </div>
    </div>
  )
}
