import './landing.css'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import Faq from './components/Faq'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <div className="page" data-herovis="full">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
      <FinalCTA />
      <Footer />
    </div>
  )
}
