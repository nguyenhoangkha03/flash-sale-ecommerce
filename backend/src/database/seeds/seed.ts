import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting seeding...');

  try {
    // 1. Initialize connection
    await AppDataSource.initialize();
    console.log('🔌 Database connected');

    // 2. Repositories
    const userRepository = AppDataSource.getRepository(User);
    const productRepository = AppDataSource.getRepository(Product);

    // 3. Clear existing data
    await AppDataSource.query(
      `TRUNCATE TABLE "users", "products", "reservations", "orders", "reservation_items", "order_items", "audit_logs" RESTART IDENTITY CASCADE`,
    );
    console.log('🧹 Cleaned existing data');

    // 4. Seed Users
    const password = await bcrypt.hash('123456', 10);

    const admin = userRepository.create({
      email: 'nhoangkha03@gmail.com',
      password,
      name: 'Admin User',
      role: UserRole.ADMIN,
    });

    const user1 = userRepository.create({
      email: 'user1@example.com',
      password,
      name: 'Regular User 1',
      role: UserRole.USER,
    });

    const user2 = userRepository.create({
      email: 'user2@example.com',
      password,
      name: 'Regular User 2',
      role: UserRole.USER,
    });

    await userRepository.save([admin, user1, user2]);
    console.log('👤 Seeded 3 users (1 Admin, 2 Users)');

    // 5. Seed Products
    const products = [
      {
        name: 'iPhone 17 Pro Max',
        image_url:
          'https://i.pinimg.com/736x/77/bb/58/77bb584d7313eb31d40afa9a76b3c8d9.jpg',
      },
      {
        name: 'Samsung Galaxy S24',
        image_url:
          'https://i.pinimg.com/736x/24/22/32/24223258deb2711a6cfb6ffe2ba3b5e9.jpg',
      },
      {
        name: 'MacBook Air M3',
        image_url:
          'https://i.pinimg.com/736x/de/90/48/de9048a14a731dc2a84c3c17ca41e7b8.jpg',
      },
      {
        name: 'Sony WH-1000XM5',
        image_url:
          'https://i.pinimg.com/1200x/45/cb/05/45cb0574cb471eb755131a93cd876d0f.jpg',
      },
      {
        name: 'iPad Air 5',
        image_url:
          'https://i.pinimg.com/736x/35/98/83/359883beffb70e2d301242d84719651f.jpg',
      },
      {
        name: 'Apple Watch Series 9',
        image_url:
          'https://i.pinimg.com/736x/1c/3e/37/1c3e378c2a233db5ee39cb00443126cd.jpg',
      },
      {
        name: 'AirPods Pro 2',
        image_url:
          'https://i.pinimg.com/1200x/2d/35/94/2d35947821a1317066f2be9bd8a98f5d.jpg',
      },
      {
        name: 'Dell XPS 13',
        image_url:
          'https://i.pinimg.com/1200x/c1/6a/a8/c16aa8402016f2eaea10a55ec2142528.jpg',
      },
      {
        name: 'Nintendo Switch OLED',
        image_url:
          'https://i.pinimg.com/736x/9a/e0/9a/9ae09a096821c6b6bcebd846cefcc58a.jpg',
      },
      {
        name: 'PlayStation 5 Slim',
        image_url:
          'https://i.pinimg.com/474x/98/05/6b/98056b6da138b652d7e860ed3a172465.jpg',
      },
    ];

    const productPre = products.map((product) => {
      // Giá từ 10,000 đến 500,000
      const price = Math.floor(Math.random() * (500000 - 10000 + 1)) + 10000;

      // Stock từ 5 đến 100
      const stock = Math.floor(Math.random() * (100 - 5 + 1)) + 5;

      return productRepository.create({
        name: product.name,
        description: `Flash sale item: ${product.name}`,
        price: price,
        image_url: product.image_url,
        available_stock: stock,
        reserved_stock: 0,
        sold_stock: 0,
        version: 0,
      });
    });

    await productRepository.save(productPre);
    console.log(`📦 Seeded ${products.length} products`);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
