import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { TRACKINGTIME_BASE_URL } from './constants';
import { getAccounts } from './methods/loadOptions';
import { handleTrackingTimeApiError, parseTrackingTimeResponse } from './utils';

type ResponseError = {
	response?: {
		status?: number;
	};
};

export class TrackingtimeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime - Trigger',
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
		requestDefaults: {
			baseURL: TRACKINGTIME_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
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
				displayName: 'Account Name or ID',
				name: 'accountId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAccounts',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
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
							baseURL: TRACKINGTIME_BASE_URL,
							url: `/${accountId}/webhooks`,
						},
					)) as IDataObject | string;

					const parsedResponse = parseTrackingTimeResponse(this, response, 'GET /webhooks');

					const webhooks = (parsedResponse.data as IDataObject[] | undefined) ?? [];

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

					handleTrackingTimeApiError(this, error, 'TrackingTime webhook check');
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const accountId = this.getNodeParameter('accountId') as string;
				const webhookUrl = this.getNodeWebhookUrl('default');

				try {
					const response = (await this.helpers.requestWithAuthentication.call(
						this,
						'trackingtimeApi',
						{
							method: 'GET',
							baseURL: TRACKINGTIME_BASE_URL,
							url: `/${accountId}/webhooks/add`,
							qs: {
								url: webhookUrl,
								events: 'event.updated,event.created',
								grouped: 'false',
							},
						},
					)) as IDataObject | string;

					const parsedResponse = parseTrackingTimeResponse(this, response, 'GET /webhooks/add');
					const webhookInfo = parsedResponse.data as IDataObject | undefined;

					if (!webhookInfo?.id) {
						throw new NodeOperationError(this.getNode(), 'Webhook creation failed: missing webhook id.');
					}

					const webhookData = this.getWorkflowStaticData('node') as IDataObject;
					webhookData.externalHookId = webhookInfo.id;

					if (webhookInfo.secret) {
						webhookData.secret = webhookInfo.secret;
					}

					return true;
				} catch (error: unknown) {
					handleTrackingTimeApiError(this, error, 'TrackingTime webhook creation');
				}

				return false;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node') as IDataObject;
				const externalHookId = webhookData.externalHookId as string | undefined;

				if (!externalHookId) {
					return true;
				}

				const accountId = this.getNodeParameter('accountId') as string;

				try {
					const response = (await this.helpers.requestWithAuthentication.call(
						this,
						'trackingtimeApi',
						{
							method: 'GET',
							baseURL: TRACKINGTIME_BASE_URL,
							url: `/${accountId}/webhooks/${externalHookId}/delete`,
						},
					)) as IDataObject | string;

					// Ensure the response is valid JSON even if we do not use it afterward.
					parseTrackingTimeResponse(this, response, 'GET /webhooks/{id}/delete');
				} catch (error: unknown) {
					const status = (error as ResponseError).response?.status;
					if (status !== 404) {
						handleTrackingTimeApiError(this, error, 'TrackingTime webhook deletion');
					}
				}

				delete webhookData.externalHookId;
				delete webhookData.secret;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const items = Array.isArray(bodyData)
			? bodyData.map((entry) => ({ json: (entry ?? {}) as IDataObject }))
			: [{ json: (bodyData ?? {}) as IDataObject }];

		return {
			workflowData: [items],
		};
	}
}
