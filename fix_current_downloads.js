const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.product.update({
    where: { slug: 'master-thalapathy-vijay-ped' },
    data: { downloadsCount: 2 }
  });
  console.log('UPDATED PRODUCT DOWNLOADS COUNT:', updated.title, 'downloadsCount:', updated.downloadsCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
