import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

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
			url: '/teams',
		},
	)) as IDataObject;

	const accounts = (apiResponse.data as IDataObject[] | undefined) ?? [];

	return accounts
		.filter((account) => account.account_id != null)
		.map((account) => {
			const accountId = account.account_id as string | number;
			const companyName = (account.company as string | undefined) ?? String(accountId);

			return {
				name: companyName,
				value: String(accountId),
			};
		});
}
