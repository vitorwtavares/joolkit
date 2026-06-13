export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'list'; items: string[] }

export interface LegalSection {
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  title: string
  effectiveDate: string
  // Plain-language summary shown above the formal sections.
  intro: string[]
  sections: LegalSection[]
}

export type Lang = 'en' | 'pt'
