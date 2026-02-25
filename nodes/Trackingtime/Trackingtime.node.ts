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
import { getTimeEntrySearchFields, TIME_ENTRY_SEARCH_ENTITY } from './methods/resourceMapping';
import { getAccounts } from './methods/loadOptions';

//import { productFields, productOperations } from './ProductDescription';
//import type { IProduct } from './ProductInterface';

type TrackingTimeAction = {
	id?: string;
	url?: string;
};

type TrackingTimeResponse = {
	data?: TrackingTimeAction[];
};

export class Trackingtime implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TrackingTime',
		name: 'trackingtime',
		icon: 'file:trackingtime.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Simple, powerful time and attendance tracking API.',
		defaults: {
			name: 'TrackingTime',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
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

	methods = {
		loadOptions: {
			getAccounts,
		},
		resourceMapping: {
			getTimeEntrySearchFields,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < length; i++) {
			try {
				let responseData: TrackingTimeAction[] | TrackingTimeAction | undefined;

				if (resource === 'timeEntry') {
					const accountId = this.getNodeParameter('accountId', i) as string;

					const buildTimeEntryQuery = (fields: IDataObject): IDataObject => {
						const query: IDataObject = {};
						const customFieldsArray: IDataObject[] = [];

						const assignIfPresent = (sourceKey: string, targetKey?: string) => {
							const value = fields[sourceKey];

							if (value === undefined || value === null || value === '') {
								return;
							}

							query[targetKey ?? sourceKey] = value;
						};

						assignIfPresent('duration');
						assignIfPresent('project', 'project_name');
						assignIfPresent('start');
						assignIfPresent('end');
						assignIfPresent('user_id');
						assignIfPresent('notes');

						const rawJson = fields.json_;

						if (typeof rawJson === 'string' && rawJson.trim() !== '') {
							try {
								const parsedJson = JSON.parse(rawJson);

								if (parsedJson.parameters && Array.isArray(parsedJson.parameters)) {
									for (const param of parsedJson.parameters) {
										if (param?.parameter) {
											query[param.parameter] = param.value;
										}
									}
								}

								if (parsedJson.custom_fields && Array.isArray(parsedJson.custom_fields)) {
									for (const cf of parsedJson.custom_fields) {
										if (cf?.id !== undefined) {
											customFieldsArray.push({ id: cf.id, value: cf.value });
										}
									}
								}
							} catch (error) {
								this.logger.error(error);
								throw new NodeOperationError(
									this.getNode(),
									'The Field Extra Params is not a valid JSON.',
									{ itemIndex: i },
								);
							}
						}

						if (typeof fields.custom_field_id === 'string' && fields.custom_field_id.trim() !== '') {
							customFieldsArray.push({
								slug: 'EVENT_THIRD_PARTY_ID',
								value: fields.custom_field_id,
							});
							customFieldsArray.push({ slug: 'EVENT_THIRD_PARTY_SERVICE', value: 'N8N' });
						}

						if (customFieldsArray.length > 0) {
							query.custom_fields = JSON.stringify(customFieldsArray);
						}

						return query;
					};

					if (operation === 'add') {
						const fields = this.getNodeParameter('fields', i) as IDataObject;
						const query = buildTimeEntryQuery(fields);
						const addResponse = (await trackingTimeApiRequest.call(
							this,
							'GET',
							`/${accountId}/events/add`,
							{},
							query,
						)) as TrackingTimeResponse;

						responseData = addResponse?.data ?? [];
					}
					if (operation === 'search') {
						const selectCriteria = this.getNodeParameter('selectCriteria', i) as string;
						const mappingMode = this.getNodeParameter('searchFields.mappingMode', i) as string;

						if (mappingMode !== 'defineBelow') {
							throw new NodeOperationError(
								this.getNode(),
								'Only the "Define Below" option is supported for Search Fields.',
								{ itemIndex: i },
							);
						}

						const rawFilters = this.getNodeParameter('searchFields.value', i, {}) as IDataObject;
						const query: IDataObject = {};

						for (const [key, value] of Object.entries(rawFilters)) {
							if (value === undefined || value === null) {
								continue;
							}

							if (typeof value === 'string' && value.trim() === '') {
								continue;
							}

							query[key] = value;
						}

						query.type = selectCriteria;
						query.entity = TIME_ENTRY_SEARCH_ENTITY;

						const endpoint = `/${accountId}/search/events`;
						const searchResponse = (await trackingTimeApiRequest.call(
							this,
							'GET',
							endpoint,
							{},
							query,
						)) as TrackingTimeResponse;

						responseData = searchResponse?.data ?? [];
					}

					if (operation === 'update') {
						const eventId = this.getNodeParameter('event_id', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
						const query = buildTimeEntryQuery(updateFields);

						query.event_id = eventId;

						const endpoint = `/${accountId}/events/${eventId}/update`;
						const updateResponse = (await trackingTimeApiRequest.call(
							this,
							'GET',
							endpoint,
							{},
							query,
						)) as TrackingTimeResponse;

						responseData = updateResponse?.data ?? [];
					}
				}

				const normalizedData = Array.isArray(responseData)
					? responseData
					: responseData
					? [responseData]
					: [];
				const itemsToReturn =
					normalizedData.length > 0 ? (normalizedData as IDataObject[]) : [{} as IDataObject];

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(itemsToReturn),
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
