import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    BeforeInsert,
    OneToMany,
    Index,
    Check,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Dataset } from '../datasets/dataset.entity';

export enum UserType {
    PUBLIC_SECTOR = 'public_sector',
    SME = 'sme',
    LARGE_BUSINESS = 'large_business',
    UNIVERSITY = 'university',
    CITIZEN_SCIENTIST = 'citizen_scientist',
    NONE = 'none',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, select: false })
    @Index()
    email!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    company!: string;

    @Column({ select: false })
    password!: string;

    @Column({ type: 'enum', enum: UserType })
    @Check(`"type" IN ('public_sector', 'sme', 'large_business', 'university', 'citizen_scientist', 'none')`)
    type!: UserType;

    @Column({ default: false, select: false })
    isAdmin!: boolean;

    @Column({ nullable: true, select: false })
    emailVerificationToken?: string;

    @Column({ default: false })
    isActivated!: boolean;

    roles!: string[]; // Array of role names

    @OneToMany(() => Dataset, (dataset) => dataset.user, { cascade: true, onDelete: 'CASCADE' })
    datasets!: Dataset[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @BeforeInsert()
    async hashPassword() {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
}
