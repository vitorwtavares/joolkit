import LegalPage from './LegalPage'
import { termsEn } from './content/terms.en'
import { termsPt } from './content/terms.pt'

export default function TermsOfService() {
  return <LegalPage en={termsEn} pt={termsPt} />
}
