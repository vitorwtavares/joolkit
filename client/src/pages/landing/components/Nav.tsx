import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import logoLight from '../assets/joolkit-horizontal-light.png'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="nav-inner container">
        <a href="#top">
          <img className="nav-logo" src={logoLight} alt="joolkit" />
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="nav-right">
          <Link className="nav-login" to="/sign-in">
            Log in
          </Link>
          <Link className="btn btn-primary" to="/sign-up">
            Try joolkit free
          </Link>
        </div>
      </div>
    </nav>
  )
}
