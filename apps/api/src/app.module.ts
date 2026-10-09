import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { EquipmentModule } from './equipment/equipment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SuppliersModule,
    EquipmentModule,
  ],
})
export class AppModule {}
