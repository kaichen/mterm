import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import {useAtom} from 'jotai';

import {logger} from '../logger.js';
import {ScrollArea} from './scroll-area.js';
import {openaiClientAtom, openaiErrorAtom, currentModelAtom} from '../store/openai.js';
import {currentScreenAtom} from '../store/ui.js';

interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

interface Message {
	role: 'system' | 'user' | 'assistant' | 'developer' | 'tool';
	content: string;
	name?: string;
	tool_calls?: ToolCall[];
	tool_call_id?: string;
}

interface ChatScreenProps {
	onExit: () => void;
}

// Define tool interface
interface Tool {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: Record<string, any>;
	};
}

// Available tools
const availableTools: Tool[] = [
	{
		type: 'function',
		function: {
			name: 'get_weather',
			description: 'Get the current weather in a given location',
			parameters: {
				type: 'object',
				properties: {
					location: {
						type: 'string',
						description: 'The city and state, e.g. San Francisco, CA',
					},
				},
				required: ['location'],
			},
		},
	},
];

// Mock get_weather function with hardcoded values
const mockGetWeather = (location: string) => {
	return {
		location,
		temperature: 22,
		unit: 'celsius',
		forecast: ['sunny', 'clear'],
		humidity: 45,
	};
};

// Handle tool calls
const handleToolCalls = (toolCalls: ToolCall[]) => {
	return toolCalls.map(toolCall => {
		if (toolCall.function.name === 'get_weather') {
			try {
				const args = JSON.parse(toolCall.function.arguments);
				const result = mockGetWeather(args.location);
				return {
					role: 'tool' as const,
					tool_call_id: toolCall.id,
					name: toolCall.function.name,
					content: JSON.stringify(result),
				};
			} catch (error) {
				return {
					role: 'tool' as const,
					tool_call_id: toolCall.id,
					name: toolCall.function.name,
					content: JSON.stringify({error: 'Failed to parse arguments'}),
				};
			}
		}
		return {
			role: 'tool' as const,
			tool_call_id: toolCall.id,
			name: toolCall.function.name,
			content: JSON.stringify({error: 'Tool not found'}),
		};
	});
};

export const ChatScreen: React.FC<ChatScreenProps> = ({onExit}) => {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'developer',
			content:
				'You are a helpful AI assistant. Be concise and clear in your responses.',
		},
	]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [currentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);
	const [currentModel, setCurrentModel] = useAtom(currentModelAtom);

	// Handle user input
	useInput((value, key) => {
		if (currentScreen !== 'chat') return;
		logger.info(`User input: ${JSON.stringify(key)}: ${value}`);
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

			// Convert internal message format to OpenAI format
			const convertToOpenAIMessage = (message: Message) => {
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

			// Send the request to OpenAI with tools
			const response = await openaiClient!.chat.completions.create({
				model: currentModel,
				messages: messages.concat(userMessage).map(convertToOpenAIMessage),
				tools: availableTools,
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
				if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
					// Process tool calls and get results
					const toolResults = handleToolCalls(assistantMessage.tool_calls as unknown as ToolCall[]);
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
							content: secondResponse.choices[0].message.content || 'No response',
						});
					}
				}

				// Update messages state with all new messages
				setMessages(prev => [...prev, ...newMessages]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
			logger.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Render role badge
	const RoleBadge = ({role, name}: {role: string; name?: string}) => {
		let color = 'white';
		let displayRole = role.toUpperCase();

		switch (role) {
			case 'system':
				color = 'yellow';
				break;
			case 'user':
				color = 'blue';
				break;
			case 'assistant':
				color = 'green';
				break;
			case 'tool':
				color = 'magenta';
				displayRole = `TOOL:${name?.toUpperCase() || ''}`;
				break;
		}

		return (
			<Box marginRight={1}>
				<Text color={color} bold>
					{displayRole}:
				</Text>
			</Box>
		);
	};

	if (currentScreen !== 'chat') return null;

	return (
		<Box flexDirection="column" height={30}>
			<Box marginBottom={1}>
				<Text bold>
					Chat with OpenAI [<Text color="yellow">{currentModel}</Text>]{' '}
					<Text color="gray">(Type '/exit' to return to main screen, '/setmodel {currentModel}' to change model)</Text>
				</Text>
			</Box>

			{/* Chat messages */}
			<ScrollArea height={24}>
				<Box flexDirection="column">
					{messages
						.filter(msg => msg.role !== 'developer')
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
													<Text color="cyan" bold>Tool Call: </Text>
													<Text color="cyan">{toolCall.function.name}</Text>
												</Box>
												<Box marginLeft={2}>
													<Text color="gray" wrap="wrap">Args: {toolCall.function.arguments}</Text>
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
			</ScrollArea>

			{/* Error message */}
			{error && (
				<Alert variant="error">
					<Text color="red">Error: {error}</Text>
				</Alert>
			)}

			{/* Input area */}
			<Box marginTop={1}>
				<Text bold>{'> '}</Text>
				<Text>{input}</Text>
			</Box>
		</Box>
	);
};