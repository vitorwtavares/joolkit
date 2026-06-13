import type { LegalDoc } from '../types'
import { LEGAL_INFO, contactLink } from '../info'

export const privacyPt: LegalDoc = {
  title: 'Política de Privacidade',
  effectiveDate: LEGAL_INFO.effectiveDate.pt,
  intro: [
    'Criamos o joolkit para tirar o trabalho repetitivo das candidaturas a vagas — não para coletar seus dados. Esta política explica, de forma simples, o que coletamos, por quê e qual o controle que você tem sobre isso.',
    'Resumindo: só guardamos o necessário para o produto funcionar, nunca vendemos seus dados, você pode excluir sua conta e tudo o que ela contém a qualquer momento, e pode solicitar uma cópia dos seus dados quando quiser.',
  ],
  sections: [
    {
      heading: '1. Quem somos',
      blocks: [
        {
          kind: 'p',
          text: `O joolkit é operado por **${LEGAL_INFO.companyName}**, empresa registrada no Brasil sob o CNPJ **${LEGAL_INFO.cnpj}** ("joolkit", "nós").`,
        },
        {
          kind: 'p',
          text: `Para qualquer dúvida sobre privacidade, ou para exercer seus direitos, fale conosco em ${contactLink}. Respondemos em até 15 dias, conforme exige a Lei Geral de Proteção de Dados (LGPD).`,
        },
      ],
    },
    {
      heading: '2. O que coletamos',
      blocks: [
        { kind: 'sub', text: 'Informações que você nos fornece' },
        {
          kind: 'list',
          items: [
            '**Dados da conta** — seu e-mail e senha. As senhas são armazenadas de forma criptografada pelo nosso provedor de autenticação; nunca as vemos em texto puro.',
            '**Perfil e Quick Copy** — tudo o que você opta por salvar para reutilizar: nome, e-mail, telefone, endereço, links (LinkedIn, GitHub, portfólio, outros) e arquivos de currículo que você enviar.',
            '**Seu conteúdo de candidatura** — modelos e variações de carta de apresentação, respostas reutilizáveis, entradas no tracker (nomes de empresa e cargo, status, notas, prazos, habilidades, localizações) e quaisquer tokens que você definir.',
          ],
        },
        { kind: 'sub', text: 'Informações de pagamento' },
        {
          kind: 'p',
          text: 'Ao assinar o Pro, o pagamento é processado pela Stripe. O joolkit nunca recebe nem armazena o número completo do seu cartão. Guardamos apenas os metadados de cobrança devolvidos pela Stripe — um identificador de cliente e de assinatura, seu plano, status, periodicidade, moeda e data de renovação.',
        },
        { kind: 'sub', text: 'Informações coletadas automaticamente' },
        {
          kind: 'p',
          text: 'Para manter o serviço seguro e funcionando, processamos dados técnicos básicos como seu endereço IP — usado, por exemplo, para exibir preços na sua moeda local e para limitar requisições abusivas — e registros (logs) padrão do servidor. Na data de vigência acima, não usamos ferramentas de analytics, publicidade ou rastreamento comportamental de terceiros; se isso mudar, atualizaremos esta política (incluindo a seção de Cookies abaixo) antes.',
        },
      ],
    },
    {
      heading: '3. Por que usamos seus dados e nossa base legal',
      blocks: [
        {
          kind: 'p',
          text: 'Tratamos seus dados para: fornecer e operar os recursos que você usa (execução do contrato com você); processar pagamentos e gerenciar sua assinatura (contrato); manter o serviço seguro e prevenir abusos (legítimo interesse); cumprir obrigações legais; e responder às suas solicitações. Quando a lei exigir consentimento, nós o solicitamos antes.',
        },
      ],
    },
    {
      heading: '4. Cookies',
      blocks: [
        {
          kind: 'p',
          text: 'Usamos apenas os cookies essenciais necessários para manter você conectado e operar o serviço. Atualmente não usamos cookies de publicidade ou analytics. Se introduzirmos ferramentas de analytics para entender melhor como nosso site é usado, atualizaremos esta seção — e solicitaremos seu consentimento antes, sempre que a lei exigir.',
        },
      ],
    },
    {
      heading: '5. Com quem compartilhamos',
      blocks: [
        {
          kind: 'p',
          text: 'Não vendemos seus dados pessoais e não os compartilhamos para publicidade. Contamos com um pequeno número de provedores confiáveis ("suboperadores") estritamente para operar o joolkit:',
        },
        {
          kind: 'list',
          items: [
            '**Supabase** — banco de dados, autenticação e armazenamento de arquivos (hospeda sua conta e conteúdo).',
            '**Stripe** — processamento de pagamentos e cobrança de assinaturas.',
            '**Vercel** — hospedagem da aplicação e entrega de conteúdo.',
          ],
        },
        {
          kind: 'p',
          text: 'Esses provedores tratam dados em nosso nome sob seus próprios compromissos de segurança e privacidade. Também podemos divulgar dados se exigido por lei ou para proteger nossos direitos e nossos usuários.',
        },
      ],
    },
    {
      heading: '6. Transferências internacionais de dados',
      blocks: [
        {
          kind: 'p',
          text: 'Nossos provedores podem armazenar e tratar dados em servidores fora do Brasil (por exemplo, nos Estados Unidos). Quando isso ocorre, apoiamo-nos nas salvaguardas de transferência oferecidas por esses provedores e nas bases legais permitidas pela LGPD e, quando aplicável, pelo GDPR.',
        },
      ],
    },
    {
      heading: '7. Por quanto tempo guardamos',
      blocks: [
        {
          kind: 'p',
          text: 'Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, apagamos seus dados pessoais e arquivos enviados dos nossos sistemas — exceto quando precisarmos reter registros limitados para cumprir obrigações legais, fiscais ou contábeis.',
        },
      ],
    },
    {
      heading: '8. Seus direitos',
      blocks: [
        {
          kind: 'p',
          text: `Pela LGPD (e pelo GDPR quando aplicável) você pode: acessar os dados que temos sobre você; corrigir dados incorretos; excluir seus dados; exportar uma cópia; opor-se ou restringir certos tratamentos; e revogar o consentimento quando o tratamento se basear nele. Você pode fazer a maior parte disso no aplicativo, ou enviar um e-mail para ${contactLink} e nós ajudamos em até 15 dias. Você também tem o direito de reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
        },
      ],
    },
    {
      heading: '9. Segurança',
      blocks: [
        {
          kind: 'p',
          text: 'Protegemos seus dados com criptografia em trânsito, controles de acesso e provedores de infraestrutura reconhecidos. Nenhum sistema é perfeitamente seguro, mas trabalhamos para manter suas informações seguras e notificaremos você e as autoridades sobre uma violação quando a lei exigir.',
        },
      ],
    },
    {
      heading: '10. Crianças',
      blocks: [
        {
          kind: 'p',
          text: 'O joolkit não é direcionado a crianças. Você deve ter pelo menos 18 anos, ou de outra forma ter capacidade legal para celebrar um contrato, para utilizá-lo.',
        },
      ],
    },
    {
      heading: '11. Alterações nesta política',
      blocks: [
        {
          kind: 'p',
          text: 'Se fizermos alterações materiais, atualizaremos esta página e a "data de vigência" acima, e avisaremos você quando apropriado. Continuar usando o joolkit após uma alteração significa que você aceita a política atualizada.',
        },
      ],
    },
    {
      heading: '12. Contato',
      blocks: [
        {
          kind: 'p',
          text: `Dúvidas, solicitações ou preocupações? Envie um e-mail para ${contactLink}. Controlador: **${LEGAL_INFO.companyName}**, CNPJ **${LEGAL_INFO.cnpj}**, Brasil.`,
        },
      ],
    },
  ],
}
