import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL

  if (!adminEmail) {
    console.log('INITIAL_ADMIN_EMAIL não definido, pulando seed.')
    return
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.ADMIN, isActive: true },
    create: {
      email: adminEmail,
      username: adminEmail,
      name: 'Administrador',
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  console.log(`Admin configurado: ${adminEmail}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
