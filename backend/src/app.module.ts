import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Module
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuditModule } from './audit/audit.module';
import { ReservationsModule } from './reservations/reservations.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from './common/middlewares/logging.middleware';

@Module({
  imports: [
    // Load biến môi trường từ file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Enable cron jobs
    ScheduleModule.forRoot(),

    // Cấu hình TypeORM để kết nối PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
    }),

    // Auth module
    AuthModule,
    UsersModule,
    ReservationsModule,
    ProductsModule,
    OrdersModule,
    AuditModule,
    EventsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
