
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.user.update({
  where: { email: 'joao@teste.com' },
  data: { role: 'ADMIN' }
}).then(r => console.log('OK', r.role)).finally(() => p.$disconnect())