import { prisma } from '../../config/prisma'
import { z } from 'zod'

const TEMPLATE_VERSION = '1.0-minuta'

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const HEADER = `⚠️ MINUTA — PENDENTE DE REVISÃO JURÍDICA
Este documento é um rascunho gerado automaticamente e não possui validade
legal até revisão e aprovação por advogado responsável.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

function boutiqueContract(p: {
  contractId: string
  partnerName: string
  partnerDocument: string
  partnerEmail: string
  partnerAddress: string
  durationMonths: number
  generatedAt: Date
}): string {
  const endDate = addMonths(p.generatedAt, p.durationMonths)
  const durText = p.durationMonths === 6 ? 'seis' : 'doze'

  return `${HEADER}

CONTRATO DE PARCERIA COMERCIAL — AÇOUGUE (BOUTIQUE)
Tech Churras — Plataforma de Serviços de Churrasco

Versão: ${TEMPLATE_VERSION}
ID do Contrato: ${p.contractId}
Data de Geração: ${formatDate(p.generatedAt)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 1 — IDENTIFICAÇÃO DAS PARTES

CONTRATADA:
Razão Social: Tech Churras
CNPJ: 38.084.351/0001-09
E-mail: techchurras@gmail.com
Site: techchurras.com.br
Denominada neste instrumento como "TECH CHURRAS" ou "Plataforma".

CONTRATADO (PARCEIRO):
Nome / Razão Social: ${p.partnerName}
CPF / CNPJ: ${p.partnerDocument}
E-mail: ${p.partnerEmail}
Endereço: ${p.partnerAddress}
Denominado neste instrumento como "PARCEIRO" ou "Açougue".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 2 — OBJETO DO CONTRATO

2.1. O presente contrato estabelece os termos da parceria comercial entre a TECH CHURRAS e o PARCEIRO para disponibilização dos produtos do Açougue na plataforma digital Tech Churras (aplicativo e site techchurras.com.br).

2.2. A parceria permite ao PARCEIRO:
  a) Cadastrar e gerenciar catálogo de produtos (carnes, kits de churrasco e outros itens);
  b) Receber pedidos de clientes da plataforma;
  c) Utilizar o sistema de gestão, dashboard analítico e ferramentas de divulgação;
  d) Participar do programa de indicações e sistema de pontos fidelidade da plataforma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 3 — OBRIGAÇÕES DA TECH CHURRAS

A TECH CHURRAS se obriga a:
  a) Disponibilizar a plataforma ao PARCEIRO durante toda a vigência;
  b) Processar pagamentos dos clientes e realizar repasses conforme Cláusula 5;
  c) Fornecer suporte técnico e operacional;
  d) Divulgar o PARCEIRO na plataforma para clientes da região;
  e) Manter a segurança dos dados conforme a LGPD (Cláusula 9);
  f) Notificar com antecedência mínima de 30 dias sobre alterações relevantes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 4 — OBRIGAÇÕES DO PARCEIRO

O PARCEIRO se obriga a:
  a) Manter cadastro atualizado (dados, horários, cardápio, preços e disponibilidade);
  b) Cumprir pedidos recebidos dentro dos prazos acordados;
  c) Manter qualidade dos produtos conforme normas sanitárias vigentes;
  d) Atender clientes com respeito e profissionalismo;
  e) Informar à TECH CHURRAS inatividade superior a 7 dias com antecedência;
  f) Não praticar preços na plataforma superiores aos praticados no estabelecimento físico;
  g) Cumprir as Diretrizes de Uso da Marca Tech Churras ao divulgar a parceria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 5 — MODELO FINANCEIRO

5.1. MENSALIDADE
O PARCEIRO pagará à TECH CHURRAS mensalidade de R$ 369,00 (trezentos e sessenta e nove reais) por mês, correspondente ao acesso à plataforma e ferramentas disponibilizadas.

5.2. COMISSÃO
Sobre o valor bruto de todos os produtos vendidos via plataforma incidirá comissão de 7% (sete por cento) em favor da TECH CHURRAS, descontada no momento do repasse.

5.3. TAXA DE ADESÃO
Não há taxa de adesão. O ingresso à plataforma é isento de valor inicial.

5.4. FORMA E PERIODICIDADE DE REPASSE
Os valores líquidos de comissão serão repassados semanalmente via Pix, conforme agenda disponível em /admin/repasses. O PARCEIRO deve manter sua chave Pix atualizada no cadastro.

5.5. REAJUSTE
[A DEFINIR PELO JURÍDICO: condições e periodicidade de reajuste da mensalidade]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 6 — VIGÊNCIA E RENOVAÇÃO

6.1. Este contrato tem vigência de ${p.durationMonths} (${durText}) meses, com início na data de aceite eletrônico e término em ${formatDate(endDate)}.

6.2. O contrato se renova automaticamente por período idêntico, salvo notificação expressa de não-renovação com antecedência mínima de [A DEFINIR PELO JURÍDICO: prazo — sugestão: 30 dias].

6.3. A notificação de não-renovação deve ser enviada por escrito ao e-mail da outra parte.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 7 — RESCISÃO

7.1. O contrato poderá ser rescindido:
  a) Por mútuo acordo, a qualquer momento, mediante comunicação por escrito;
  b) Por qualquer das partes, com aviso prévio de [A DEFINIR PELO JURÍDICO: prazo — sugestão: 30 dias];
  c) De imediato pela TECH CHURRAS em caso de descumprimento grave, atos ilícitos ou conduta prejudicial à reputação da plataforma.

7.2. Rescisão antecipada por iniciativa do PARCEIRO antes do término do período contratado:
  [A DEFINIR PELO JURÍDICO: multa rescisória e condições]

7.3. Rescisão antecipada pela TECH CHURRAS sem justa causa:
  [A DEFINIR PELO JURÍDICO: condições de indenização ou reembolso proporcional]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 8 — PROPRIEDADE INTELECTUAL E USO DE MARCA

8.1. O PARCEIRO pode usar a marca "Tech Churras" exclusivamente para divulgar a parceria, mediante cumprimento das Diretrizes de Uso de Marca.

8.2. O uso da marca fora dessas condições ou após o término deste contrato é expressamente vedado.

8.3. Todos os direitos sobre a plataforma, software e propriedade intelectual da Tech Churras permanecem de titularidade exclusiva da TECH CHURRAS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 9 — PROTEÇÃO DE DADOS (LGPD)

9.1. As partes tratarão dados pessoais em conformidade com a Lei n.º 13.709/2018 (LGPD).

9.2. A TECH CHURRAS atuará como operadora dos dados dos clientes, processando-os exclusivamente para as finalidades deste contrato e conforme sua Política de Privacidade disponível em techchurras.com.br/politica-de-privacidade.

9.3. O PARCEIRO não utilizará dados pessoais de clientes para fins alheios à execução dos pedidos.

9.4. Em incidentes de segurança, a parte que tomar conhecimento notificará a outra em até 72 horas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 10 — DISPOSIÇÕES GERAIS

10.1. Este contrato representa o acordo integral entre as partes sobre seu objeto.

10.2. A tolerância ao descumprimento de qualquer cláusula não implica renúncia ao direito de exigir seu cumprimento futuro.

10.3. Caso qualquer cláusula seja declarada nula, as demais permanecerão em pleno vigor.

10.4. Foro e Legislação Aplicável: [A DEFINIR PELO JURÍDICO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACEITE ELETRÔNICO

Este instrumento é celebrado eletronicamente nos termos do art. 107 do Código Civil e da MP n.º 2.200-2/2001, com registro de:
  - Identificação: ${p.partnerEmail}
  - Data e hora de aceite: [registrado automaticamente]
  - Endereço IP: [registrado automaticamente]

⚠️ AVISO: Este contrato está em fase de revisão jurídica e pode ser atualizado antes do lançamento oficial da plataforma.`
}

function grillmasterContract(p: {
  contractId: string
  partnerName: string
  partnerDocument: string
  partnerEmail: string
  partnerAddress: string
  durationMonths: number
  generatedAt: Date
}): string {
  const endDate = addMonths(p.generatedAt, p.durationMonths)
  const durText = p.durationMonths === 6 ? 'seis' : 'doze'

  return `${HEADER}

CONTRATO DE PARCERIA — CHURRASQUEIRO (GRILLMASTER)
Tech Churras — Plataforma de Serviços de Churrasco

Versão: ${TEMPLATE_VERSION}
ID do Contrato: ${p.contractId}
Data de Geração: ${formatDate(p.generatedAt)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 1 — IDENTIFICAÇÃO DAS PARTES

CONTRATADA:
Razão Social: Tech Churras
CNPJ: 38.084.351/0001-09
E-mail: techchurras@gmail.com
Site: techchurras.com.br
Denominada neste instrumento como "TECH CHURRAS" ou "Plataforma".

CONTRATADO (PARCEIRO):
Nome: ${p.partnerName}
CPF: ${p.partnerDocument}
E-mail: ${p.partnerEmail}
Endereço: ${p.partnerAddress}
Denominado neste instrumento como "PARCEIRO" ou "Churrasqueiro".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 2 — OBJETO DO CONTRATO

2.1. Este contrato estabelece os termos da parceria entre a TECH CHURRAS e o PARCEIRO para disponibilização dos serviços profissionais de churrasqueiro na plataforma digital Tech Churras.

2.2. A parceria permite ao PARCEIRO:
  a) Divulgar seu perfil profissional (fotos, bio, especialidades) na plataforma;
  b) Receber pedidos de clientes para eventos de churrasco;
  c) Utilizar o sistema de gestão de agenda, pedidos e chat;
  d) Construir reputação por meio do sistema de avaliações.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 3 — OBRIGAÇÕES DA TECH CHURRAS

A TECH CHURRAS se obriga a:
  a) Disponibilizar a plataforma ao PARCEIRO durante toda a vigência;
  b) Conectar o PARCEIRO a clientes interessados em serviços de churrasco;
  c) Processar pagamentos dos clientes e realizar repasses conforme Cláusula 5;
  d) Fornecer suporte técnico e operacional;
  e) Manter a segurança dos dados conforme a LGPD (Cláusula 9);
  f) Notificar com antecedência mínima de 30 dias sobre alterações relevantes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 4 — OBRIGAÇÕES DO PARCEIRO

O PARCEIRO se obriga a:
  a) Manter perfil atualizado (disponibilidade, especialidades e preço por hora);
  b) Comparecer pontualmente aos eventos e cumprir os serviços agendados;
  c) Manter conduta profissional e respeitosa com clientes e demais parceiros;
  d) Possuir os equipamentos necessários conforme indicado em seu perfil;
  e) Informar à TECH CHURRAS indisponibilidade que impacte pedidos já confirmados;
  f) Não cobrar valores adicionais além do acordado na plataforma;
  g) Cumprir as Diretrizes de Uso da Marca Tech Churras ao divulgar a parceria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 5 — MODELO FINANCEIRO

5.1. MENSALIDADE
O acesso à plataforma é gratuito para churrasqueiros parceiros. Não há cobrança de mensalidade.

5.2. COMISSÃO
Sobre o valor da mão de obra cobrada em cada serviço realizado via plataforma incidirá comissão de 7% (sete por cento) em favor da TECH CHURRAS, descontada no momento do repasse.

5.3. TAXA DE ADESÃO
Não há taxa de adesão. O ingresso à plataforma é completamente gratuito.

5.4. FORMA E PERIODICIDADE DE REPASSE
Os valores líquidos de comissão serão repassados semanalmente via Pix. O PARCEIRO deve manter sua chave Pix atualizada no cadastro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 6 — VIGÊNCIA E RENOVAÇÃO

6.1. Este contrato tem vigência de ${p.durationMonths} (${durText}) meses, com início na data de aceite eletrônico e término em ${formatDate(endDate)}.

6.2. O contrato se renova automaticamente por período idêntico, salvo notificação expressa de não-renovação com antecedência mínima de [A DEFINIR PELO JURÍDICO: prazo — sugestão: 30 dias].

6.3. A notificação de não-renovação deve ser enviada por escrito ao e-mail da outra parte.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 7 — RESCISÃO

7.1. O contrato poderá ser rescindido:
  a) Por mútuo acordo, a qualquer momento, mediante comunicação por escrito;
  b) Por qualquer das partes, com aviso prévio de [A DEFINIR PELO JURÍDICO: prazo — sugestão: 30 dias];
  c) De imediato pela TECH CHURRAS em caso de descumprimento grave, atos ilícitos ou conduta prejudicial à reputação da plataforma.

7.2. Rescisão antecipada por iniciativa do PARCEIRO:
  [A DEFINIR PELO JURÍDICO: condições]

7.3. Rescisão antecipada pela TECH CHURRAS sem justa causa:
  [A DEFINIR PELO JURÍDICO: condições]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 8 — PROPRIEDADE INTELECTUAL E USO DE MARCA

8.1. O PARCEIRO pode usar a marca "Tech Churras" exclusivamente para divulgar a parceria, mediante cumprimento das Diretrizes de Uso de Marca.

8.2. O uso da marca fora dessas condições ou após o término deste contrato é expressamente vedado.

8.3. Todos os direitos sobre a plataforma, software e propriedade intelectual permanecem de titularidade exclusiva da TECH CHURRAS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 9 — PROTEÇÃO DE DADOS (LGPD)

9.1. As partes tratarão dados pessoais em conformidade com a Lei n.º 13.709/2018 (LGPD).

9.2. A TECH CHURRAS atuará como operadora dos dados dos clientes, processando-os exclusivamente para as finalidades deste contrato e conforme sua Política de Privacidade em techchurras.com.br/politica-de-privacidade.

9.3. O PARCEIRO não utilizará dados pessoais de clientes para fins alheios à execução dos serviços.

9.4. Em incidentes de segurança, a parte que tomar conhecimento notificará a outra em até 72 horas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLÁUSULA 10 — DISPOSIÇÕES GERAIS

10.1. Este contrato representa o acordo integral entre as partes sobre seu objeto.

10.2. A tolerância ao descumprimento não implica renúncia ao direito de exigir cumprimento futuro.

10.3. Caso qualquer cláusula seja declarada nula, as demais permanecerão em pleno vigor.

10.4. Foro e Legislação Aplicável: [A DEFINIR PELO JURÍDICO]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACEITE ELETRÔNICO

Este instrumento é celebrado eletronicamente nos termos do art. 107 do Código Civil e da MP n.º 2.200-2/2001, com registro de:
  - Identificação: ${p.partnerEmail}
  - Data e hora de aceite: [registrado automaticamente]
  - Endereço IP: [registrado automaticamente]

⚠️ AVISO: Este contrato está em fase de revisão jurídica e pode ser atualizado antes do lançamento oficial da plataforma.`
}

export const generateContractSchema = z.object({
  durationMonths: z.union([z.literal(6), z.literal(12)]),
  partnerDocument: z.string().min(11, 'Informe CPF ou CNPJ'),
  partnerAddress: z.string().optional(),
})

export type GenerateContractInput = z.infer<typeof generateContractSchema>

export async function generateContract(userId: string, data: GenerateContractInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      boutique: true,
      grillmaster: true,
    },
  })
  if (!user) throw new Error('Usuário não encontrado')

  let partnerId: string
  let partnerType: string
  let resolvedAddress: string

  if (user.boutique) {
    partnerId = user.boutique.id
    partnerType = 'BOUTIQUE'
    const b = user.boutique
    resolvedAddress = data.partnerAddress ||
      [b.address, b.city, b.state].filter(Boolean).join(', ') ||
      'Não informado'
  } else if (user.grillmaster) {
    partnerId = user.grillmaster.id
    partnerType = 'GRILLMASTER'
    const g = user.grillmaster
    resolvedAddress = data.partnerAddress ||
      [g.city, g.state].filter(Boolean).join(' — ') ||
      'Não informado'
  } else {
    throw new Error('Usuário não possui perfil de parceiro')
  }

  const existing = await prisma.contract.findFirst({
    where: { partnerId, status: 'ACCEPTED' },
  })
  if (existing) throw new Error('Já existe um contrato aceito para este parceiro')

  const generatedAt = new Date()

  const contractParams = {
    contractId: 'DRAFT',
    partnerName: user.name,
    partnerDocument: data.partnerDocument,
    partnerEmail: user.email,
    partnerAddress: resolvedAddress,
    durationMonths: data.durationMonths,
    generatedAt,
  }

  const draftText = partnerType === 'BOUTIQUE'
    ? boutiqueContract(contractParams)
    : grillmasterContract(contractParams)

  const contract = await prisma.contract.create({
    data: {
      partnerId,
      partnerType,
      durationMonths: data.durationMonths,
      status: 'PENDING_SIGNATURE',
      templateVersion: TEMPLATE_VERSION,
      contractText: draftText,
      partnerName: user.name,
      partnerDocument: data.partnerDocument,
      partnerEmail: user.email,
      partnerAddress: resolvedAddress,
      generatedAt,
    },
  })

  const finalText = partnerType === 'BOUTIQUE'
    ? boutiqueContract({ ...contractParams, contractId: contract.id })
    : grillmasterContract({ ...contractParams, contractId: contract.id })

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: { contractText: finalText },
  })

  return updated
}

export async function acceptContract(contractId: string, userId: string, ip: string, userAgent: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { boutique: true, grillmaster: true },
  })
  if (!user) throw new Error('Usuário não encontrado')

  const contract = await prisma.contract.findUnique({ where: { id: contractId } })
  if (!contract) throw new Error('Contrato não encontrado')

  const ownedId = user.boutique?.id ?? user.grillmaster?.id
  if (contract.partnerId !== ownedId) throw new Error('Sem permissão para aceitar este contrato')
  if (contract.status === 'ACCEPTED') throw new Error('Contrato já foi aceito')

  const acceptedText = contract.contractText
    .replace('[registrado automaticamente]', new Date().toISOString())
    .replace('[registrado automaticamente]', ip || 'não disponível')

  return prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptIp: ip || null,
      acceptUserAgent: userAgent || null,
      contractText: acceptedText,
    },
  })
}

export async function getMyContracts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { boutique: true, grillmaster: true },
  })
  if (!user) return []

  const partnerId = user.boutique?.id ?? user.grillmaster?.id
  if (!partnerId) return []

  return prisma.contract.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllContracts() {
  return prisma.contract.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getContractById(contractId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { boutique: true, grillmaster: true },
  })
  if (!user) throw new Error('Usuário não encontrado')

  const contract = await prisma.contract.findUnique({ where: { id: contractId } })
  if (!contract) throw new Error('Contrato não encontrado')

  const isAdmin = user.role === 'ADMIN'
  const ownedId = user.boutique?.id ?? user.grillmaster?.id
  if (!isAdmin && contract.partnerId !== ownedId) throw new Error('Sem permissão')

  return contract
}
