import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan } from 'typeorm';
import { AccessRequest } from './access-request.entity';
import { UserContext } from '../authorisation/user-context';
import { AuthorisationService } from '../authorisation/authorisation.service';
import { ApproveAccessRequestDto, CreateAccessRequestDto } from './access-request.dto';
import { User } from '../users/user.entity';
import { Dataset } from '../datasets/dataset.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AccessRequestNotificationAction } from '../notifications/enums/notification-action.enum';

@Injectable()
export class AccessRequestService {
    constructor(
        @InjectRepository(AccessRequest)
        private accessRequestRepository: Repository<AccessRequest>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private authorisationService: AuthorisationService,
        private notificationsService: NotificationsService,
    ) { }

    async createAccessRequest(dto: CreateAccessRequestDto, userContext: UserContext): Promise<AccessRequest> {
        if (!userContext.userId) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const accessRequest = this.accessRequestRepository.create({
            ...dto,
            user: { id: userContext.userId } as User,
            dataset: { id: dto.datasetId } as Dataset,
            endTime: null,
        });

        const savedAccessRequest = await this.accessRequestRepository.save(accessRequest);
        if (Array.isArray(savedAccessRequest)) {
            throw new HttpException('Unexpected array response from save method', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // We need to fetch the request again to get the relations for the notification
        const fullAccessRequest = await this.accessRequestRepository.findOne({
            where: { id: savedAccessRequest.id },
            relations: ['user', 'dataset'],
        });

        if (fullAccessRequest) {
            this.notificationsService.sendSlackAccessRequestNotification(fullAccessRequest, AccessRequestNotificationAction.ADD);
        }

        return savedAccessRequest;
    }

    async approveAccessRequest(id: number, dto: ApproveAccessRequestDto, userContext: UserContext): Promise<AccessRequest> {
        if (!this.authorisationService.canApproveContent(userContext)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        const accessRequest = await this.accessRequestRepository.findOne({ where: { id }, relations: ['user', 'dataset'] });
        if (!accessRequest) {
            throw new HttpException('Access request not found', HttpStatus.NOT_FOUND);
        }

        accessRequest.approvedAt = new Date();
        accessRequest.deletedAt = null;
        accessRequest.deniedAt = null;
        accessRequest.endTime = dto.accessEndDate ? new Date(dto.accessEndDate) : null;

        return this.accessRequestRepository.save(accessRequest);
    }

    async denyAccessRequest(id: number, userContext: UserContext): Promise<AccessRequest> {
        if (!this.authorisationService.canApproveContent(userContext)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        const accessRequest = await this.accessRequestRepository.findOne({ where: { id }, relations: ['user', 'dataset'] });
        if (!accessRequest) {
            throw new HttpException('Access request not found', HttpStatus.NOT_FOUND);
        }

        accessRequest.deniedAt = new Date();
        accessRequest.approvedAt = null;
        accessRequest.endTime = null;

        return this.accessRequestRepository.save(accessRequest);
    }

    async deleteAccessRequest(id: number, userContext: UserContext): Promise<void> {
        if (!this.authorisationService.canApproveContent(userContext)) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        const accessRequest = await this.accessRequestRepository.findOne({ where: { id } });
        if (!accessRequest) {
            throw new HttpException('Access request not found', HttpStatus.NOT_FOUND);
        }

        await this.accessRequestRepository.delete(id);
    }

    async getAllRequests(): Promise<AccessRequest[]> {
        return this.accessRequestRepository.find({ relations: ['user', 'dataset'] });
    }

    async getRequestsForUser(userId: string): Promise<AccessRequest[]> {
        return this.accessRequestRepository.find({
            where: { user: { id: userId } },
            relations: ['dataset']
        });
    }

    async getRequestForUserAndDataset(userId: string, datasetId: number): Promise<AccessRequest | null> {
        return this.accessRequestRepository.findOne({
            where: { user: { id: userId }, dataset: { id: datasetId } },
            relations: ['dataset', 'user'],
        });
    }

    async getRequestsForDataset(datasetId: number): Promise<AccessRequest[]> {
        return this.accessRequestRepository.find({ where: { dataset: { id: datasetId } }, relations: ['user'] });
    }

    async hasValidAccess(datasetId: number, userId: string): Promise<boolean> {
        const accessRequest = await this.accessRequestRepository.findOne({
            where: {
                dataset: { id: datasetId },
                user: { id: userId },
                approvedAt: Not(IsNull()),
                deniedAt: IsNull(),
                endTime: IsNull() || MoreThan(new Date()), // Check if endTime is null or in the future
            },
        });

        return !!accessRequest;
    }
}
