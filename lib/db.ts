import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy proxy: PrismaClient는 실제 DB 호출 시점에만 생성됨 (빌드 타임 제외)
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient()
    const value = client[prop as keyof PrismaClient]
    return typeof value === 'function' ? (value as (...args: any[]) => any).bind(client) : value
  },
})
