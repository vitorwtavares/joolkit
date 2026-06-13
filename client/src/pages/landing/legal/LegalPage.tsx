import { useEffect, useState, type ReactNode } from 'react'
import '../landing.css'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import type { LegalDoc, Lang } from './types'

interface LegalPageProps {
  en: LegalDoc
  pt: LegalDoc
}

// Minimal inline formatter: supports **bold** and [label](url) only — enough for
// the legal copy, without pulling in a markdown dependency.
function renderInline(text: string): ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>)
    } else {
      const label = match[2]
      const href = match[3]
      const external = href.startsWith('http')
      nodes.push(
        <a
          key={key++}
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
        >
          {label}
        </a>,
      )
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

function detectLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'
  }
  return 'en'
}

export default function LegalPage({ en, pt }: LegalPageProps) {
  const [lang, setLang] = useState<Lang>(detectLang)
  const doc = lang === 'pt' ? pt : en

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${doc.title} · joolkit`
  }, [doc.title])

  const updatedLabel = lang === 'pt' ? 'Vigente a partir de' : 'Effective'

  return (
    <div className="page" data-herovis="full">
      <Nav />
      <main className="legal">
        <div className="legal-inner container">
          <div className="legal-head">
            <div
              className="legal-lang"
              role="group"
              aria-label={lang === 'pt' ? 'Idioma' : 'Language'}
            >
              <button
                type="button"
                className={
                  'legal-lang-btn' + (lang === 'en' ? ' is-active' : '')
                }
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={
                  'legal-lang-btn' + (lang === 'pt' ? ' is-active' : '')
                }
                aria-pressed={lang === 'pt'}
                onClick={() => setLang('pt')}
              >
                PT
              </button>
            </div>
            <h1>{doc.title}</h1>
            <p className="legal-date">
              {updatedLabel} {doc.effectiveDate}
            </p>
          </div>

          <div className="legal-intro">
            {doc.intro.map((p, i) => (
              <p key={i}>{renderInline(p)}</p>
            ))}
          </div>

          {doc.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.blocks.map((block, i) => {
                if (block.kind === 'sub') {
                  return (
                    <h3 className="legal-sub" key={i}>
                      {block.text}
                    </h3>
                  )
                }
                if (block.kind === 'list') {
                  return (
                    <ul key={i}>
                      {block.items.map((item, j) => (
                        <li key={j}>{renderInline(item)}</li>
                      ))}
                    </ul>
                  )
                }
                return <p key={i}>{renderInline(block.text)}</p>
              })}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
