import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TrackingtimeApi implements ICredentialType {
	name = 'trackingtimeApi';

	displayName = 'Trackingtime API';

	// Link to your community node's README
	documentationUrl = 'https://developers.trackingtime.co/#intro';

	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
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
			qs: {
				email: '={{$credentials.email}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.trackingtime.co/api/v4',
			url: '/login',
		},
	};
}
