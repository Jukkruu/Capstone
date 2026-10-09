import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async loginBigcUser(email: string, password: string) {
    const user = await this.prisma.bigcUser.findUnique({ where: { email } });
    if (!user || user.status === 'INACTIVE') throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.signToken({ sub: user.id, email: user.email, role: user.role, type: 'bigc' });
  }

  async loginSupplier(email: string, password: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { contactEmail: email } });
    if (!supplier || supplier.accountStatus === 'INACTIVE') throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, supplier.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return {
      ...this.signToken({ sub: supplier.id, email: supplier.contactEmail, role: 'SUPPLIER', type: 'supplier' }),
      mustChangePassword: supplier.mustChangePassword,
    };
  }

  async changeSupplierPassword(supplierId: string, newPassword: string) {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { passwordHash: hash, mustChangePassword: false },
    });
    return { ok: true };
  }

  async getProfile(userId: string, type: string) {
    if (type === 'bigc') {
      const user = await this.prisma.bigcUser.findUnique({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, role: true, department: true, employeeNo: true },
      });
      return user;
    }
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: userId },
      select: { id: true, contactEmail: true, name: true, supplierCode: true, accountStatus: true, mustChangePassword: true },
    });
    return supplier;
  }

  private signToken(payload: object) {
    return { accessToken: this.jwt.sign(payload) };
  }
}
