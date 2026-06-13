import { useState } from 'react'
import type { ReactNode } from 'react'

interface FaqItem {
  question: string
  answer: ReactNode
}

const ITEMS: FaqItem[] = [
  {
    question: 'Is joolkit an auto-apply bot?',
    answer:
      'No. joolkit removes the repetitive work — copying your details, reusing answers, tracking status — but you write and submit every application yourself. Nothing is ever sent on your behalf.',
  },
  {
    question: 'Does it write my cover letters with AI?',
    answer:
      'No. You work from your own templates with variations and token replacement. You stay in control of every word. We may add optional AI helpers down the line, never opaque auto-apply.',
  },
  {
    question: 'Is my data private?',
    answer: (
      <>
        Your applications and answers belong to you. Your data is securely
        stored using state-of-the-art, reputable database services. And because
        joolkit is open-source, you can see exactly how your data is handled in
        our{' '}
        <a
          href="https://github.com/vitorwtavares/joolkit"
          target="_blank"
          rel="noopener"
        >
          transparent open-source code
        </a>
        .
      </>
    ),
  },
  {
    question: 'Why desktop-first?',
    answer:
      'Applying is focused, keyboard-heavy work. joolkit is built for a real desk session where you move quickly between copying details, tailoring a letter, and updating your board.',
  },
  {
    question: 'Can I export my cover letters?',
    answer:
      'Yes — clean PDF export is built in, with token substitution and template variations so each letter comes out tailored to the role.',
  },
  {
    question: 'What do I get on the free plan?',
    answer:
      'Plenty to run a real search: unlimited Quick Copy, 50 tracked applications, an Answer Bank with up to 4 answers, 1 cover-letter and 1 resume variation, and 2 PDF exports per day. Upgrade to Pro when you need more headroom.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. No lock-in and no cancellation fees — downgrade to Free whenever you like. You keep Pro until the end of the period you already paid for.',
  },
  {
    question: 'Can I delete my account and data?',
    answer:
      'Yes. You can delete your account at any time, and all data associated with it — personal details, files, answers, and applications — is deleted along with it.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="kicker">FAQ</span>
          <h2>Questions, answered.</h2>
        </div>
        <div className="faq-wrap">
          {ITEMS.map((item, i) => (
            <div
              className={'faq-item' + (open === i ? ' open' : '')}
              key={item.question}
            >
              <button
                className="faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{item.question}</span>
                <svg className="faq-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    className="vbar"
                    d="M12 5v14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div
                className="faq-a"
                style={{ maxHeight: open === i ? 340 : 0 }}
              >
                <div className="faq-a-inner">{item.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
