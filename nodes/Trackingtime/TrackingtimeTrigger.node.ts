import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { getAccounts } from './methods/loadOptions';
import { trackingTimeApiRequest } from './methods/genericFunctions';

type TrackingTimeWebhook = {
	id?: string;
	url?: string;
};

type TrackingTimeWebhookListResponse = {
	webhooks?: {
		data?: TrackingTimeWebhook[];
	};
};

type TrackingTimeWebhookCreateResponse = {
	data?: {
		id?: string | number;
		secret?: string | number | null;
	};
};


export class TrackingtimeTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime Trigger',
		name: 'trackingtimeTrigger',
		icon: 'file:trackingtime.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Handle TrackingTime events via webhooks',
		defaults: {
			name: 'TrackingTime Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'trackingtimeApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				path: 'webhook',
				responseMode: 'onReceived'
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
			{
				displayName: 'Watch',
				name: 'topic',
				type: 'options',
				default: 'time-entries',
				options: [
					{
						name: 'Time Entries',
						value: 'time-entries',
					},
				]
			}
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
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const accountId = this.getNodeParameter('accountId') as string;
				const endpoint = `/${accountId}/webhooks`;

				const { webhooks } = (await trackingTimeApiRequest.call(this, 'GET', endpoint, {}, {})) as TrackingTimeWebhookListResponse;

				for (const webhook of webhooks?.data ?? []) {
					if (webhook.url === webhookUrl) {
						webhookData.webhookId = webhook.id;
						return true;
					}
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const topic = this.getNodeParameter('topic') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const accountId = this.getNodeParameter('accountId') as string;
				const endpoint = `/${accountId}/webhooks/add`;
				let events;
				if(topic === 'time-entries'){
					events = 'event.updated,event.created';
				}

				const query = {
					url: webhookUrl,
					events: events,
					grouped: 'false'
				};

				const responseData = (await trackingTimeApiRequest.call(this, 'GET', endpoint, {}, query)) as TrackingTimeWebhookCreateResponse;

				if (responseData.data === undefined || responseData.data.id === undefined) {
					// Required data is missing so was not successful
					return false;
				}

				webhookData.webhookId = responseData.data.id as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const accountId = this.getNodeParameter('accountId') as string;

				if (webhookData.webhookId !== undefined) {
					const endpoint = `/${accountId}/webhooks/${webhookData.webhookId}/delete`;
					try {
						await trackingTimeApiRequest.call(this, 'GET', endpoint, {});
					} catch {
						return false;
					}
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();

		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject)],
		};
	}
}
