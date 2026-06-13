import logoLight from '../assets/joolkit-horizontal-light.png'

interface FooterColumn {
  heading: string
  links: { label: string; href: string }[]
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Contact', href: 'mailto:contact@joolkit.com' },
      { label: 'GitHub', href: 'https://github.com/vitorwtavares/joolkit' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={logoLight} alt="joolkit" />
            <p>
              The job application toolkit.
              <br />
              Less repetition, more control.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 joolkit. All rights reserved.</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              whiteSpace: 'nowrap',
            }}
          >
            Made in Brazil <span style={{ fontSize: 15 }}>🇧🇷</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
