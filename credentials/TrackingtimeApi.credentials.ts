import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TrackingtimeApi implements ICredentialType {
	name = 'trackingtimeApi';

	displayName = 'Trackingtime API';

	documentationUrl = 'https://support.trackingtime.co/en/articles/6329119-apps-integrations#h_e56a576a42';

	properties: INodeProperties[] = [
		{
			displayName: 'App Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: 'API_TOKEN',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.trackingtime.co/api/v4',
			url: '/teams',
		}
	};
}
