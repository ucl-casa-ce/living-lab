import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(user: User): Promise<User> {
        // Explicitly hash the password before saving
        if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
        return this.usersRepository.save(user);
    }

    async updatePassword(userId: string, newPassword: string): Promise<void> {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await this.usersRepository.update(userId, { password: hashedPassword });
    }

    findAll(): Promise<User[]> {
        return this.usersRepository.find({
            select: ['id', 'firstName', 'lastName', 'company', 'type', 'isActivated', 'createdAt', 'updatedAt', 'deletedAt', 'email', 'isAdmin'],
        });
    }

    findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
            select: ['id', 'firstName', 'lastName', 'company', 'type', 'isActivated', 'createdAt', 'updatedAt', 'deletedAt', 'email', 'isAdmin'],
        });
    }

    async remove(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'firstName', 'lastName', 'company', 'type', 'isActivated', 'createdAt', 'updatedAt', 'deletedAt', 'email', 'isAdmin'],
        });
    }

    async findByEmailWithPassword(email: string): Promise<User | undefined> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'firstName', 'lastName', 'company', 'type', 'isAdmin'], // Explicitly include password
        });
    }

    async save(user: User): Promise<User> {
        return this.usersRepository.save(user);
    }

    async transferDatasetsAndDelete(userId: string, adminId: string): Promise<void> {
        try {
            // First ensure both users exist
            const user = await this.usersRepository.findOneBy({ id: userId });
            const admin = await this.usersRepository.findOneBy({ id: adminId });

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            if (!admin) {
                throw new HttpException('Admin user not found', HttpStatus.NOT_FOUND);
            }

            if (!admin.isAdmin) {
                throw new HttpException('Target user is not an admin', HttpStatus.BAD_REQUEST);
            }

            // Update all datasets of this user to belong to the admin
            await this.usersRepository.manager.query(
                `UPDATE datasets SET "userId" = $1 WHERE "userId" = $2`,
                [adminId, userId]
            );

            // Delete the user
            await this.usersRepository.delete(userId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to transfer datasets and delete user',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
