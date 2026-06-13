import LegalPage from './LegalPage'
import { privacyEn } from './content/privacy.en'
import { privacyPt } from './content/privacy.pt'

export default function PrivacyPolicy() {
  return <LegalPage en={privacyEn} pt={privacyPt} />
}
