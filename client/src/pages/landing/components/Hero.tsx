import { appUrl } from '../appUrl'
import { BankIcon, CheckIcon, CopyIcon } from '../icons'
import TrackerBoard from './TrackerBoard'

function tint(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero-glow" />
      <div className="hero-grid" />
      <div className="container">
        <span className="eyebrow">The job application toolkit</span>
        <h1>
          Every application,
          <br />
          under your control.
        </h1>
        <p className="lede">
          joolkit brings the repetitive parts of job hunting into one
          streamlined workspace — apply faster without retyping, and without
          handing your applications to an opaque auto-apply bot.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary btn-lg" href={appUrl('/sign-up')}>
            Try joolkit free
          </a>
          <a className="btn btn-ghost btn-lg" href="#how">
            See how it works
          </a>
        </div>
        <div className="trust mono">
          Free to start · Desktop-first · No card required
        </div>

        <div className="hero-stage">
          <div
            className="float-chip"
            style={{ top: -47, left: -36, animationDelay: '0s' }}
          >
            <span
              className="fc-ico"
              style={{ background: tint('#4a8cf0', 18), color: '#4a8cf0' }}
            >
              <CopyIcon size={17} />
            </span>
            <span>
              <span className="fc-t">Copied to clipboard</span>
              <span className="fc-s">Portfolio · LinkedIn · Email</span>
            </span>
          </div>
          <div
            className="float-chip"
            style={{ top: 132, right: -52, animationDelay: '1.4s' }}
          >
            <span
              className="fc-ico"
              style={{ background: tint('#56b27e', 20), color: '#56b27e' }}
            >
              <CheckIcon size={17} color="#56b27e" />
            </span>
            <span>
              <span className="fc-t">Cover letter exported</span>
              <span className="fc-s mono">Joolkit_DesignEng.pdf</span>
            </span>
          </div>
          <div
            className="float-chip"
            style={{ bottom: -26, left: 70, animationDelay: '2.6s' }}
          >
            <span
              className="fc-ico"
              style={{ background: tint('#b06ae0', 20), color: '#b06ae0' }}
            >
              <BankIcon size={17} />
            </span>
            <span>
              <span className="fc-t">Answer reused</span>
              <span className="fc-s">“Why this role?” · Answer Bank</span>
            </span>
          </div>
          <TrackerBoard />
        </div>
      </div>
    </header>
  )
}
