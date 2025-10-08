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

export const summarizeTrackingTimeError = (
	error: unknown,
	debugLabel?: string,
): { message: string; description?: string } => {
	const prefix = debugLabel ? `${debugLabel}: ` : '';

	if (error instanceof NodeApiError) {
		const fallbackDescription = extractDescription(error.description);
		const contextPayload = extractContextData(error.context);
		const originalMessages = Array.isArray(error.messages) ? error.messages.filter(Boolean) : [];
		const extraMessages = originalMessages.slice(1);
		const aggregatedDetails = [
			fallbackDescription,
			contextPayload,
			formatMessages(extraMessages),
		]
			.filter((value): value is string => value != null && value !== '')
			.join('\n');

		return {
			message: `${prefix}${originalMessages[0] ?? error.message}`,
			description: aggregatedDetails || undefined,
		};
	}

	if (error instanceof Error) {
		return {
			message: `${prefix}${error.message}`,
		};
	}

	return {
		message: `${prefix}${String(error)}`,
	};
};

export const handleTrackingTimeApiError = (
	context: NodeContext,
	error: unknown,
	debugLabel: string,
): never => {
	const summary = summarizeTrackingTimeError(error, debugLabel);

	throw new NodeOperationError(context.getNode(), summary.message, {
		description: summary.description,
	});
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
