import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan } from 'typeorm';
import { Dataset, DatasetLink, DatasetLocation, DatasetSliderImage, DatasetTag, UpdateFrequencyUnit } from './dataset.entity';
import { CreateDatasetDto, UpdateDatasetDto } from './dataset.dto';
import { User } from '../users/user.entity';
import { plainToInstance } from 'class-transformer';
import mqtt from 'mqtt';
import { AuthorisationService } from '../authorisation/authorisation.service';
import { TagsService } from '../tags/tags.service';
import { Permission } from '../authorisation/enums/permissions.enum';
import { UserContext } from '../authorisation/user-context';
import { AccessRequest } from '../access-requests/access-request.entity';
import { UserRole } from '../authorisation/enums/user-roles.enum';
import axios from 'axios';
import { NodeRedFlowService } from './node-red-flow.service';

@Injectable()
export class DatasetsService {
    private connectionPool: mqtt.MqttClient[] = []; // Connection pool
    private maxConnections = 10; // Maximum concurrent connections

    constructor(
        @InjectRepository(Dataset)
        private datasetRepository: Repository<Dataset>,
        @InjectRepository(DatasetTag)
        private tagRepository: Repository<DatasetTag>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private authorisationService: AuthorisationService,
        private tagsService: TagsService,
        @InjectRepository(AccessRequest)
        private accessRequestRepository: Repository<AccessRequest>,
        private nodeRedFlowService: NodeRedFlowService,
    ) { }

    async findAll(userContext: UserContext): Promise<Dataset[]> {
        var datasetsQueryBuilder = await this.datasetRepository
            .createQueryBuilder('dataset')
            .leftJoinAndSelect('dataset.locations', 'locations')
            .leftJoinAndSelect('dataset.sliderImages', 'sliderImages')
            .leftJoinAndSelect('dataset.tags', 'tags')
            .leftJoinAndSelect('dataset.user', 'user')


        if (userContext.hasRole(UserRole.ADMIN)) {
            datasetsQueryBuilder = datasetsQueryBuilder.addSelect([
                'dataset.mqttAddress',
                'dataset.mqttPort',
                'dataset.mqttTopic',
                'dataset.mqttUsername',
                'dataset.mqttPassword',
                'dataset.dataExample'
            ]);
        }

        const datasets = datasetsQueryBuilder
            .where('dataset.approvedAt IS NOT NULL')
            .orderBy('dataset.createdAt', 'DESC')
            .getMany();

        return datasets;
    }

    async findOne(id: number, userContext: UserContext): Promise<Dataset | null> {
        Logger.log(`Finding dataset with ID : ${id}`, userContext);
        // Check if user can view this dataset
        if (!await this.authorisationService.canViewDataset(id, userContext)) {
            throw new HttpException('Dataset not found or not approved yet', HttpStatus.NOT_FOUND);
        }

        const currentUserCanViewDetails = await this.authorisationService
            .canViewDatasetDetails(id, userContext);

        var datasetsQueryBuilder = this.datasetRepository
            .createQueryBuilder('dataset')
            .leftJoinAndSelect('dataset.locations', 'locations')
            .leftJoinAndSelect('dataset.sliderImages', 'sliderImages')
            .leftJoinAndSelect('dataset.tags', 'tags')
            .leftJoinAndSelect('dataset.user', 'user')

        if (currentUserCanViewDetails) {
            datasetsQueryBuilder = datasetsQueryBuilder
                .leftJoinAndSelect('dataset.links', 'links')
                .addSelect([
                    'dataset.mqttAddress',
                    'dataset.mqttPort',
                    'dataset.mqttTopic',
                    'dataset.mqttUsername',
                    'dataset.mqttPassword',
                    'dataset.dataExample'
                ]);
        }

        const dataset = await datasetsQueryBuilder
            .where('dataset.approvedAt IS NOT NULL')
            .where('dataset.id = :id', { id })
            .orderBy('dataset.createdAt', 'DESC')
            .getOne();

        if (!dataset) {
            throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
        }

        dataset.canUserSeeDetails = currentUserCanViewDetails;

        return dataset;
    }

    findRecent(): Promise<Dataset[]> {
        return this.datasetRepository.find({
            where: { approvedAt: Not(IsNull()) },
            order: { updatedAt: 'DESC' },
            take: 3,
            relations: ['locations', 'sliderImages', 'tags'],
        });
    }

    // Update the findByUser method to be more explicit about ownership
    async findByUser(userId: string): Promise<Dataset[]> {
        return this.datasetRepository.find({
            where: { user: { id: userId } },
            relations: ['locations', 'sliderImages', 'tags', 'user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findPendingApproval(userContext: UserContext): Promise<Dataset[]> {
        // Only admins can see all pending datasets
        if (!await this.authorisationService.canViewAllUnapprovedContent(userContext)) {
            throw new HttpException('Not authorised', HttpStatus.FORBIDDEN);
        }

        return this.datasetRepository.find({
            where: {
                approvedAt: IsNull(),
                deniedAt: IsNull()
            },
            relations: ['locations', 'sliderImages', 'tags', 'user'],
            order: { createdAt: 'DESC' },
        });
    }

    async approveDataset(id: number, userContext: UserContext): Promise<Dataset> {
        if (!await this.authorisationService.canApproveContent(userContext)) {
            throw new HttpException('Not authorized', HttpStatus.FORBIDDEN);
        }

        const dataset = await this.datasetRepository.findOne({
            where: { id },
            relations: ['tags']
        });

        if (!dataset) {
            throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
        }

        dataset.approvedAt = new Date();

        // Approve all unapproved tags when dataset is approved
        if (dataset.tags && dataset.tags.length > 0) {
            const now = new Date();
            for (const tag of dataset.tags) {
                if (!tag.approvedAt) {
                    tag.approvedAt = now;
                    await this.tagRepository.save(tag);
                }
            }
        }

        return this.datasetRepository.save(dataset);
    }

    async denyDataset(id: number) {
        const dataset = await this.datasetRepository.findOne({ where: { id } });
        if (!dataset) {
            throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
        }
        dataset.deniedAt = new Date();
        return this.datasetRepository.save(dataset);
    }

    async create(createDto: CreateDatasetDto, userContext: UserContext): Promise<Dataset> {
        // Transform plain object into an instance of CreateDatasetDto
        const createDatasetInstance = plainToInstance(CreateDatasetDto, createDto);

        const user = await this.usersRepository.findOne({ where: { id: userContext.userId } });
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        createDatasetInstance.userId = userContext.userId;

        // Validation
        createDatasetInstance.validateTags();
        createDatasetInstance.validateMqttData();
        if (createDatasetInstance.mqttAddress && createDatasetInstance.mqttPort)
            await this.verifyMqttConnection(createDatasetInstance.mqttAddress,
                createDatasetInstance.mqttPort,
                createDatasetInstance.mqttTopic,
                createDatasetInstance.mqttUsername,
                createDatasetInstance.mqttPassword);

        // Handle tags & prevent duplicates
        const tags = await Promise.all(
            createDatasetInstance.tags.map(async (tagDto) => {
                if (tagDto.id) {
                    // Check if the tag exists
                    const existingTag = await this.tagRepository.findOne({ where: { id: tagDto.id } });
                    if (existingTag) {
                        return existingTag; // Reuse existing tag
                    }
                }
                // Generate a random color if not provided
                tagDto.colour = tagDto.colour || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                tagDto.icon = tagDto.icon || '🏷️';
                const newTag = this.tagRepository.create(tagDto);

                // Auto-approve tag if user has permission to create approved content
                if (userContext.hasPermission(Permission.CREATE_APPROVED_CONTENT)) {
                    newTag.approvedAt = new Date();
                }

                return this.tagRepository.save(newTag);
            }),
        );

        const newDataset = this.datasetRepository.create({ ...createDatasetInstance, tags, user });

        // Auto-approve dataset if user can create approved content
        if (userContext.hasPermission(Permission.CREATE_APPROVED_CONTENT)) {
            newDataset.approvedAt = new Date();
        }

        var savedDataset = await this.datasetRepository.save(newDataset);
        // }

        // if (savedDataset.updateFrequencyUnit != UpdateFrequencyUnit.ONLY_ONCE) {
        //     this.nodeRedFlowService.addNodeRedFlowForDataset(savedDataset).catch((error) => {
        //         Logger.error(`Failed to add Node-RED flow for dataset ${savedDataset.id}: ${error.message}`);
        //     });
        // }
        return savedDataset;
    }

    async update(id: number, updateDto: UpdateDatasetDto, userContext: UserContext): Promise<Dataset> {
        const editDatasetInstance = plainToInstance(UpdateDatasetDto, updateDto);

        const currentUser = await this.usersRepository.findOne({
            where: { id: userContext.userId },
            select: ['id', 'firstName', 'lastName', 'company', 'type', 'isActivated', 'createdAt', 'updatedAt', 'deletedAt', 'email', 'isAdmin'],
        });
        if (!currentUser) {
            throw new Error('User not found');
        }

        // Fetch the existing dataset with user and links
        const existingDataset = await this.datasetRepository.findOne({
            where: { id },
            relations: ['user', 'links', 'locations', 'sliderImages', 'tags'],
        });

        if (!existingDataset) {
            throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
        }

        // Check if the current user is allowed to edit the dataset
        if (existingDataset.user.id !== currentUser.id && !currentUser.isAdmin) {
            throw new HttpException('You are not authorised to edit this dataset.', HttpStatus.FORBIDDEN);
        }

        // Validate tags and MQTT data
        editDatasetInstance.validateTags();
        editDatasetInstance.validateMqttData();
        if (editDatasetInstance.mqttAddress && editDatasetInstance.mqttPort)
            await this.verifyMqttConnection(editDatasetInstance.mqttAddress,
                editDatasetInstance.mqttPort,
                editDatasetInstance.mqttTopic,
                editDatasetInstance.mqttUsername,
                editDatasetInstance.mqttPassword);

        // Update scalar fields
        Object.assign(existingDataset, {
            name: editDatasetInstance.name,
            dataOwnerName: editDatasetInstance.dataOwnerName,
            dataOwnerEmail: editDatasetInstance.dataOwnerEmail,
            datasetType: editDatasetInstance.datasetType,
            description: editDatasetInstance.description,
            updateFrequency: editDatasetInstance.updateFrequency,
            updateFrequencyUnit: editDatasetInstance.updateFrequencyUnit,
            dataExample: editDatasetInstance.dataExample,
            mqttAddress: editDatasetInstance.mqttAddress,
            mqttPort: editDatasetInstance.mqttPort,
            mqttTopic: editDatasetInstance.mqttTopic,
            mqttUsername: editDatasetInstance.mqttUsername,
            mqttPassword: editDatasetInstance.mqttPassword,
        });

        // Handle tags
        const tags = await Promise.all(
            editDatasetInstance.tags.map(async (tagDto) => {
                if (tagDto.id) {
                    const existingTag = await this.tagRepository.findOne({ where: { id: tagDto.id } });
                    if (existingTag) {
                        return existingTag;
                    }
                }
                // Check by name to avoid duplicates
                let existingTagByName = await this.tagRepository.findOne({ where: { name: tagDto.name } });
                if (existingTagByName) {
                    return existingTagByName;
                }
                tagDto.colour = tagDto.colour || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                tagDto.icon = tagDto.icon || '🏷️';
                const newTag = this.tagRepository.create(tagDto);
                return this.tagRepository.save(newTag);
            }),
        );
        existingDataset.tags = tags;

        // Handle links: Delete old links and create new ones
        await this.datasetRepository.manager.delete(DatasetLink, { dataset: { id } });
        const links = [];
        for (const linkDto of editDatasetInstance.links) {
            const newLink = this.datasetRepository.manager.create(DatasetLink, { ...linkDto, dataset: existingDataset });
            const savedLink = await this.datasetRepository.manager.save(newLink); // Save sequentially to preserve order
            links.push(savedLink);
        }
        existingDataset.links = links;

        // Handle locations: Delete old locations and create new ones
        await this.datasetRepository.manager.delete(DatasetLocation, { dataset: { id } });
        const locations = [];
        for (const locationDto of editDatasetInstance.locations) {
            const newLocation = this.datasetRepository.manager.create(DatasetLocation, { ...locationDto, dataset: existingDataset });
            const savedLocation = await this.datasetRepository.manager.save(newLocation); // Save sequentially to preserve order
            locations.push(savedLocation);
        }
        existingDataset.locations = locations;

        // Handle slider images: Delete old slider images and create new ones
        await this.datasetRepository.manager.delete(DatasetSliderImage, { dataset: { id } });
        const sliderImages = [];
        for (const imageDto of editDatasetInstance.sliderImages) {
            const newImage = this.datasetRepository.manager.create(DatasetSliderImage, { ...imageDto, dataset: existingDataset });
            const savedImage = await this.datasetRepository.manager.save(newImage); // Save sequentially to preserve order
            sliderImages.push(savedImage);
        }
        existingDataset.sliderImages = sliderImages;

        // Auto-approve dataset if user can create approved content
        if (userContext.hasPermission(Permission.CREATE_APPROVED_CONTENT)) {
            existingDataset.approvedAt = new Date();
            existingDataset.deniedAt = null;

        } else {
            existingDataset.approvedAt = null; // Needs admin approval again
            existingDataset.deniedAt = null;
        }

        // Save the updated dataset
        await this.datasetRepository.save(existingDataset);

        // Fetch only the required fields and relations after saving
        return this.datasetRepository.findOne({
            where: { id },
            relations: ['links', 'locations', 'sliderImages', 'tags'], // Include only necessary relations
        });
    }

    async remove(id: number, userContext: UserContext): Promise<void> {
        const dataset = await this.datasetRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!dataset) {
            throw new HttpException('Dataset not found', HttpStatus.NOT_FOUND);
        }

        if (await this.authorisationService.canDeleteDataset(dataset, userContext)) {
            await this.datasetRepository.delete(id);
            // this.nodeRedFlowService.removeNodeRedFlowForDataset(id).catch((error) => {
            //     Logger.error(`Failed to remove Node-RED flow for dataset ${id}: ${error.message}`);
            // });
        } else {
            throw new HttpException('You are not authorised to delete this dataset.', HttpStatus.FORBIDDEN);
        }

    }

    async verifyMqttConnection(mqttAddress: string, mqttPort: number, mqttTopic: string, mqttUsername?: string, mqttPassword?: string): Promise<void> {
        const options: mqtt.IClientOptions = {
            username: mqttUsername,
            password: mqttPassword,
            connectTimeout: 5000,
            reconnectPeriod: 0,
        };

        if (this.connectionPool.length >= this.maxConnections) {
            throw new HttpException(`Limit exceeded during MQTT validation: Server does not allow more than ${this.maxConnections} MQTT connections`, HttpStatus.TOO_MANY_REQUESTS);
        }

        const client = mqtt.connect(`mqtt://${mqttAddress}:${mqttPort}`, options);
        this.connectionPool.push(client);

        return new Promise<void>((resolve, reject) => {
            client.on('connect', () => {
                // Remove from connection pool and close the connection
                const index = this.connectionPool.indexOf(client);
                if (index > -1) {
                    this.connectionPool.splice(index, 1);
                }

                client.end(); // Close the connection immediately
                console.log(`Connected to MQTT broker at ${mqttAddress}:${mqttPort}`);
                resolve();
            });

            client.on('error', (error) => {
                // Remove from connection pool and close the connection
                const index = this.connectionPool.indexOf(client);
                if (index > -1) {
                    this.connectionPool.splice(index, 1);
                }

                client.end(); // close the connection on error.
                console.error('MQTT connection error:', error);
                reject(new HttpException(error.message, HttpStatus.BAD_GATEWAY));
            });

            // Add a timeout to prevent hanging if the connection never succeeds
            setTimeout(() => {
                if (!client.connected) {
                    // Remove from connection pool and close the connection
                    const index = this.connectionPool.indexOf(client);
                    if (index > -1) {
                        this.connectionPool.splice(index, 1);
                    }

                    client.end(); // close the connection on timeout.
                    console.error('MQTT connection timeout');
                    reject(new HttpException('MQTT connection timeout', HttpStatus.REQUEST_TIMEOUT));
                }
            }, 5000); // 5 seconds timeout 
        });
    }

    async findByTagId(tagId: number): Promise<Dataset[]> {
        return this.datasetRepository.find({
            where: {
                tags: { id: tagId },
                approvedAt: Not(IsNull()) // Only return approved datasets
            },
            relations: ['locations', 'sliderImages', 'tags'],
            order: { createdAt: 'DESC' },
        });
    }
}