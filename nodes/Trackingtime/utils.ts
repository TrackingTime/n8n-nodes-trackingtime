import type { IDataObject, INode, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

type NodeContext = {
	getNode(): INode;
};

/**
 * Normalize TrackingTime API responses to JSON objects, throwing a descriptive error when parsing fails.
 */
export const parseTrackingTimeResponse = (
	context: NodeContext,
	rawResponse: IDataObject | string,
	debugLabel?: string,
): IDataObject => {
	if (typeof rawResponse === 'string') {
		const trimmed = rawResponse.trim();

		if (trimmed === '') {
			return {};
		}

		try {
			return JSON.parse(trimmed) as IDataObject;
		} catch (error: unknown) {
			const reason = error instanceof Error ? error.message : 'Unknown JSON parse error';
			const label = debugLabel ? `${debugLabel}: ` : '';

			throw new NodeOperationError(
				context.getNode(),
				`${label}TrackingTime API returned invalid JSON (${reason}).`,
				{ description: trimmed },
			);
		}
	}

	return rawResponse;
};

export const handleTrackingTimeApiError = (
	context: NodeContext,
	error: unknown,
	debugLabel: string,
): never => {
	if (error instanceof NodeApiError) {
		const description = extractDescription(error.description);
		throw new NodeOperationError(context.getNode(), `${debugLabel}: ${error.message}`, {
			description,
		});
	}

	if (error instanceof Error) {
		throw new NodeOperationError(context.getNode(), `${debugLabel}: ${error.message}`);
	}

	throw new NodeOperationError(context.getNode(), `${debugLabel}: ${String(error)}`);
};

const extractDescription = (description: unknown): string | undefined => {
	if (description == null) {
		return undefined;
	}

	if (typeof description === 'string') {
		return description;
	}

	try {
		return JSON.stringify(description as JsonObject);
	} catch (stringifyError) {
		return `Unable to stringify error description: ${String(stringifyError)}`;
	}
};
