const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: true
    }
  });
  console.log('PRODUCTS:', JSON.stringify(products.map(p => ({
    title: p.title,
    slug: p.slug,
    game: p.game,
    category: p.category.slug,
    isVisible: p.isVisible
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
