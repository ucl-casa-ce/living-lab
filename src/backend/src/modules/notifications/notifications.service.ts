import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../users/user.entity';
import { Dataset } from '../datasets/dataset.entity';
import { DatasetNotificationAction, ShowcaseNotificationAction, AccessRequestNotificationAction } from './enums/notification-action.enum';
import { Showcase } from '../showcases/showcase.entity';
import { AccessRequest } from '../access-requests/access-request.entity';

@Injectable()
export class NotificationsService {
    constructor(private readonly httpService: HttpService) { }

    private async sendSlackNotification(payload: any): Promise<void> {
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!slackWebhookUrl) {
            Logger.warn('SLACK_WEBHOOK_URL not set. Skipping Slack notification.', 'NotificationsService');
            return;
        }

        try {
            await firstValueFrom(this.httpService.post(slackWebhookUrl, payload));
        } catch (error) {
            Logger.error('Could not send Slack notification', error, 'NotificationsService');
        }
    }

    async sendSlackNewUserNotification(user: User): Promise<void> {
        const message = {
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: 'New User Registered',
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Name:*\n${user.firstName} ${user.lastName}` },
                        { type: 'mrkdwn', text: `*Company/University:*\n${user.company}` },
                    ],
                },
            ],
        };
        await this.sendSlackNotification(message);
    }

    async sendSlackDatasetNotification(dataset: Dataset, user: User, action: DatasetNotificationAction): Promise<void> {
        const description = dataset.description ?
            (dataset.description.length > 250 ? `${dataset.description.substring(0, 247)}...` : dataset.description)
            : 'No description provided.';

        const tags = dataset.tags?.map(t => t.name).join(', ') || 'No tags';
        const updateFrequency = `${dataset.updateFrequency} ${dataset.updateFrequencyUnit}`;

        let title = '';
        switch (action) {
            case DatasetNotificationAction.ADD:
                title = 'Dataset Add Request';
                break;
            case DatasetNotificationAction.UPDATE:
                title = 'Dataset Update Request';
                break;
            case DatasetNotificationAction.DELETE:
                title = 'Dataset Deleted by Its Owner';
                break;
        }

        const message = {
            text: `Dataset Notification: *${dataset.name}*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: title,
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Dataset Name:*\n${dataset.name}` },
                        { type: 'mrkdwn', text: `*Action By:*\n${user.firstName} ${user.lastName}` },
                        { type: 'mrkdwn', text: `*Type:*\n${dataset.datasetType}` },
                        { type: 'mrkdwn', text: `*Update Frequency:*\n${updateFrequency}` },
                        { type: 'mrkdwn', text: `*Tags:*\n${tags}` },
                        { type: 'mrkdwn', text: `*Number of Locations:*\n${dataset.locations?.length || 0}` },
                    ],
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Description:*\n${description}`,
                    },
                },
            ],
        };

        Logger.log(`Sending Slack notification for dataset ${action}: ${JSON.stringify(message)}`, 'NotificationsService');
        await this.sendSlackNotification(message);
    }

    async sendSlackShowcaseNotification(showcase: Showcase, user: User, action: ShowcaseNotificationAction): Promise<void> {
        const description = showcase.description ?
            (showcase.description.length > 250 ? `${showcase.description.substring(0, 247)}...` : showcase.description)
            : 'No description provided.';

        let title = '';
        switch (action) {
            case ShowcaseNotificationAction.ADD:
                title = 'Showcase Add Request';
                break;
            case ShowcaseNotificationAction.UPDATE:
                title = 'Showcase Update Request';
                break;
            case ShowcaseNotificationAction.DELETE:
                title = 'Showcase Deleted';
                break;
        }

        const fields = [
            { type: 'mrkdwn', text: `*Showcase Title:*\n${showcase.title}` },
            { type: 'mrkdwn', text: `*Action By:*\n${user.firstName} ${user.lastName}` },
        ];

        if (showcase.dataset) {
            fields.push({ type: 'mrkdwn', text: `*Linked Dataset:*\n${showcase.dataset.name}` });
        }

        const message = {
            text: `Showcase Notification: *${showcase.title}*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: title,
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: fields,
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Description:*\n${description}`,
                    },
                },
            ],
        };

        Logger.log(`Sending Slack notification for showcase ${action}: ${JSON.stringify(message)}`, 'NotificationsService');
        await this.sendSlackNotification(message);
    }

    async sendSlackAccessRequestNotification(accessRequest: AccessRequest, action: AccessRequestNotificationAction): Promise<void> {
        const { user, dataset, projectDescription } = accessRequest;

        const description = projectDescription
            ? (projectDescription.length > 250 ? `${projectDescription.substring(0, 247)}...` : projectDescription)
            : 'No project description provided.';

        let title = '';
        if (action === AccessRequestNotificationAction.ADD) {
            title = 'Controlled Dataset Access Request';
        }

        const message = {
            text: `Access Request for Dataset: *${dataset.name}*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: title,
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Dataset:*\n${dataset.name}` },
                        { type: 'mrkdwn', text: `*Requested By:*\n${user.firstName} ${user.lastName}` },
                        { type: 'mrkdwn', text: `*Company/University:*\n${user.company}` },
                    ],
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Project Description:*\n${description}`,
                    },
                },
            ],
        };

        Logger.log(`Sending Slack notification for access request ${action}: ${JSON.stringify(message)}`, 'NotificationsService');
        await this.sendSlackNotification(message);
    }
}
