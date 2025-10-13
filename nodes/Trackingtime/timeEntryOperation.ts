import type { INodeProperties } from 'n8n-workflow';

export const timeEntryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['timeEntry'],
			},
		},
		options: [
			{
				name: 'Add Time Entry',
				value: 'add',
				description: 'Add a new time entry',
				action: 'Add a time entry',
			},
			{
				name: 'Search Time Entry',
				value: 'search',
				description: 'Search for a time entry',
				action: 'Search a time entry',
			},
			{
				name: 'Update Time Entry',
				value: 'update',
				description: 'Update an existing time entry',
				action: 'Update a time entry',
			},
		],
		default: 'add',
	},
];

export const timeEntryFields: INodeProperties[] = [

	/* -------------------------------------------------------------------------- */
	/* timeEntry:add                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Account Name or ID',
		name: 'accountId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getAccounts',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['add', 'search', 'update'],
			},
		},
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				operation: ['add'],
				resource: ['timeEntry'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'string',
				default: '',
				description: 'Duraction in seconds',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
				description: 'End date and time of the entry',
			},
			{
				displayName: 'Extra Params (JSON Format)',
				name: 'json_',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: '{\n    "key": "value"\n}',
				description: 'Additional parameters in JSON format',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
			},
			{
				displayName: 'Project',
				name: 'project',
				type: 'string',
				default: '',
				description: 'Name, ID, or external ID of the project',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
				description: 'Start date and time of the entry',
			},
			{
				displayName: 'Third Party Time Entry ID',
				name: 'custom_field_id',
				type: 'string',
				default: '',
			},
			{
				displayName: 'User ID',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'ID of the user to assign the entry to',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/* timeEntry:search                             */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Search Criteria',
		name: 'selectCriteria',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				operation: ['search'],
				resource: ['timeEntry'],
			},
		},
		default: 'ByID',
		options: [
			{
				name: 'Project or Task Name',
				value: 'ByProjectOrTaskName',
			},
			{
				name: 'Project TrackingTime ID',
				value: 'ByProjectID',
			},
			{
				name: 'Task TrackingTime ID',
				value: 'ByTaskID',
			},
			{
				name: 'Third Party Project ID',
				value: 'ByProjectExternalID',
			},
			{
				name: 'Third Party Task ID',
				value: 'ByTaskExternalID',
			},
			{
				name: 'Third Party Time Entry ID',
				value: 'ByExternalID',
			},
			{
				name: 'TrackingTime ID',
				value: 'ByID',
			},
		],
	},
	{
		displayName: 'Search Fields',
		name: 'searchFields',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		noDataExpression: true,
		required: true,
		displayOptions: {
			show: {
				resource: ['timeEntry'],
				operation: ['search'],
			},
		},
			typeOptions: {
				resourceMapper: {
					resourceMapperMethod: 'getTimeEntrySearchFields',
					mode: 'map',
					valuesLabel: 'Filters',
					allowEmptyValues: false,
					supportAutoMap: false,
				},
			},
		},
	/* -------------------------------------------------------------------------- */
	/* timeEntry:update                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Time Entry ID',
		name: 'event_id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['update'],
				resource: ['timeEntry'],
			},
		},
		description: 'The TrackingTime ID of the time entry to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field to Update',
		displayOptions: {
			show: {
				operation: ['update'],
				resource: ['timeEntry'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'string',
				default: '',
				description: 'Duraction in seconds',
			},
			{
				displayName: 'End',
				name: 'end',
				type: 'dateTime',
				default: '',
				description: 'End date and time of the entry',
			},
			{
				displayName: 'Extra Params (JSON Format)',
				name: 'json_',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: '{\n    "key": "value"\n}',
				description: 'Additional parameters in JSON format',
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
			},
			{
				displayName: 'Project',
				name: 'project',
				type: 'string',
				default: '',
				description: 'Name, ID, or external ID of the project',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'dateTime',
				default: '',
				description: 'Start date and time of the entry',
			},
			{
				displayName: 'Third Party Time Entry ID',
				name: 'custom_field_id',
				type: 'string',
				default: '',
			},
			{
				displayName: 'User',
				name: 'user_id',
				type: 'string',
				default: '',
				description: 'ID of the user to assign the entry to',
			},
		],
	},
];
