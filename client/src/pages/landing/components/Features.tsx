import type { ComponentType } from 'react'
import { BankIcon, CopyIcon, LetterIcon, TableIcon } from '../icons'

interface Tool {
  Icon: ComponentType<{ size?: number }>
  title: string
  description: string
  tags: string[]
}

const TOOLS: Tool[] = [
  {
    Icon: CopyIcon,
    title: 'Quick Copy',
    description:
      'Your details, links, and frequently used files — one click to copy exactly the right thing into any form.',
    tags: ['Personal info', 'Links', 'Files'],
  },
  {
    Icon: LetterIcon,
    title: 'Cover Letter Editor',
    description:
      'Start from your own templates, switch variations, and replace tokens automatically. Export a clean PDF.',
    tags: ['Templates', 'Token replace', 'PDF export'],
  },
  {
    Icon: BankIcon,
    title: 'Answer Bank',
    description:
      'Save short and long-form answers once, tag and search them, then drop the perfect response into any application in seconds.',
    tags: ['Searchable', 'Tagged', 'Quick insert'],
  },
  {
    Icon: TableIcon,
    title: 'Application Tracker',
    description:
      'Keep every role, status, location, and deadline in one organized table you actually maintain.',
    tags: ['Statuses', 'Deadlines', 'Custom views'],
  },
]

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head" style={{ maxWidth: 860 }}>
          <span className="kicker">The toolkit</span>
          <h2>Four tools. One workflow.</h2>
          <p style={{ textWrap: 'balance' }}>
            Everything repetitive about applying to jobs — handled. You still
            control every application.
          </p>
        </div>
        <div className="feat-grid">
          {TOOLS.map(({ Icon, title, description, tags }) => (
            <div className="feat-card" key={title}>
              <div className="ficon accent">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="feat-tags">
                {tags.map((tag) => (
                  <span className="feat-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
