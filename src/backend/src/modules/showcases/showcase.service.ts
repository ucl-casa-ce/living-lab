import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Showcase, ShowcaseSliderImage, ShowcaseLocation } from './showcase.entity';
import { CreateShowcaseDto, UpdateShowcaseDto } from './showcase.dto';
import { User } from '../users/user.entity';
import { Dataset } from '../datasets/dataset.entity';
import { plainToInstance } from 'class-transformer';
import { AuthorisationService } from '../authorisation/authorisation.service';
import { Permission } from '../authorisation/enums/permissions.enum';
import { UserContext } from '../authorisation/user-context';
import { NotificationsService } from '../notifications/notifications.service';
import { ShowcaseNotificationAction } from '../notifications/enums/notification-action.enum';

@Injectable()
export class ShowcasesService {
    constructor(
        @InjectRepository(Showcase)
        private showcaseRepository: Repository<Showcase>,
        @InjectRepository(ShowcaseSliderImage)
        private sliderImageRepository: Repository<ShowcaseSliderImage>,
        @InjectRepository(ShowcaseLocation)
        private locationRepository: Repository<ShowcaseLocation>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Dataset)
        private datasetRepository: Repository<Dataset>,
        private authorisationService: AuthorisationService,
        private notificationsService: NotificationsService,
    ) { }

    async findAll(): Promise<Showcase[]> {
        return this.showcaseRepository.find({
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
            where: { approvedAt: Not(IsNull()) },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number, userContext: UserContext): Promise<Showcase> {
        const showcase = await this.showcaseRepository.findOne({
            where: { id },
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
        });

        if (!showcase) {
            throw new HttpException('Showcase not found', HttpStatus.NOT_FOUND);
        }

        // Check if user can view this showcase
        if (!showcase.approvedAt &&
            !userContext.hasPermission(Permission.VIEW_ALL_UNAPPROVED_CONTENT) &&
            showcase.user.id !== userContext.userId) {
            throw new HttpException('Showcase not found or not approved yet', HttpStatus.NOT_FOUND);
        }

        return showcase;
    }

    async findPendingApproval(userContext: UserContext): Promise<Showcase[]> {
        // Only admins can see all pending showcases
        if (!userContext.hasPermission(Permission.VIEW_ALL_UNAPPROVED_CONTENT)) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        return this.showcaseRepository.find({
            where: {
                approvedAt: IsNull(),
                deniedAt: IsNull()
            },
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<Showcase[]> {
        return this.showcaseRepository.find({
            where: { user: { id: userId } },
            relations: ['sliderImages', 'locations', 'dataset', 'user'],
            order: { createdAt: 'DESC' },
        });
    }

    async create(createDto: CreateShowcaseDto, userContext: UserContext): Promise<Showcase> {
        // Transform plain object into an instance of CreateShowcaseDto
        const createShowcaseInstance = plainToInstance(CreateShowcaseDto, createDto);

        const user = await this.userRepository.findOne({ where: { id: userContext.userId } });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        // Validate the input
        createShowcaseInstance.validateSliderImages();

        // Check if dataset exists (if provided)
        let dataset = undefined;
        if (createShowcaseInstance.datasetId) {
            dataset = await this.datasetRepository.findOne({
                where: { id: createShowcaseInstance.datasetId }
            });

            if (!dataset) {
                throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
            }
        }

        // Create the showcase entity
        const newShowcase = this.showcaseRepository.create({
            title: createShowcaseInstance.title,
            description: createShowcaseInstance.description,
            youtubeLink: createShowcaseInstance.youtubeLink,
            user,
            dataset,
        });

        // Auto-approve showcase if user has permission
        if (userContext.hasPermission(Permission.CREATE_APPROVED_CONTENT)) {
            newShowcase.approvedAt = new Date();
        }

        // Save the showcase first to get an ID
        const savedShowcase = await this.showcaseRepository.save(newShowcase);

        // Process slider images
        if (createShowcaseInstance.sliderImages && createShowcaseInstance.sliderImages.length > 0) {
            for (const imageDto of createShowcaseInstance.sliderImages) {
                await this.sliderImageRepository.save({
                    fileName: imageDto.fileName,
                    isTeaser: imageDto.isTeaser || false,
                    showcase: savedShowcase,
                });
            }
        }

        // Process locations (if any)
        if (createShowcaseInstance.locations && createShowcaseInstance.locations.length > 0) {
            for (const locationDto of createShowcaseInstance.locations) {
                await this.locationRepository.save({
                    ...locationDto,
                    showcase: savedShowcase,
                });
            }
        }

        // Send notification if it's a new add request
        if (!savedShowcase.approvedAt) {
            this.notificationsService.sendSlackShowcaseNotification(savedShowcase, user, ShowcaseNotificationAction.ADD);
        }

        // Return the complete showcase
        return this.showcaseRepository.findOne({
            where: { id: savedShowcase.id },
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
        });
    }

    async update(id: number, updateDto: UpdateShowcaseDto, userContext: UserContext): Promise<Showcase> {
        const updateShowcaseInstance = plainToInstance(UpdateShowcaseDto, updateDto);

        // Find the existing showcase with relations
        const existingShowcase = await this.showcaseRepository.findOne({
            where: { id },
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
        });

        if (!existingShowcase) {
            throw new HttpException('Showcase not found', HttpStatus.NOT_FOUND);
        }

        // Check if user has permission to edit
        if (existingShowcase.user.id !== userContext.userId &&
            !userContext.hasPermission(Permission.EDIT_ALL_CONTENT)) {
            throw new HttpException('Not authorized to edit this showcase', HttpStatus.FORBIDDEN);
        }

        // Validate input
        updateShowcaseInstance.validateSliderImages();

        // Update dataset reference if provided
        let dataset = existingShowcase.dataset;
        if (updateShowcaseInstance.datasetId !== undefined) {
            if (updateShowcaseInstance.datasetId === null) {
                dataset = null;
            } else {
                dataset = await this.datasetRepository.findOne({
                    where: { id: updateShowcaseInstance.datasetId }
                });

                if (!dataset) {
                    throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
                }
            }
        }

        // Update basic fields
        existingShowcase.title = updateShowcaseInstance.title;
        existingShowcase.description = updateShowcaseInstance.description;
        existingShowcase.youtubeLink = updateShowcaseInstance.youtubeLink;
        existingShowcase.dataset = dataset;

        // Handle approval status
        if (userContext.hasPermission(Permission.CREATE_APPROVED_CONTENT)) {
            existingShowcase.approvedAt = new Date();
            existingShowcase.deniedAt = null;
        } else if (!existingShowcase.isOwnedBy(userContext.userId)) {
            // If not an admin and not the owner, don't change approval status
        } else {
            existingShowcase.approvedAt = null;
            existingShowcase.deniedAt = null;
        }

        // Save the updated showcase
        await this.showcaseRepository.save(existingShowcase);

        // Handle slider images: Delete existing and add new ones
        await this.sliderImageRepository.delete({ showcase: { id } });
        if (updateShowcaseInstance.sliderImages && updateShowcaseInstance.sliderImages.length > 0) {
            for (const imageDto of updateShowcaseInstance.sliderImages) {
                await this.sliderImageRepository.save({
                    fileName: imageDto.fileName,
                    isTeaser: imageDto.isTeaser || false,
                    showcase: existingShowcase,
                });
            }
        }

        // Handle locations: Delete existing and add new ones
        await this.locationRepository.delete({ showcase: { id } });
        if (updateShowcaseInstance.locations && updateShowcaseInstance.locations.length > 0) {
            for (const locationDto of updateShowcaseInstance.locations) {
                await this.locationRepository.save({
                    ...locationDto,
                    showcase: existingShowcase,
                });
            }
        }

        // Send notification if it's a new edit request
        if (!existingShowcase.approvedAt) {
            const user = await this.userRepository.findOneBy({ id: userContext.userId });
            this.notificationsService.sendSlackShowcaseNotification(existingShowcase, user, ShowcaseNotificationAction.UPDATE);
        }

        // Return updated showcase
        return this.showcaseRepository.findOne({
            where: { id },
            relations: ['sliderImages', 'locations', 'user', 'dataset'],
        });
    }

    async remove(id: number, userContext: UserContext): Promise<void> {
        const showcase = await this.showcaseRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!showcase) {
            throw new HttpException('Showcase not found', HttpStatus.NOT_FOUND);
        }

        // Check if user has permission to delete
        if (showcase.user.id !== userContext.userId &&
            !userContext.hasPermission(Permission.EDIT_ALL_CONTENT)) {
            throw new HttpException('Not authorized to delete this showcase', HttpStatus.FORBIDDEN);
        }

        await this.showcaseRepository.delete(id);

        const user = await this.userRepository.findOne({
            where: { id: userContext.userId },
            select: ['id', 'firstName', 'lastName', 'company', 'type', 'isActivated', 'createdAt', 'updatedAt', 'deletedAt', 'email', 'isAdmin'],
        });

        if (!user.isAdmin) {
            this.notificationsService.sendSlackShowcaseNotification(showcase, user, ShowcaseNotificationAction.DELETE);
        }
    }

    async approveShowcase(id: number, userContext: UserContext): Promise<Showcase> {
        if (!userContext.hasPermission(Permission.APPROVE_CONTENT)) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        const showcase = await this.showcaseRepository.findOne({
            where: { id }
        });

        if (!showcase) {
            throw new HttpException('Showcase not found', HttpStatus.NOT_FOUND);
        }

        showcase.approvedAt = new Date();
        showcase.deniedAt = null;

        return this.showcaseRepository.save(showcase);
    }

    async denyShowcase(id: number, userContext: UserContext): Promise<Showcase> {
        if (!userContext.hasPermission(Permission.APPROVE_CONTENT)) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        const showcase = await this.showcaseRepository.findOne({
            where: { id }
        });

        if (!showcase) {
            throw new HttpException('Showcase not found', HttpStatus.NOT_FOUND);
        }

        showcase.deniedAt = new Date();
        showcase.approvedAt = null;

        return this.showcaseRepository.save(showcase);
    }

    async findLatest(): Promise<Showcase[]> {
        return this.showcaseRepository.find({
            relations: ['sliderImages', 'user', 'dataset'],
            where: { approvedAt: Not(IsNull()) },
            order: { createdAt: 'DESC' },
            take: 4, // Limit to 4 latest showcases
        });
    }
}
