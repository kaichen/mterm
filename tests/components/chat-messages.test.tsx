import React from 'react';
import test from 'ava';
import {render, getTextContent} from '../utils/test-helpers.js';
import {ChatMessages} from '../../src/components/chat-messages.jsx';
import {mockMessages, mockToolCallMessage} from '../__fixtures__/messages.js';

test('renders empty message list', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={[]}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	// Should render but be mostly empty
	const textContent = getTextContent(frame!);
	t.false(textContent.includes('SYSTEM'));
	t.false(textContent.includes('USER'));
});

test('renders basic messages correctly', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={mockMessages}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);

	// Check that all message content is rendered
	t.true(textContent.includes('You are a helpful assistant.'));
	t.true(textContent.includes('Hello, how are you?'));
	t.true(textContent.includes('I am doing well, thank you for asking!'));
	t.true(textContent.includes('Tool execution result'));
});

test('renders role badges for messages', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={mockMessages}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);

	// Check that role badges are rendered
	t.true(frame!.includes('SYSTEM'));
	t.true(frame!.includes('USER'));
	t.true(frame!.includes('ASSISTANT'));
	t.true(frame!.includes('TOOL:SEARCH_TOOL'));
});

test('displays loading spinner when isLoading is true', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={[]}
			isLoading={true}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Thinking...'));
});

test('displays error message', t => {
	const errorMessage = 'Connection failed';
	const {lastFrame} = render(
		<ChatMessages
			messages={[]}
			isLoading={false}
			error={errorMessage}
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: Connection failed'));
});

test('displays MCP error message', t => {
	const mcpErrorMessage = 'MCP server error';
	const {lastFrame} = render(
		<ChatMessages
			messages={[]}
			isLoading={false}
			error=""
			mcpError={mcpErrorMessage}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: MCP server error'));
});

test('filters out developer messages', t => {
	const messagesWithDeveloper = [
		...mockMessages,
		{
			role: 'developer' as const,
			content: 'Developer message should not appear',
		},
	];

	const {lastFrame} = render(
		<ChatMessages
			messages={messagesWithDeveloper}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.false(textContent.includes('Developer message should not appear'));
});

test('hides tool messages when hideToolMessages is true', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={mockMessages}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={true}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);

	// Should not show tool message content
	t.false(textContent.includes('Tool execution result'));
	// Should not show TOOL badge
	t.false(frame!.includes('TOOL:SEARCH_TOOL'));
});

test('shows tool messages when hideToolMessages is false', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={mockMessages}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);

	// Should show tool message content
	t.true(textContent.includes('Tool execution result'));
	// Should show TOOL badge
	t.true(frame!.includes('TOOL:SEARCH_TOOL'));
});

test('renders tool calls correctly', t => {
	const {lastFrame} = render(
		<ChatMessages
			messages={[mockToolCallMessage]}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);

	// Check tool call rendering
	t.true(textContent.includes('Tool Call:'));
	t.true(textContent.includes('search_tool'));
	t.true(textContent.includes('Args:'));
	t.true(textContent.includes('test query'));
});

test('handles multiple tool calls in single message', t => {
	const messageWithMultipleToolCalls = {
		role: 'assistant' as const,
		content: 'I will use multiple tools.',
		tool_calls: [
			{
				id: 'call_1',
				type: 'function' as const,
				function: {
					name: 'tool_one',
					arguments: JSON.stringify({param: 'value1'}),
				},
			},
			{
				id: 'call_2',
				type: 'function' as const,
				function: {
					name: 'tool_two',
					arguments: JSON.stringify({param: 'value2'}),
				},
			},
		],
	};

	const {lastFrame} = render(
		<ChatMessages
			messages={[messageWithMultipleToolCalls]}
			isLoading={false}
			error=""
			mcpError={null}
			hideToolMessages={false}
		/>
	);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);

	// Check both tool calls are rendered
	t.true(textContent.includes('tool_one'));
	t.true(textContent.includes('tool_two'));
	t.true(textContent.includes('value1'));
	t.true(textContent.includes('value2'));
});