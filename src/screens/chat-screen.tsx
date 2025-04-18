import React, {useState, useEffect} from 'react';
import {Box, Spacer, Static, Text, useInput} from 'ink';
import {useAtom} from 'jotai';

import {logger} from '../logger.js';
import {logMessageToSession} from '../utils/session-logger.js';
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
import {Message, Tool, ToolCall} from '../types.js';
import {convertToOpenAIMessage} from '../utils/format-message.js';
import {ChatMessages} from '../components/chat-messages.js';
import {ChatInput} from '../components/chat-input.js';

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

	useEffect(() => {
		logMessageToSession(developerMessage as Message);
	}, []);

	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [hideToolMessages, setHideToolMessages] = useState(true);

	const [currentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);
	const [currentModel, setCurrentModel] = useAtom(currentModelAtom);

	const [mcpClients] = useAtom(mcpClientsAtom);
	const [mcpTools] = useAtom(mcpToolsAtom);
	const [mcpError] = useAtom(mcpErrorAtom);

	const [combinedTools, setCombinedTools] = useState<Tool[]>([]);

	useEffect(() => {
		if (mcpTools.length > 0) {
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

	useInput((value, key) => {
		if (currentScreen !== 'chat') return;

		if (key.return) {
			logger.info(`User input: ${input}`);
			const trimmedInput = input.trim();

			if (trimmedInput === '/exit') {
				logger.info(`Exiting chat screen`);
				onExit();
				return;
			} else if (trimmedInput.startsWith('/setmodel ')) {
				const modelId = trimmedInput.substring('/setmodel '.length).trim();
				if (modelId) {
					logger.info(`Setting model to: ${modelId}`);
					setCurrentModel(modelId);
					const systemMessage = {
						role: 'system' as const,
						content: `Model changed to ${modelId}`,
					};
					setMessages(prev => [...prev, systemMessage]);
					logMessageToSession(systemMessage);
				}
				setInput('');
				return;
			} else if (trimmedInput === '/toggletools') {
				setHideToolMessages(prev => !prev);
				const toggleMessage = {
					role: 'system' as const,
					content: `Tool messages are now ${
						hideToolMessages ? 'visible' : 'hidden'
					}`,
				};
				setMessages(prev => [...prev, toggleMessage]);
				logMessageToSession(toggleMessage);
				setInput('');
				return;
			}

			if (trimmedInput === '') return;
			sendMessage(trimmedInput);
			setInput('');
		} else if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
		} else if (key.escape) {
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

	const sendMessage = async (content: string) => {
		logger.info(`Sending message: ${content}`);
		try {
			setIsLoading(true);
			setError('');

			const userMessage: Message = {role: 'user', content};
			setMessages(prev => [...prev, userMessage]);
			logMessageToSession(userMessage);

			if (openaiError || !openaiClient) {
				setError(`OpenAI Error: ${openaiError}`);
				setIsLoading(false);
				return;
			}

			const response = await openaiClient!.chat.completions.create({
				model: currentModel,
				messages: messages.concat(userMessage).map(convertToOpenAIMessage),
				tools: combinedTools,
				tool_choice: 'auto',
			});

			if (response.choices[0]?.message) {
				const assistantMessage = response.choices[0].message;
				logger.info(`Assistant response: ${JSON.stringify(assistantMessage)}`);
				logMessageToSession(assistantMessage);

				const newMessages: Message[] = [
					{
						role: 'assistant',
						content: assistantMessage.content || '',
						tool_calls: assistantMessage.tool_calls as unknown as ToolCall[],
					},
				];

				if (
					assistantMessage.tool_calls &&
					assistantMessage.tool_calls.length > 0
				) {
					const toolResults = await handleToolCalls(
						mcpClients,
						mcpTools,
						assistantMessage.tool_calls as unknown as ToolCall[],
					);
					newMessages.push(...toolResults);
					logMessageToSession(toolResults);

					const secondResponse = await openaiClient!.chat.completions.create({
						model: currentModel,
						messages: [
							...messages.map(convertToOpenAIMessage),
							convertToOpenAIMessage(userMessage),
							...newMessages.map(convertToOpenAIMessage),
						],
					});

					if (secondResponse.choices[0]?.message) {
						const otherMessage = {
							role: 'assistant',
							content:
								secondResponse.choices[0].message.content || 'No response',
						};
						newMessages.push(otherMessage as Message);
						logMessageToSession(otherMessage);
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
		<Box flexDirection="column" padding={1}>
			<Box flexDirection="column" flexGrow={1}>
				<ChatMessages
					messages={messages}
					isLoading={isLoading}
					error={error}
					mcpError={mcpError}
					hideToolMessages={hideToolMessages}
				/>
			<ChatInput input={input} />
			</Box>
			<Box marginTop={1} borderStyle="round" borderColor="gray">
				<Text bold>
					Chat with OpenAI [<Text color="yellow">{currentModel}</Text>]{' '}
					<Text color="gray">
						(Type '/exit' to return to main screen, '/setmodel {currentModel}'
						to change model, '/toggletools' to{' '}
						{hideToolMessages ? 'show' : 'hide'} tool messages)
					</Text>
				</Text>
			<Spacer />
			</Box>
		</Box>
	);
};
