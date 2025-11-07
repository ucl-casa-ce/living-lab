import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmailWithPassword(email);
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async signUp(userDto: any) {
        const existingUser = await this.usersService.findByEmail(userDto.email);
        if (existingUser) {
            throw new UnauthorizedException('User already exists');
        }
        const createdUser = await this.usersService.create(userDto);

        const { password, ...result } = createdUser;

        await this.notificationsService.sendSlackNewUserNotification(createdUser);

        return result as User;
    }
}
