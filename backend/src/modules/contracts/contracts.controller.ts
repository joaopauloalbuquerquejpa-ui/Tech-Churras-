import { FastifyRequest, FastifyReply } from 'fastify'
import {
  generateContract,
  generateContractSchema,
  acceptContract,
  getMyContracts,
  getAllContracts,
  getContractById,
} from './contracts.service'

export async function generateContractHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const data = generateContractSchema.parse(req.body)
    const contract = await generateContract(userId, data)
    return reply.status(201).send(contract)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function acceptContractHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { id } = req.params as { id: string }
    const ip = req.headers['x-forwarded-for'] as string || req.ip || ''
    const ua = req.headers['user-agent'] || ''
    const contract = await acceptContract(id, userId, ip, ua)
    return reply.send(contract)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getMyContractsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const contracts = await getMyContracts(userId)
    return reply.send(contracts)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getAllContractsHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (req as any).user
    if (user.role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' })
    const contracts = await getAllContracts()
    return reply.send(contracts)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}

export async function getContractByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { id } = req.params as { id: string }
    const contract = await getContractById(id, userId)
    return reply.send(contract)
  } catch (err: any) {
    return reply.status(400).send({ error: err.message })
  }
}
