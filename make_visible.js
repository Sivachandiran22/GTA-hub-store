const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.product.update({
    where: { slug: 'master-thalapathy-vijay-ped' },
    data: { isVisible: true }
  });
  console.log('UPDATED PRODUCT TO VISIBLE:', updated.title, 'isVisible:', updated.isVisible);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
