import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { toUserView, UserEntity } from './user-view';

const BCRYPT_ROUNDS = 10;
const NICKNAME_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const NICKNAME_RANDOM_LENGTH = 8;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const nickname = dto.nickname?.trim() || this.generateNickname();

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password,
        nickname,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
      },
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new ConflictException('用户名或密码错误');
    }

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: UserEntity) {
    return {
      token: this.signToken(user),
      user: toUserView(user),
    };
  }

  async profile(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return { user: toUserView(user) };
  }

  private signToken(user: Pick<UserEntity, 'id' | 'username'>): string {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
  }

  private generateNickname(): string {
    let suffix = '';
    for (let i = 0; i < NICKNAME_RANDOM_LENGTH; i++) {
      suffix += NICKNAME_CHARS.charAt(
        Math.floor(Math.random() * NICKNAME_CHARS.length),
      );
    }
    return `注册用户${suffix}`;
  }
}
