import type {Message} from '../../src/types.js';

export const mockMessages: Message[] = [
	{
		role: 'system',
		content: 'You are a helpful assistant.',
	},
	{
		role: 'user',
		content: 'Hello, how are you?',
	},
	{
		role: 'assistant',
		content: 'I am doing well, thank you for asking!',
	},
	{
		role: 'tool',
		content: 'Tool execution result',
		name: 'search_tool',
		tool_call_id: 'call_123',
	},
];

export const mockToolCallMessage: Message = {
	role: 'assistant',
	content: 'I will search for that information.',
	tool_calls: [
		{
			id: 'call_123',
			type: 'function',
			function: {
				name: 'search_tool',
				arguments: JSON.stringify({query: 'test query'}),
			},
		},
	],
};