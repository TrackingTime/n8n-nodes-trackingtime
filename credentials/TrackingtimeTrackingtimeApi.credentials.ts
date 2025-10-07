import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TrackingtimeTrackingtimeApi implements ICredentialType {
	name = 'trackingtimeTrackingtimeApi';

	displayName = 'Trackingtime Trackingtime API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/@trackingtime/-trackingtime?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
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
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.trackingtime.co/api/v4',
			url: '/v1/user',
		},
	};
}
