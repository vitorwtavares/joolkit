import type { LegalDoc } from '../types'
import { LEGAL_INFO, contactLink } from '../info'

export const termsPt: LegalDoc = {
  title: 'Termos de Serviço',
  effectiveDate: LEGAL_INFO.effectiveDate.pt,
  intro: [
    'Estes termos são o acordo entre você e o joolkit. Nós os mantivemos legíveis de propósito: o joolkit ajuda você a fazer suas próprias candidaturas mais rápido, e estes termos explicam o que você pode esperar de nós e o que esperamos de você.',
    'Ao criar uma conta ou usar o joolkit, você concorda com estes termos e com nossa Política de Privacidade.',
  ],
  sections: [
    {
      heading: '1. Quem somos',
      blocks: [
        {
          kind: 'p',
          text: `O joolkit é operado por **${LEGAL_INFO.companyName}**, empresa registrada no Brasil sob o CNPJ **${LEGAL_INFO.cnpj}** ("joolkit", "nós").`,
        },
      ],
    },
    {
      heading: '2. Elegibilidade e sua conta',
      blocks: [
        {
          kind: 'p',
          text: `Você deve ter pelo menos 18 anos, ou de outra forma ter capacidade legal para celebrar um contrato. Você é responsável por manter seu login seguro e por tudo o que acontece na sua conta. Avise-nos em ${contactLink} se notar uso não autorizado.`,
        },
      ],
    },
    {
      heading: '3. O que o joolkit faz',
      blocks: [
        {
          kind: 'p',
          text: 'O joolkit é um espaço de trabalho para gerenciar suas próprias candidaturas: Quick Copy de dados pessoais, modelos de carta de apresentação com substituição de tokens e exportação em PDF, um banco de respostas reutilizáveis e um tracker de candidaturas. O uso desses recursos está sujeito aos limites do seu plano, conforme exibido na nossa página de preços. O joolkit não é um site de vagas, não se candidata às vagas por você e não gera conteúdo de candidatura com IA — você mantém o controle da sua própria escrita.',
        },
      ],
    },
    {
      heading: '4. Seu conteúdo',
      blocks: [
        {
          kind: 'p',
          text: 'Você é dono de tudo o que cria ou envia no joolkit. Não reivindicamos a propriedade desse conteúdo. Você nos concede apenas a licença limitada necessária para armazenar, processar e exibir seu conteúdo, de modo que possamos prestar o serviço a você. Você é responsável pelo conteúdo que insere e por ter o direito de usá-lo.',
        },
      ],
    },
    {
      heading: '5. Uso aceitável',
      blocks: [
        { kind: 'p', text: 'Por favor, não use o joolkit para:' },
        {
          kind: 'list',
          items: [
            'violar a lei ou os direitos de terceiros;',
            'enviar malware ou código malicioso;',
            'tentar quebrar, sobrecarregar, raspar (scraping) ou fazer engenharia reversa do serviço;',
            'revender ou oferecer o joolkit a terceiros como um serviço hospedado ou gerenciado (veja nossa licença); ou',
            'prejudicar, assediar ou enganar outras pessoas.',
          ],
        },
        {
          kind: 'p',
          text: 'Podemos suspender ou limitar contas que façam qualquer uma dessas coisas.',
        },
      ],
    },
    {
      heading: '6. Planos, cobrança e renovações',
      blocks: [
        { kind: 'sub', text: 'Free e Pro' },
        {
          kind: 'p',
          text: 'O joolkit oferece um plano Free e um plano pago Pro. O Free tem limites de uso; o Pro aumenta esses limites. Os recursos e preços atuais são exibidos na nossa página de preços.',
        },
        { kind: 'sub', text: 'Pagamento e renovação' },
        {
          kind: 'p',
          text: 'O Pro é uma assinatura recorrente cobrada pela Stripe na periodicidade que você escolher (por exemplo, mensal ou trimestral). Ela renova automaticamente ao fim de cada período até você cancelar. Os preços são exibidos antes do pagamento; se alterarmos os preços, o novo valor passa a valer a partir da sua próxima renovação.',
        },
        { kind: 'sub', text: 'Cancelamento e reembolsos' },
        {
          kind: 'p',
          text: 'Você pode cancelar a qualquer momento nas configurações de cobrança. Ao cancelar, você mantém o Pro até o fim do período que já pagou e depois passa para o Free — não cobramos novamente e não fazemos reembolso proporcional da parte não utilizada de um período.',
        },
        {
          kind: 'p',
          text: `**Direito de arrependimento:** por ser vendido pela internet, nos termos do artigo 49 do Código de Defesa do Consumidor (CDC), você pode cancelar uma nova compra em até 7 dias e receber o reembolso integral. Envie um e-mail para ${contactLink} em até 7 dias após a compra para exercer esse direito.`,
        },
        { kind: 'sub', text: 'Downgrades' },
        {
          kind: 'p',
          text: 'Se você mudar do Pro para o Free e estiver acima dos limites do Free, seus itens excedentes não são apagados — eles ficam guardados com segurança e ocultos, e são restaurados se você assinar o Pro novamente.',
        },
      ],
    },
    {
      heading: '7. Disponibilidade e alterações',
      blocks: [
        {
          kind: 'p',
          text: 'Trabalhamos para manter o joolkit funcionando bem, mas não prometemos que ele estará sempre disponível ou livre de erros. Podemos adicionar, alterar ou remover recursos ao longo do tempo. Se planejarmos descontinuar o serviço, daremos aviso razoável para que você possa exportar seus dados.',
        },
      ],
    },
    {
      heading: '8. Propriedade intelectual',
      blocks: [
        {
          kind: 'p',
          text: 'O nome, a marca e o software joolkit pertencem a nós ou aos nossos licenciadores. O código-fonte é disponibilizado sob a [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license) — você pode visualizá-lo e aprender com ele, mas não pode oferecê-lo como um serviço hospedado ou gerenciado. Estes termos não lhe concedem qualquer direito sobre nossas marcas.',
        },
      ],
    },
    {
      heading: '9. Isenção de garantias',
      blocks: [
        {
          kind: 'p',
          text: 'O joolkit é fornecido "no estado em que se encontra" e "conforme disponível", sem garantias de qualquer tipo, na medida permitida por lei. Não garantimos nenhum resultado específico com o uso — por exemplo, conseguir um emprego ou uma entrevista.',
        },
      ],
    },
    {
      heading: '10. Limitação de responsabilidade',
      blocks: [
        {
          kind: 'p',
          text: 'Na máxima extensão permitida por lei, o joolkit não será responsável por danos indiretos, incidentais ou consequenciais, nem por perda de dados, lucros ou oportunidades. Nossa responsabilidade total por qualquer reclamação relativa ao serviço limita-se ao valor que você nos pagou por ele nos 12 meses anteriores à reclamação. Nada aqui limita responsabilidades que não podem ser limitadas por lei, incluindo seus direitos sob o Código de Defesa do Consumidor.',
        },
      ],
    },
    {
      heading: '11. Encerramento',
      blocks: [
        {
          kind: 'p',
          text: 'Você pode parar de usar o joolkit e excluir sua conta a qualquer momento. Podemos suspender ou encerrar seu acesso se você violar estes termos ou a lei. Quando uma conta é encerrada, seus dados são tratados conforme descrito na Política de Privacidade.',
        },
      ],
    },
    {
      heading: '12. Lei aplicável e disputas',
      blocks: [
        {
          kind: 'p',
          text: `Estes termos são regidos pelas leis do Brasil. Se você for consumidor, pode levar disputas ao foro do seu próprio domicílio, conforme garantido pelo Código de Defesa do Consumidor. Preferimos sempre resolver as coisas diretamente primeiro — envie um e-mail para ${contactLink}.`,
        },
      ],
    },
    {
      heading: '13. Alterações nestes termos',
      blocks: [
        {
          kind: 'p',
          text: 'Podemos atualizar estes termos. Alteraremos a "data de vigência" acima e, para alterações materiais, avisaremos você quando apropriado. Continuar usando o joolkit significa que você aceita os termos atualizados.',
        },
      ],
    },
    {
      heading: '14. Contato',
      blocks: [
        {
          kind: 'p',
          text: `Envie um e-mail para ${contactLink}. Operador: **${LEGAL_INFO.companyName}**, CNPJ **${LEGAL_INFO.cnpj}**, Brasil.`,
        },
      ],
    },
  ],
}
