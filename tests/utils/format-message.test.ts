import {describe, it, expect} from 'vitest';
import {convertToOpenAIMessage} from '../../src/utils/format-message.js';
import type {Message} from '../../src/types.js';

describe('formatMessage utils', () => {
	describe('convertToOpenAIMessage', () => {
		it('should convert user message correctly', () => {
			const userMessage: Message = {
				role: 'user',
				content: 'Hello, how are you?',
			};

			const result = convertToOpenAIMessage(userMessage);

			expect(result).toEqual({
				role: 'user',
				content: 'Hello, how are you?',
			});
		});

		it('should convert assistant message with tool_calls', () => {
			const assistantMessage: Message = {
				role: 'assistant',
				content: 'I need to use a tool',
				tool_calls: [{
					id: 'call_123',
					type: 'function',
					function: {
						name: 'test_function',
						arguments: '{"param": "value"}',
					},
				}],
			};

			const result = convertToOpenAIMessage(assistantMessage);

			expect(result).toEqual({
				role: 'assistant',
				content: 'I need to use a tool',
				tool_calls: [{
					id: 'call_123',
					type: 'function',
					function: {
						name: 'test_function',
						arguments: '{"param": "value"}',
					},
				}],
			});
		});

		it('should convert developer role to system role', () => {
			const developerMessage: Message = {
				role: 'developer',
				content: 'System prompt for the assistant',
			};

			const result = convertToOpenAIMessage(developerMessage);

			expect(result).toEqual({
				role: 'system',
				content: 'System prompt for the assistant',
			});
		});

		it('should handle tool message without tool_call_id', () => {
			const toolMessage: Message = {
				role: 'tool',
				content: 'Tool response',
				name: 'test_tool',
			};

			const result = convertToOpenAIMessage(toolMessage);

			expect(result).toEqual({
				role: 'user',
				content: 'Tool response without ID: Tool response',
			});
		});

		it('should handle tool message with tool_call_id', () => {
			const toolMessage: Message = {
				role: 'tool',
				content: 'Tool response',
				name: 'test_tool',
				tool_call_id: 'call_123',
			};

			const result = convertToOpenAIMessage(toolMessage);

			expect(result).toEqual({
				role: 'tool',
				content: 'Tool response',
				tool_call_id: 'call_123',
				name: 'test_tool',
			});
		});
	});
});
