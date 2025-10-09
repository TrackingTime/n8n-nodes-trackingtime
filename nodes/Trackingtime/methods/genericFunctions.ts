import { snakeCase } from 'change-case';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { TRACKINGTIME_BASE_URL } from '../constants';

export async function trackingTimeApiRequest<T = IDataObject>(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,

	body: IDataObject = {},
	query: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
): Promise<T> {
    const credentialType = 'trackingtimeApi';
	
    const options: IRequestOptions = {
		method,
		qs: query,
		uri: uri || `${TRACKINGTIME_BASE_URL}/${resource}`,
		body,
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}
	if (Object.keys(body as IDataObject).length === 0) {
		delete options.body;
	}
	if (Object.keys(query).length === 0) {
		delete options.qs;
	}

	return (await this.helpers.requestWithAuthentication.call(this, credentialType, options)) as T;
}

export function keysToSnakeCase(elements: IDataObject[] | IDataObject): IDataObject[] {
	if (elements === undefined) {
		return [];
	}
	if (!Array.isArray(elements)) {
		elements = [elements];
	}
	for (const element of elements) {
		for (const key of Object.keys(element)) {
			if (key !== snakeCase(key)) {
				element[snakeCase(key)] = element[key];
				delete element[key];
			}
		}
	}
	return elements;
}
