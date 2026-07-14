const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');

  // Delete child records first to satisfy foreign key constraints
  await prisma.review.deleteMany({});
  await prisma.downloadToken.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productGallery.deleteMany({});
  await prisma.productTag.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('Database cleaned successfully! (Preserved categories and admin user accounts)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
