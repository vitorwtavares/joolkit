import type { ReactNode } from 'react'

interface Step {
  title: string
  description: string
  illo: ReactNode
}

const STEPS: Step[] = [
  {
    title: 'Set up your kit once',
    description:
      'Add your details, links, reusable answers, and cover-letter templates. A few minutes, one time.',
    illo: (
      <div className="illo-stack">
        <i />
        <i />
        <i />
      </div>
    ),
  },
  {
    title: 'Apply faster',
    description:
      'Copy the right info and tailor a cover letter in seconds with token replacement. No more retyping.',
    illo: (
      <div className="illo-token">
        <span className="tk tk-a">{'{{company}}'}</span>
        <span className="tk tk-b">Northwind</span>
      </div>
    ),
  },
  {
    title: 'Track everything',
    description:
      'Log each role and keep statuses, deadlines, and notes in one organized table.',
    illo: (
      <div className="illo-status">
        <b className="b1">Prospect</b>
        <b className="b2">Applied</b>
        <b className="b3">Offer</b>
      </div>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section
      className="section"
      id="how"
      style={{
        background: 'var(--bg-2)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="container">
        <div className="section-head">
          <span className="kicker">How it works</span>
          <h2>From scattered to in control.</h2>
          <p>
            Three steps. No bots applying on your behalf — just less busywork.
          </p>
        </div>
        <div className="steps">
          {STEPS.map((step, i) => (
            <div className="step" key={step.title}>
              <div className="step-illo">
                <span className="ix mono">{'0' + (i + 1)}</span>
                {step.illo}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
