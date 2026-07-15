const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findUnique({
    where: { slug: 'master-thalapathy-vijay-ped' }
  });
  console.log('PRODUCT NAME:', p.title);
  console.log('PRODUCT ZIP URL:', p.zipUrl);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
