import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { trackingTimeApiRequest } from './methods/genericFunctions';
import { timeEntryFields, timeEntryOperations } from './timeEntryOperation';

//import { productFields, productOperations } from './ProductDescription';
//import type { IProduct } from './ProductInterface';

type TrackingTimeAction = {
	id?: string;
	url?: string;
};

type TrackingTimeResponse = {
	data?: TrackingTimeAction[];
};

export class TrackingTime implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime',
		name: 'trackingtime',
		icon: 'file:TrackingTime.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Simple, powerful time and attendance tracking API.',
		defaults: {
			name: 'TrackingTime',
		},
		usableAsTool: true,
		inputs: [/* `NodeConnectionTypes` is an enum that defines the different types of connections that a
        node can have in n8n workflows. It is used to specify the input and output connection
        types for a node. In this context, it is being used to define the type of connections
        that the `TrackingTime` node can have. */
        NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'trackingtimeApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Time Entry',
						value: 'timeEntry',
					}
				],
				default: 'timeEntry',
			},
			// ORDER
			...timeEntryOperations,
			...timeEntryFields
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		const qs: IDataObject = {};
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);
		for (let i = 0; i < length; i++) {
			try {
				if (resource === 'timeEntry') {
					if (operation === 'add') {
                        const fields = this.getNodeParameter('fields', i) as IDataObject;
                        const accountId = this.getNodeParameter('accountId', i) as string;

                        if (fields.duration) qs.duration = fields.duration;
                        if (fields.project) qs.project_name = fields.project;
                        if (fields.start) qs.start = fields.start;
                        if (fields.end) qs.end = fields.end;
                        if (fields.user_id) qs.user_id = fields.user_id;
                        if (fields.notes) qs.notes = fields.notes;

                        const customFieldsArray: IDataObject[] = [];

                        if (fields.json_) {
                            try {
                                const parsedJson = JSON.parse(fields.json_ as string);

                                if (parsedJson.parameters && Array.isArray(parsedJson.parameters)) {
                                    for (const param of parsedJson.parameters) {
                                        qs[param.parameter] = param.value;
                                    }
                                }

                                if (parsedJson.custom_fields && Array.isArray(parsedJson.custom_fields)) {
                                    for (const cf of parsedJson.custom_fields) {
                                        customFieldsArray.push({ id: cf.id, value: cf.value });
                                    }
                                }
                            } catch (error) {
                                this.logger.error(error);
                                throw new NodeOperationError(this.getNode(), 'The Field Extra Params is not a valid JSON.', { itemIndex: i });
                            }
                        }

                        if (fields.custom_field_id) {
                            customFieldsArray.push({ slug: 'EVENT_THIRD_PARTY_ID', value: fields.custom_field_id });
                            customFieldsArray.push({ slug: 'EVENT_THIRD_PARTY_SERVICE', value: 'N8N' });
                        }

                        if (customFieldsArray.length > 0) {
                            qs.custom_fields = JSON.stringify(customFieldsArray);
                        }

                        responseData = await trackingTimeApiRequest.call(this, 'GET', `/${accountId}/events/add`, {}, qs) as TrackingTimeResponse;

                        responseData = responseData?.data;
                    }
					if (operation === 'search') {
						/*const orderId = this.getNodeParameter('orderId', i) as string;
						responseData = await shopifyApiRequest.call(this, 'DELETE', `/orders/${orderId}.json`);
						responseData = { success: true };*/
					}
					if (operation === 'update') {
						/*const orderId = this.getNodeParameter('orderId', i) as string;
						const options = this.getNodeParameter('options', i);
						if (options.fields) {
							qs.fields = options.fields as string;
						}
						responseData = await shopifyApiRequest.call(
							this,
							'GET',
							`/orders/${orderId}.json`,
							{},
							qs,
						);
						responseData = responseData.order;*/
					}
				} else if (resource === 'product') {
					/*const productId = this.getNodeParameter('productId', i, '') as string;
					let body: IProduct = {};
					//https://shopify.dev/docs/admin-api/rest/reference/products/product#create-2020-04
					if (operation === 'create') {
						const title = this.getNodeParameter('title', i) as string;

						const additionalFields = this.getNodeParameter('additionalFields', i, {});

						if (additionalFields.productOptions) {
							const metadata = (additionalFields.productOptions as IDataObject)
								.option as IDataObject[];
							additionalFields.options = {};
							for (const data of metadata) {
								//@ts-ignore
								additionalFields.options[data.name as string] = data.value;
							}
							delete additionalFields.productOptions;
						}

						body = additionalFields;

						body.title = title;

						responseData = await shopifyApiRequest.call(this, 'POST', '/products.json', {
							product: body,
						});
						responseData = responseData.product;
					}
					if (operation === 'delete') {
						//https://shopify.dev/docs/admin-api/rest/reference/products/product#destroy-2020-04
						responseData = await shopifyApiRequest.call(
							this,
							'DELETE',
							`/products/${productId}.json`,
						);
						responseData = { success: true };
					}
					if (operation === 'get') {
						//https://shopify.dev/docs/admin-api/rest/reference/products/product#show-2020-04
						const additionalFields = this.getNodeParameter('additionalFields', i, {});
						Object.assign(qs, additionalFields);
						responseData = await shopifyApiRequest.call(
							this,
							'GET',
							`/products/${productId}.json`,
							{},
							qs,
						);
						responseData = responseData.product;
					}
					if (operation === 'getAll') {
						//https://shopify.dev/docs/admin-api/rest/reference/products/product#index-2020-04
						const additionalFields = this.getNodeParameter('additionalFields', i, {});

						const returnAll = this.getNodeParameter('returnAll', i);

						Object.assign(qs, additionalFields);

						if (returnAll) {
							responseData = await trackingTimeApiRequest.call(
								this,
								'products',
								'GET',
								'/products.json',
								{},
								qs,
							);
						} else {
							qs.limit = this.getNodeParameter('limit', i);
							responseData = await shopifyApiRequest.call(this, 'GET', '/products.json', {}, qs);
							responseData = responseData.products;
						}
					}
					if (operation === 'update') {
						//https://shopify.dev/docs/admin-api/rest/reference/products/product?api[version]=2020-07#update-2020-07
						const updateFields = this.getNodeParameter('updateFields', i, {});

						if (updateFields.productOptions) {
							const metadata = (updateFields.productOptions as IDataObject).option as IDataObject[];
							updateFields.options = {};
							for (const data of metadata) {
								//@ts-ignore
								updateFields.options[data.name as string] = data.value;
							}
							delete updateFields.productOptions;
						}

						body = updateFields;

						responseData = await shopifyApiRequest.call(
							this,
							'PUT',
							`/products/${productId}.json`,
							{ product: body },
						);

						responseData = responseData.product;
					}*/
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}