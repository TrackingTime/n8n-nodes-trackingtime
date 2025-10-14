import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
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
	
	const options: IHttpRequestOptions = {
		method,
		qs: query,
		url: uri ?? `${TRACKINGTIME_BASE_URL}/${resource}`,
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

	return (await this.helpers.httpRequestWithAuthentication.call(this, credentialType, options)) as T;
}

const toSnakeCase = (value: string): string =>
	value
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/[\s-]+/g, '_')
		.toLowerCase();

export function keysToSnakeCase(elements: IDataObject[] | IDataObject): IDataObject[] {
	if (elements === undefined) {
		return [];
	}
	if (!Array.isArray(elements)) {
		elements = [elements];
	}
	for (const element of elements) {
		for (const key of Object.keys(element)) {
			const snakeKey = toSnakeCase(key);

			if (key !== snakeKey) {
				element[snakeKey] = element[key];
				delete element[key];
			}
		}
	}
	return elements;
}
