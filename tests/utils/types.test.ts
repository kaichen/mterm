import test from 'ava';
import type {Message, Tool, ToolCall, FlatTool} from '../../src/types.js';

test('Message type has correct structure', t => {
	const message: Message = {
		role: 'user',
		content: 'test message',
	};

	t.is(message.role, 'user');
	t.is(message.content, 'test message');
});

test('Message with tool_calls has correct structure', t => {
	const message: Message = {
		role: 'assistant',
		content: 'Using a tool',
		tool_calls: [
			{
				id: 'call_123',
				type: 'function',
				function: {
					name: 'test_tool',
					arguments: '{"param": "value"}',
				},
			},
		],
	};

	t.is(message.tool_calls?.length, 1);
	t.is(message.tool_calls?.[0]?.function.name, 'test_tool');
});

test('Tool type has correct structure', t => {
	const tool: Tool = {
		type: 'function',
		function: {
			name: 'test_function',
			description: 'A test function',
			parameters: {type: 'object'},
		},
	};

	t.is(tool.type, 'function');
	t.is(tool.function.name, 'test_function');
	t.is(tool.function.description, 'A test function');
});

test('FlatTool type has correct structure', t => {
	const flatTool: FlatTool = {
		name: 'search',
		description: 'Search for information',
		inputSchema: {type: 'object'},
		serverId: 'server_1',
	};

	t.is(flatTool.name, 'search');
	t.is(flatTool.description, 'Search for information');
	t.is(flatTool.serverId, 'server_1');
});

test('ToolCall type has correct structure', t => {
	const toolCall: ToolCall = {
		id: 'call_456',
		type: 'function',
		function: {
			name: 'calculator',
			arguments: '{"operation": "add", "numbers": [1, 2]}',
		},
	};

	t.is(toolCall.id, 'call_456');
	t.is(toolCall.type, 'function');
	t.is(toolCall.function.name, 'calculator');
});