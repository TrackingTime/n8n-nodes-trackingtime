import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getAccounts } from './methods/loadOptions';

type ResponseError = {
	response?: {
		status?: number;
	};
};

export class TrackingtimeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime Trigger',
		name: 'trackingtimeTrigger',
		icon: { light: 'file:trackingtime.svg', dark: 'file:trackingtime.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: 'Watch Time Entries',
		description: 'Receive updates whenever time entries are created or updated.',
		defaults: {
			name: 'TrackingTime Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [{ name: 'trackingtimeApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				path: 'time-entry-updates',
				responseMode: 'onReceived',
				restartWebhookOnSessionChange: true,
			},
		],
		properties: [
			{
				displayName: 'Account',
				name: 'accountId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAccounts',
				},
				required: true,
				default: '',
				description:
					'Select Account',
			},
		],
	};

	methods = {
		loadOptions: {
			getAccounts,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as IDataObject;
				if (!webhookData.externalHookId) {
					return false;
				}

				const accountId = this.getNodeParameter('accountId') as string;

				try {
					const response = (await this.helpers.requestWithAuthentication.call(
						this,
						'trackingtimeApi',
						{
							method: 'GET',
							url: `/${accountId}/webhooks`,
						},
					)) as IDataObject;

					const webhooks = (response.data as IDataObject[] | undefined) ?? [];

					return webhooks.some(
						(webhook) => String(webhook.id) === String(webhookData.externalHookId),
					);
				} catch (error: unknown) {
					// If the webhook can't be found, ensure it gets recreated.
					const status = (error as ResponseError).response?.status;
					if (status === 404) {
						delete webhookData.externalHookId;
						delete webhookData.secret;
						return false;
					}

					throw error;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const accountId = this.getNodeParameter('accountId') as string;
				const webhookUrl = this.getNodeWebhookUrl('default');

				const response = (await this.helpers.requestWithAuthentication.call(
					this,
					'trackingtimeApi',
					{
						method: 'GET',
						url: `/${accountId}/webhooks/add`,
						qs: {
							url: webhookUrl,
							events: 'event.updated,event.created',
							grouped: 'false',
						},
					},
				)) as IDataObject;

				const webhookInfo = response.data as IDataObject | undefined;

				if (!webhookInfo?.id) {
					throw new NodeOperationError(this.getNode(), 'Webhook creation failed: missing webhook id.');
				}

				const webhookData = this.getWorkflowStaticData('node') as IDataObject;
				webhookData.externalHookId = webhookInfo.id;

				if (webhookInfo.secret) {
					webhookData.secret = webhookInfo.secret;
				}

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as IDataObject;
				const externalHookId = webhookData.externalHookId as string | undefined;

				if (!externalHookId) {
					return true;
				}

				const accountId = this.getNodeParameter('accountId') as string;

				try {
					await this.helpers.requestWithAuthentication.call(this, 'trackingtimeApi', {
						method: 'GET',
						url: `/${accountId}/webhooks/${externalHookId}/delete`,
					});
				} catch (error: unknown) {
					const status = (error as ResponseError).response?.status;
					if (status !== 404) {
						throw error;
					}
				}

				delete webhookData.externalHookId;
				delete webhookData.secret;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;

		return {
			workflowData: [
				[
					{
						json: bodyData,
					},
				],
			],
		};
	}
}
