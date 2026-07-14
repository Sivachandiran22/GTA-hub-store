const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.supportTicket.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.downloadToken.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productTag.deleteMany({});
  await prisma.productGallery.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding roles and users...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const customerPasswordHash = await bcrypt.hash('customer123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gtahub.store',
      passwordHash: adminPasswordHash,
      fullName: 'Michael De Santa',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'franklin@gmail.com',
      passwordHash: customerPasswordHash,
      fullName: 'Franklin Clinton',
      role: 'CUSTOMER',
    },
  });

  console.log('Seeding categories...');
  const categoriesData = [
    { name: 'Peds', slug: 'peds', description: 'High-quality character skins and Peds models' },
    { name: 'Props', slug: 'props', description: 'Interactive and decorative 3D assets for maps' },
    { name: 'MLO', slug: 'mlo', description: 'Custom interior maps with seamless entry' },
    { name: 'Buildings', slug: 'buildings', description: 'Standalone structures and housing shells' },
    { name: 'Maps', slug: 'maps', description: 'Entire island additions, custom race tracks, and roads' },
    { name: 'Vehicles', slug: 'vehicles', description: 'Custom tuned cars, supercars, emergency vehicles, and handling configurations' },
    { name: 'Weapons', slug: 'weapons', description: 'Realistic military weapons and animated firearm skins' },
    { name: 'Clothing', slug: 'clothing', description: 'Exclusive fashion items, shoes, and armor skins' },
    { name: 'Scripts', slug: 'scripts', description: 'FiveM scripts, jobs, UI menus, and frameworks' },
    { name: 'Animations', slug: 'animations', description: 'Custom emote packages, movements, and combat styles' },
    { name: 'Texture Packs', slug: 'texture-packs', description: 'Improved road, wall, and environmental shaders' },
    { name: 'Graphics', slug: 'graphics', description: 'Visual preset ENBs and shade packages' },
    { name: 'Bundles', slug: 'bundles', description: 'Value packs grouping multiple related mods' },
    { name: 'Free Downloads', slug: 'free-downloads', description: 'High quality free mods to test out' }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.create({
      data: {
        ...cat,
        imageUrl: `/images/categories/${cat.slug}.jpg`
      }
    });
    categories[cat.slug] = createdCat;
  }

  console.log('Seeding products...');
  const productsData = [
    {
      title: 'Franklin Clinton HD Redesign',
      slug: 'franklin-clinton-hd-redesign',
      shortDescription: 'Ultra HD textures and improved mesh for Franklin Clinton',
      longDescription: 'Bring a cinematic upgrade to Los Santos with this custom Franklin redesign. Features 4K face textures, realistic hair shaders, detailed fabric textures on starter clothing, and customized facial rigging for seamless cutscene integration.',
      price: 14.99,
      salePrice: 9.99,
      categorySlug: 'peds',
      thumbnailUrl: '/images/products/peds-franklin.jpg',
      version: '1.2.0',
      downloadSize: '84 MB',
      requirements: 'OpenIV and standard GTA V installation',
      installationGuide: '1. Open OpenIV.\n2. Navigate to x64e.rpf\\models\\cdimages\\componentpeds_s_m_y.rpf\\\n3. Turn on Edit Mode and drop the downloaded files.\n4. Rebuild the archive and start the game.',
      isFeatured: true,
      tags: ['Franklin', 'HD', 'Player Skin'],
      zipUrl: '/assets/franklin_hd_redesign.zip'
    },
    {
      title: 'Diamond Casino Penthouse MLO',
      slug: 'diamond-casino-penthouse-mlo',
      shortDescription: 'Luxurious customizable penthouse interior with secret vault room',
      longDescription: 'Live like a high roller! This high-performance interior features a custom bar area, dynamic lighting, an interactive poker table, a multi-screen home theater, and an underground private vault room hidden behind a sliding bookshelf. fully optimized for FiveM and single player.',
      price: 39.99,
      salePrice: 29.99,
      categorySlug: 'mlo',
      thumbnailUrl: '/images/products/mlo-casino.jpg',
      version: '2.0.1',
      downloadSize: '142 MB',
      requirements: 'FiveM server build 2372 or higher',
      installationGuide: '1. Extract the folder into your server resources.\n2. Add `start casino_penthouse` to your server.cfg.\n3. Restart your server.',
      isFeatured: true,
      tags: ['Penthouse', 'Casino', 'Interior', 'FiveM'],
      zipUrl: '/assets/casino_penthouse_mlo.zip'
    },
    {
      title: 'Pagani Huayra BC Roadster (2020)',
      slug: 'pagani-huayra-bc-roadster',
      shortDescription: 'Stunning supercar with custom engine sounds and interactive dials',
      longDescription: 'Experience pure speed. This vehicle features a highly detailed engine bay, premium leather carbon interior, working digital dashboard dials, breakable glass, custom hands-on-wheel placement, and a bespoke AMG twin-turbo V12 sound package.',
      price: 19.99,
      categorySlug: 'vehicles',
      thumbnailUrl: '/images/products/vehicle-pagani.jpg',
      version: '1.0.0',
      downloadSize: '56 MB',
      requirements: 'GTA V (Add-on setup) or FiveM Server resource config',
      installationGuide: 'For Single Player Add-on:\n1. Copy the `huayrab` folder to dlcpacks.\n2. Add `<item>dlcpacks:\\huayrab\\</item>` to your dlclist.xml.\n3. Spawn name: `huayrab`',
      isFeatured: true,
      tags: ['Pagani', 'Supercar', 'Addon', 'FiveM Ready'],
      zipUrl: '/assets/pagani_huayra_bc.zip'
    },
    {
      title: 'FiveM Advanced Gang & Territory System',
      slug: 'fivem-advanced-gang-territory-system',
      shortDescription: 'Complete gang script with dynamic territory capture, drug labs, and turf wars',
      longDescription: 'Turn your roleplay server into an active gang warzone. Features standard territory capture circles with configurable timers, automated drug lab harvesting, gang stash vaults, custom spray graffiti systems, and dynamic XP ranks. Fully integrated with ESX and QBCore.',
      price: 49.99,
      salePrice: 34.99,
      categorySlug: 'scripts',
      thumbnailUrl: '/images/products/script-gang.jpg',
      version: '3.4.2',
      downloadSize: '4.2 MB',
      requirements: 'QBCore Framework or ESX v1.2+, MySQL-Async or oxmysql',
      installationGuide: '1. Import the provided SQL database table.\n2. Configure your gangs and coordinates in `config.lua`.\n3. Ensure resource is started in server.cfg.',
      isFeatured: true,
      tags: ['Script', 'FiveM', 'QBCore', 'ESX', 'Gangs'],
      zipUrl: '/assets/gang_territory_script.zip'
    },
    {
      title: 'Custom Tactical M4A1 Assault Rifle',
      slug: 'custom-tactical-m4a1-rifle',
      shortDescription: 'Custom holographic sights, suppressors, and custom animations',
      longDescription: 'Upgrade your weapon loadout with this modular M4A1. Features animated weapon components, high-fidelity firing sounds, customizable scopes, carbon skin overlays, and adjusted weapon recoil profiles matching modern military specs.',
      price: 8.99,
      categorySlug: 'weapons',
      thumbnailUrl: '/images/products/weapon-m4a1.jpg',
      version: '1.0.4',
      downloadSize: '18 MB',
      requirements: 'GTA V / FiveM',
      installationGuide: '1. Open OpenIV.\n2. Navigate to update\\x64\\dlcpacks\\patchday8ng\\dlc.rpf\\x64\\models\\cdimages\\weapons.rpf\\\n3. Replace the standard carbine rifle files.',
      tags: ['Weapon', 'M4A1', 'Rifle', 'Skin'],
      zipUrl: '/assets/tactical_m4a1.zip'
    },
    {
      title: 'Developer Asset: Free Drift Handling Config',
      slug: 'free-drift-handling-config',
      shortDescription: 'Instant drift physics handler config for major sport cars',
      longDescription: 'Need sweet drift lines? This free package includes optimized handling.meta configurations for over 15 stock GTA V sports cars, introducing custom slip angles, custom wheel traction rates, and responsive counter-steering.',
      price: 0.00,
      categorySlug: 'free-downloads',
      thumbnailUrl: '/images/products/free-handling.jpg',
      version: '1.0.0',
      downloadSize: '45 KB',
      requirements: 'None',
      installationGuide: 'Replace the handling.meta entries for target vehicle lines inside your update.rpf.',
      isFree: true,
      tags: ['Free', 'Handling', 'Drift', 'Meta'],
      zipUrl: '/assets/free_drift_handling.zip'
    },
    {
      title: 'FiveM Street Clothing Pack (Summer 2026)',
      slug: 'fivem-street-clothing-pack',
      shortDescription: '30+ Custom designer clothing items including jackets, hoodies, and cargo pants',
      longDescription: 'Dress your character in style with the latest modern fashion drop. Features detailed textures, unisex items, optimized LODs for performance, and fully mapped slots for MP male and female models.',
      price: 12.99,
      categorySlug: 'clothing',
      thumbnailUrl: '/images/products/clothing-summer.jpg',
      version: '1.1.0',
      downloadSize: '112 MB',
      requirements: 'FiveM Argentum Patreon key or higher for custom clothing slots',
      installationGuide: 'Add the custom clothing streams into your server directory under a stream sub-resource and start.',
      tags: ['Clothing', 'Pack', 'FiveM', 'Designer'],
      zipUrl: '/assets/street_clothing_pack.zip'
    },
    {
      title: 'Ultra Realism Graphics Reshade Pack',
      slug: 'ultra-realism-graphics-reshade',
      shortDescription: 'Cinematic visual improvements, ray-traced ambient occlusion, and wet road effects',
      longDescription: 'Turn GTA V into a true next-gen experience. This Reshade preset introduces advanced color grading, custom depth-of-field focus, HDR illumination enhancements, and realistic rain puddle reflections without tanking your FPS.',
      price: 15.99,
      salePrice: 11.99,
      categorySlug: 'graphics',
      thumbnailUrl: '/images/products/graphics-reshade.jpg',
      version: '4.5.1',
      downloadSize: '2.5 MB',
      requirements: 'Reshade v5.0 or higher installed, GTX 1070/RX 580 minimum GPU',
      installationGuide: 'Drop the .ini file into your main GTA V game directory and load it via the Reshade home overlay menu.',
      tags: ['Reshade', 'Graphics', 'Photorealistic', 'Preset'],
      zipUrl: '/assets/ultra_realism_graphics.zip'
    }
  ];

  for (const prod of productsData) {
    const cat = categories[prod.categorySlug];
    if (!cat) continue;

    const createdProd = await prisma.product.create({
      data: {
        title: prod.title,
        slug: prod.slug,
        shortDescription: prod.shortDescription,
        longDescription: prod.longDescription,
        price: prod.price,
        salePrice: prod.salePrice,
        categoryId: cat.id,
        thumbnailUrl: prod.thumbnailUrl,
        version: prod.version,
        downloadSize: prod.downloadSize,
        requirements: prod.requirements,
        installationGuide: prod.installationGuide,
        isFeatured: prod.isFeatured || false,
        isFree: prod.isFree || false,
        zipUrl: prod.zipUrl,
        seoTitle: `${prod.title} - GTA Hub Store`,
        seoDescription: prod.shortDescription,
        seoKeywords: `gta 5 mod, ${prod.categorySlug}, fivem mod, buy ${prod.title.toLowerCase()}`,
      }
    });

    // Create gallery
    await prisma.productGallery.create({
      data: {
        productId: createdProd.id,
        imageUrl: prod.thumbnailUrl,
        mediaType: 'IMAGE'
      }
    });
    // Add a second placeholder for gallery
    await prisma.productGallery.create({
      data: {
        productId: createdProd.id,
        imageUrl: `/images/products/gallery-default.jpg`,
        mediaType: 'IMAGE'
      }
    });

    // Create tags
    if (prod.tags) {
      for (const tag of prod.tags) {
        await prisma.productTag.create({
          data: {
            productId: createdProd.id,
            tagName: tag
          }
        });
      }
    }

    // Add some reviews to products
    await prisma.review.create({
      data: {
        productId: createdProd.id,
        userId: customer.id,
        rating: 5,
        comment: 'Absolutely love this mod! The performance is great and the models are super clean. Highly recommend.',
        isVerifiedPurchase: true,
        helpfulVotes: 5,
        adminReply: 'Thanks Franklin! Glad you like it, stay tuned for updates!'
      }
    });

    if (!prod.isFree) {
      await prisma.review.create({
        data: {
          productId: createdProd.id,
          userId: admin.id,
          rating: 4,
          comment: 'Very solid work. Ready to use in any server. Performance footprint is tiny.',
          isVerifiedPurchase: false,
          helpfulVotes: 2
        }
      });
    }
  }

  console.log('Seeding blog posts...');
  const blogPosts = [
    {
      title: 'How to Install Custom Cars & Handling Meta in FiveM (2026)',
      slug: 'install-custom-cars-fivem',
      content: 'Installing custom vehicles in your FiveM server is simpler than you think! Learn the step-by-step stream layout structure, handling parameters, and optimization tips. We cover custom engine sound configurations and server resource.cfg optimization.',
      category: 'Tutorials',
      imageUrl: '/images/blog/blog-install.jpg'
    },
    {
      title: 'Top 5 Graphic Settings to Optimize FPS in GTA V Roleplay Servers',
      slug: 'optimize-fps-gta-rp',
      content: 'FiveM servers with heavy scripts and custom cars can often lag. In this guide, we dive deep into shadow scaling, water physics tweaks, and client configurations to boost your FPS from 40 to a smooth 80 FPS.',
      category: 'Guides',
      imageUrl: '/images/blog/blog-fps.jpg'
    }
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: post
    });
  }

  console.log('Seeding coupons...');
  await prisma.coupon.create({
    data: {
      code: 'GTA20',
      discountPercentage: 20.0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });
  await prisma.coupon.create({
    data: {
      code: 'WELCOME50',
      discountPercentage: 50.0,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
