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
		const fallbackDescription = extractDescription(error.description);
		const contextPayload = extractContextData(error.context);
		const originalMessages = Array.isArray(error.messages) ? error.messages.filter(Boolean) : [];
		const aggregatedDetails = [fallbackDescription, contextPayload, formatMessages(originalMessages)]
			.filter((value): value is string => value != null && value !== '')
			.join('\n');

		const resolvedMessage = `${debugLabel}: ${originalMessages[0] ?? error.message}`;

		throw new NodeOperationError(context.getNode(), resolvedMessage, {
			description: aggregatedDetails || undefined,
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

const extractContextData = (context: unknown): string | undefined => {
	if (!context || typeof context !== 'object') {
		return undefined;
	}

	const data = (context as { data?: JsonObject }).data ?? undefined;
	const payload = data && Object.keys(data).length > 0 ? data : context;

	if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
		return undefined;
	}

	return `Response data: ${JSON.stringify(payload)}`;
};

const formatMessages = (messages: string[]): string | undefined => {
	if (!messages.length) {
		return undefined;
	}

	return `Messages: ${messages.join(' | ')}`;
};
