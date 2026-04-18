import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.usuario.findMany()
  console.log(JSON.stringify(users, null, 2))
}
main().finally(() => prisma.$disconnect())
