import { type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { userDescription } from './resources/user';
import { companyDescription } from './resources/company';

export class Trackingtime implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime',
		name: 'trackingtime',
		icon: { light: 'file:trackingtime.svg', dark: 'file:trackingtime.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Simple, powerful time and attendance tracking API.',
		defaults: {
			name: 'TrackingTime',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'trackingtimeApi', required: true }],
		requestDefaults: {
			baseURL: 'https://app.trackingtime.co/api/v4',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Company',
						value: 'company',
					},
				],
				default: 'user',
			},
			...userDescription,
			...companyDescription,
		],
	};
}
