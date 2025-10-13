import type {
	FieldType,
	ILoadOptionsFunctions,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';
import { trackingTimeApiRequest } from './genericFunctions';
import { handleTrackingTimeApiError } from '../utils';

export const TIME_ENTRY_SEARCH_ENTITY = 'Event';

type TrackingTimeDynamicField = {
	key?: string;
	label?: string;
	type?: string;
	required?: boolean;
};

type TrackingTimeDynamicFieldsResponse = {
	inputFields?: TrackingTimeDynamicField[];
};

export async function getTimeEntrySearchFields(
	this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
	const selectCriteria = this.getCurrentNodeParameter('selectCriteria') as string | undefined;

	if (!selectCriteria) {
		return {
			fields: [],
			emptyFieldsNotice: 'Select a search criteria to load the available filters.',
		};
	}

	let response: TrackingTimeDynamicFieldsResponse | undefined;

	try {
		response = (await trackingTimeApiRequest.call(
			this,
			'GET',
			'zapier/createInput',
			{},
			{
				entity: TIME_ENTRY_SEARCH_ENTITY,
				type: selectCriteria,
			},
		)) as TrackingTimeDynamicFieldsResponse;
	} catch (error) {
		handleTrackingTimeApiError(this, error, 'GET /zapier/createInput');
		return {
			fields: [],
		};
	}

	const inputFields = Array.isArray(response?.inputFields) ? response.inputFields : [];

	if (!Array.isArray(inputFields) || inputFields.length === 0) {
		return {
			fields: [],
			emptyFieldsNotice: 'TrackingTime did not return any filters for the selected criteria.',
		};
	}

	const fields: ResourceMapperField[] = inputFields.map((field, index) => {
		const id = field.key?.trim() || `field_${index}`;
		const displayName = field.label?.trim() || id;

		return {
			id,
			displayName,
			required: Boolean(field.required),
			display: true,
			defaultMatch: true,
			type: mapToResourceMapperType(field.type),
		};
	});

	return {
		fields,
	};
}

const mapToResourceMapperType = (rawType?: string): FieldType => {
	if (!rawType) {
		return 'string';
	}

	const normalized = rawType.toLowerCase();

	if (normalized.includes('date')) {
		return 'dateTime';
	}

	if (normalized.includes('time')) {
		return 'dateTime';
	}

	if (normalized.includes('number') || normalized.includes('integer')) {
		return 'number';
	}

	if (normalized.includes('bool')) {
		return 'boolean';
	}

	return 'string';
};
