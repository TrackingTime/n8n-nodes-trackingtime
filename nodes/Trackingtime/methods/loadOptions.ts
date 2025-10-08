import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { TRACKINGTIME_BASE_URL } from '../constants';

/**
 * Fetch the list of accounts available for the current credentials.
 */
export async function getAccounts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const rawResponse = (await this.helpers.requestWithAuthentication.call(
		this,
		'trackingtimeApi',
		{
			method: 'GET',
			baseURL: TRACKINGTIME_BASE_URL,
			url: '/teams?filter=ACTIVE',
			headers: {
				Accept: 'application/json',
			},
		},
	)) as IDataObject | string;

	let apiResponse: IDataObject;

	if (typeof rawResponse === 'string') {
		try {
			apiResponse = JSON.parse(rawResponse) as IDataObject;
		} catch (parseError: unknown) {
			const reason = parseError instanceof Error ? parseError.message : 'Unknown JSON parse error';
			throw new NodeOperationError(
				this.getNode(),
				`TrackingTime /teams returned invalid JSON (${reason}). Raw response: ${rawResponse}`,
			);
		}
	} else {
		apiResponse = rawResponse;
	}

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
			`TrackingTime /teams returned no selectable accounts. Debug: ${JSON.stringify(apiResponse)}`,
		);
	}

	return options;
}
