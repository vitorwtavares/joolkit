import { Link } from 'react-router'
import mark from '../assets/joolkit-mark.svg'

export default function FinalCTA() {
  return (
    <section className="section" id="cta" style={{ paddingBottom: 0 }}>
      <div className="container">
        <div className="final">
          <div className="final-glow" />
          <img className="final-mark" src={mark} alt="" />
          <span className="kicker">Get started</span>
          <h2>
            Take control of your
            <br />
            job search.
          </h2>
          <p>
            A complete toolbox for the repetitive parts of applying. Free to
            start, no card required.
          </p>
          <div className="cta-row" style={{ marginTop: 30 }}>
            <Link className="btn btn-primary btn-lg" to="/sign-up">
              Try joolkit free
            </Link>
            <a className="btn btn-ghost btn-lg" href="#pricing">
              See pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
