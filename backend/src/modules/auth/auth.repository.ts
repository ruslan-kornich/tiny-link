import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type UserRow = { id: bigint; email: string; passwordHash: string };

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  async create(email: string, passwordHash: string): Promise<{ id: bigint; email: string }> {
    return this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }
}
