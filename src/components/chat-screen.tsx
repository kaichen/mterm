import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import {Spinner} from '@inkjs/ui';
import {useAtom} from 'jotai';

import {logger} from '../logger.js';
import {
	openaiClientAtom,
	openaiErrorAtom,
	currentModelAtom,
} from '../store/openai.js';
import {currentScreenAtom} from '../store/ui.js';
import {
	mcpClientsAtom,
	mcpToolsAtom,
	mcpErrorAtom,
	handleToolCalls,
} from '../store/mcp.js';
import {RoleBadge} from './role-badge.js';
import {Message, Tool, ToolCall} from '../types.js';
import {AlertError} from './alert-error.js';
import {convertToOpenAIMessage} from '../utils/format-message.js';

interface ChatScreenProps {
	onExit: () => void;
}

const developerMessage = {
	role: 'developer',
	content:
		'You are a helpful AI assistant. Be concise and clear in your responses.',
};

export const ChatScreen: React.FC<ChatScreenProps> = ({onExit}) => {
	const [messages, setMessages] = useState<Message[]>([
		developerMessage as Message,
	]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [hideToolMessages, setHideToolMessages] = useState(true);
	const [currentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);
	const [currentModel, setCurrentModel] = useAtom(currentModelAtom);

	// MCP states
	const [mcpClients] = useAtom(mcpClientsAtom);
	const [mcpTools] = useAtom(mcpToolsAtom);
	const [mcpError] = useAtom(mcpErrorAtom);

	// Combine all available tools for OpenAI
	const [combinedTools, setCombinedTools] = useState<Tool[]>([]);

	// Update tools when MCP tools change
	useEffect(() => {
		if (mcpTools.length > 0) {
			// Convert MCP tools to OpenAI tool format
			const mcpOpenAITools = mcpTools.map(tool => ({
				type: 'function' as const,
				function: {
					name: tool.name,
					description: tool.description || `MCP tool: ${tool.name}`,
					parameters: tool.inputSchema,
				},
			}));

			setCombinedTools([...mcpOpenAITools]);
			logger.info(
				'Combined tools updated with MCP tools:' +
					JSON.stringify(mcpOpenAITools.map(tool => tool.function.name)),
			);
		}
	}, [mcpTools]);

	// Handle user input
	useInput((value, key) => {
		if (currentScreen !== 'chat') return;
		if (key.return) {
			logger.info(`User input: ${input}`);
			const trimmedInput = input.trim();

			// Handle commands
			if (trimmedInput === '/exit') {
				logger.info(`Exiting chat screen`);
				onExit();
				return;
			} else if (trimmedInput.startsWith('/setmodel ')) {
				const modelId = trimmedInput.substring('/setmodel '.length).trim();
				if (modelId) {
					logger.info(`Setting model to: ${modelId}`);
					setCurrentModel(modelId);
					setMessages(prev => [
						...prev,
						{
							role: 'system',
							content: `Model changed to ${modelId}`,
						},
					]);
				}
				setInput('');
				return;
			} else if (trimmedInput === '/toggletools') {
				setHideToolMessages(prev => !prev);
				setMessages(prev => [
					...prev,
					{
						role: 'system',
						content: `Tool messages are now ${
							hideToolMessages ? 'visible' : 'hidden'
						}`,
					},
				]);
				setInput('');
				return;
			}

			if (trimmedInput === '') return;
			sendMessage(trimmedInput);
			setInput('');
		} else if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
		} else if (key.escape) {
			// If the input is empty and ESC is pressed, return to main screen
			// Otherwise, clear the input field
			if (input.trim() === '') {
				logger.info(`ESC pressed, returning to main screen`);
				onExit();
			} else {
				setInput('');
			}
		} else if (!key.ctrl && !key.meta && value.length > 0) {
			setInput(prev => prev + value);
		} else {
			logger.info(`No input: ${value}`);
		}
	});

	// Send message to OpenAI
	const sendMessage = async (content: string) => {
		logger.info(`Sending message: ${content}`);
		try {
			setIsLoading(true);
			setError('');

			// Add user message to the chat
			const userMessage: Message = {role: 'user', content};
			setMessages(prev => [...prev, userMessage]);

			if (openaiError || !openaiClient) {
				// Set error state instead of mocking response
				setError(`OpenAI Error: ${openaiError}`);
				setIsLoading(false);
				return;
			}

			// Send the request to OpenAI with combined tools (OpenAI + MCP)
			const response = await openaiClient!.chat.completions.create({
				model: currentModel,
				messages: messages.concat(userMessage).map(convertToOpenAIMessage),
				tools: combinedTools,
				tool_choice: 'auto',
			});

			// Handle the response
			if (response.choices[0]?.message) {
				const assistantMessage = response.choices[0].message;
				logger.info(`Assistant response: ${JSON.stringify(assistantMessage)}`);

				// Add assistant response to the chat
				const newMessages: Message[] = [
					{
						role: 'assistant',
						content: assistantMessage.content || '',
						tool_calls: assistantMessage.tool_calls as unknown as ToolCall[],
					},
				];

				// Handle tool calls if present
				if (
					assistantMessage.tool_calls &&
					assistantMessage.tool_calls.length > 0
				) {
					// Process tool calls and get results
					const toolResults = await handleToolCalls(
						mcpClients,
						mcpTools,
						assistantMessage.tool_calls as unknown as ToolCall[],
					);
					newMessages.push(...toolResults);

					// Send another request with the tool results
					const secondResponse = await openaiClient!.chat.completions.create({
						model: currentModel,
						messages: [
							...messages.map(convertToOpenAIMessage),
							convertToOpenAIMessage(userMessage),
							...newMessages.map(convertToOpenAIMessage),
						],
					});

					if (secondResponse.choices[0]?.message) {
						newMessages.push({
							role: 'assistant',
							content:
								secondResponse.choices[0].message.content || 'No response',
						});
					}
				}
				setMessages(prev => [...prev, ...newMessages]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
			logger.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	if (currentScreen !== 'chat') return null;

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold>
					Chat with OpenAI [<Text color="yellow">{currentModel}</Text>]{' '}
					<Text color="gray">
						(Type '/exit' to return to main screen, '/setmodel {currentModel}'
						to change model, '/toggletools' to {hideToolMessages ? 'show' : 'hide'} tool messages)
					</Text>
				</Text>
			</Box>

			{/* Chat messages */}
			<Box flexDirection="column">
				{messages
					.filter(msg => msg.role !== 'developer' && !(hideToolMessages && msg.role === 'tool'))
					.map((message, index) => (
						<Box key={index} flexDirection="column" marginBottom={1}>
							<Box flexDirection="row">
								<RoleBadge role={message.role} name={message.name} />
								<Text wrap="wrap">{message.content}</Text>
							</Box>
							{message.tool_calls && (
								<Box flexDirection="column" marginLeft={2} marginTop={1}>
									{message.tool_calls.map((toolCall, i) => (
										<Box key={i} flexDirection="column" marginBottom={1}>
											<Box>
												<Text color="cyan" bold>
													Tool Call:{' '}
												</Text>
												<Text color="cyan">{toolCall.function.name}</Text>
											</Box>
											<Box marginLeft={2}>
												<Text color="gray" wrap="wrap">
													Args: {toolCall.function.arguments}
												</Text>
											</Box>
										</Box>
									))}
								</Box>
							)}
						</Box>
					))}
				{isLoading && (
					<Box>
						<Spinner type="dots" label="Thinking..." />
					</Box>
				)}
			</Box>

			{/* Error messages */}
			<AlertError error={error} />
			<AlertError error={mcpError} />

			{/* Input area */}
			<Box marginTop={1}>
				<Text bold>{'> '}</Text>
				<Text>{input}</Text>
			</Box>
		</Box>
	);
};