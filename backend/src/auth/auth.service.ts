import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<{ access_token: string }> {
    // Create user via UsersService
    const user = await this.usersService.create(email, password, name);
    return this.generateToken(user);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.validateUserPassword(email, password);
    return this.generateToken(user!);
  }

  private generateToken(user: User): { access_token: string } {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
