import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { User } from '../users/user.entity';
import { Dataset } from '../datasets/dataset.entity';

@Injectable()
export class NotificationsService {
    constructor(private readonly httpService: HttpService) { }

    async sendSlackNewUserNotification(user: User): Promise<void> {
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!slackWebhookUrl) {
            Logger.warn('SLACK_WEBHOOK_URL not set. Skipping notification.', 'NotificationsService');
            return;
        }
        const message = {
            text: `New user registered: ${user.firstName} ${user.lastName}`,
        };

        try {
            await firstValueFrom(this.httpService.post(slackWebhookUrl, message));
        } catch (error) {
            // Log the error but don't block the main process
            console.error('Could not send Slack notification', error);
        }
    }

    async sendSlackNewDatasetRequestNotification(dataset: Dataset): Promise<void> {
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!slackWebhookUrl) {
            Logger.warn('SLACK_WEBHOOK_URL not set. Skipping notification for new dataset.', 'NotificationsService');
            return;
        }

        const description = dataset.description ?
            (dataset.description.length > 250 ? `${dataset.description.substring(0, 247)}...` : dataset.description)
            : 'No description provided.';

        const tags = dataset.tags?.map(t => t.name).join(', ') || 'No tags';
        const updateFrequency = `${dataset.updateFrequency} ${dataset.updateFrequencyUnit}`;

        const message = {
            text: `New Dataset Approval Request: *${dataset.name}*`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: 'New Dataset Add Request',
                        emoji: true,
                    },
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*Dataset Name:*\n${dataset.name}` },
                        { type: 'mrkdwn', text: `*Created By:*\n${dataset.user.firstName} ${dataset.user.lastName}` },
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

        Logger.log(`Sending Slack notification for new dataset request: ${JSON.stringify(message)}`, 'NotificationsService');

        try {
            await firstValueFrom(this.httpService.post(slackWebhookUrl, message));
        } catch (error) {
            // Log the error but don't block the main process
            Logger.error('Could not send Slack notification for new dataset', error);
        }
    }
}
