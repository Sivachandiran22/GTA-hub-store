const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.product.update({
    where: { slug: 'master-thalapathy-vijay-ped' },
    data: { isFeatured: true }
  });
  console.log('UPDATED PRODUCT TO FEATURED:', updated.title, 'isFeatured:', updated.isFeatured);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
