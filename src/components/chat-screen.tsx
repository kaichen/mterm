import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import {useAtom} from 'jotai';

import {logger} from '../logger.js';
import {ScrollArea} from './scroll-area.js';
import {openaiClientAtom, openaiErrorAtom} from '../store/openai.js';
import {currentScreenAtom} from '../store/ui.js';

interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ChatScreenProps {
	onExit: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({onExit}) => {
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'system',
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

	// Handle user input
	useInput((value, key) => {
		if (currentScreen !== 'chat') return;
		logger.info(`User input: ${JSON.stringify(key)}: ${value}`);
		if (key.return) {
			logger.info(`User input: ${input}`);
			if (input.trim() === '/exit') {
				logger.info(`Exiting chat screen`);
				onExit();
				return;
			}

			if (input.trim() === '') return;

			sendMessage(input);
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

			// Send the request to OpenAI
			const response = await openaiClient!.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: messages.concat(userMessage),
			});

			// Add assistant response to the chat
			if (response.choices[0]?.message) {
				logger.info(
					`Assistant response: ${response.choices[0].message.content}`,
				);
				const assistantMessage: Message = {
					role: 'assistant',
					content: response.choices[0].message.content || 'No response',
				};
				setMessages(prev => [...prev, assistantMessage]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send message');
			logger.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Render role badge
	const RoleBadge = ({role}: {role: string}) => {
		let color = 'white';
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
		}

		return (
			<Box marginRight={1}>
				<Text color={color} bold>
					{role.toUpperCase()}:
				</Text>
			</Box>
		);
	};

	if (currentScreen !== 'chat') return null;

	return (
		<Box flexDirection="column" height={30}>
			<Box marginBottom={1}>
				<Text bold>
					Chat with OpenAI{' '}
					<Text color="gray">(Type '/exit' to return to main screen)</Text>
				</Text>
			</Box>

			{/* Chat messages */}
			<ScrollArea height={24}>
				<Box flexDirection="column">
					{messages
						.filter(msg => msg.role !== 'system')
						.map((message, index) => (
							<Box key={index} flexDirection="row" marginBottom={1}>
								<RoleBadge role={message.role} />
								<Text wrap="wrap">{message.content}</Text>
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