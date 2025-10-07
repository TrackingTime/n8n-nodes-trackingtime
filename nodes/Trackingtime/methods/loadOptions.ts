import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Fetch the list of accounts available for the current credentials.
 */
export async function getAccounts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const apiResponse = (await this.helpers.requestWithAuthentication.call(
		this,
		'trackingtimeApi',
		{
			method: 'GET',
			baseURL: 'https://app.trackingtime.co/api/v4',
			url: '/teams',
			headers: {
				Accept: 'application/json',
			},
		},
	)) as IDataObject;

	const accounts = (apiResponse.data as IDataObject[] | undefined) ?? [];

	const options = accounts
		.filter((account) => account.account_id != null)
		.map((account) => {
			const accountId = account.account_id as string | number;
			const companyName = (account.company as string | undefined) ?? String(accountId);

			return {
				name: companyName,
				value: String(accountId),
			};
		});

	if (options.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			`TrackingTime /teams returned no selectable accounts. Debug: ${apiResponse}`,
		);
	}

	return options;
}
