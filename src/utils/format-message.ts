import {Message} from '../types.js';

// Convert internal message format to OpenAI format
export const convertToOpenAIMessage = (message: Message) => {
	// Handle developer role as system
	if (message.role === 'developer') {
		return {
			role: 'system' as const,
			content: message.content,
		};
	}

	// Handle each role with the appropriate type
	switch (message.role) {
		case 'system':
			return {
				role: 'system' as const,
				content: message.content,
			};
		case 'user':
			return {
				role: 'user' as const,
				content: message.content,
			};
		case 'assistant':
			return {
				role: 'assistant' as const,
				content: message.content,
				tool_calls: message.tool_calls,
			};
		case 'tool':
			// Skip tool messages that don't have required tool_call_id
			if (!message.tool_call_id) {
				return {
					role: 'user' as const,
					content: `Tool response without ID: ${message.content}`,
				};
			}
			return {
				role: 'tool' as const,
				content: message.content,
				tool_call_id: message.tool_call_id,
				name: message.name,
			};
		default:
			// This shouldn't happen with proper typing but just in case
			return {
				role: 'user' as const,
				content: message.content,
			};
	}
};
