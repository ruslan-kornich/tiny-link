import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ConfigService } from '../../config/config.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type JwtPayload = { sub: string; email: string };
export type LoginResult = { accessToken: string; expiresIn: number };

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ id: bigint; email: string }> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password);
    return this.repository.create(dto.email, passwordHash);
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.repository.findByEmail(dto.email);
    const passwordMatches = user ? await argon2.verify(user.passwordHash, dto.password) : false;
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: JwtPayload = { sub: user.id.toString(), email: user.email };
    const expiresIn = this.config.get('JWT_EXPIRES_IN');
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });
    return { accessToken, expiresIn };
  }
}
