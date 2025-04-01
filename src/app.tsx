import {Box, Newline, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import React, {useState} from 'react';
import {useAtom} from 'jotai';

import {ScrollArea} from './components/scroll-area.js';
import {ChatScreen} from './components/chat-screen.js';
import {useClearExit} from './hooks/use-clear-exit.js';
import {openaiClientAtom, openaiErrorAtom} from './store/openai.js';
import {currentScreenAtom} from './store/ui.js';
import {logger} from './logger.js';

interface Props {
	name: string | undefined;
}

interface Model {
	id: string;
	created: number;
	owned_by: string;
}

export default function App({name = 'Kai'}: Props) {
	useClearExit();
	const [input, setInput] = useState('');
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [currentScreen, setCurrentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);

	useInput((value, key) => {
		// Only handle input in main screen
		if (currentScreen !== 'main') return;
		logger.info(`Input: ${JSON.stringify(key)}: ${value}`);

		if (key.return) {
			logger.info(`Input: ${input}`);
			if (input === '/models') {
				setCurrentScreen('main');
				fetchModels();
				setInput('');
			} else if (input === '/chat') {
				setCurrentScreen('chat');
				setInput('');
			} else {
				setInput('');
			}
		} else if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
		} else if (key.escape) {
			setInput('');
		} else if (!key.ctrl && !key.meta && value.length > 0) {
			setInput(prev => prev + value);
		} else {
			logger.info(`No input: ${value}`);
		}
	});

	const fetchModels = async () => {
		try {
			setLoading(true);
			setError('');

			if (!openaiClient) {
				setError(openaiError);
				setLoading(false);
				return;
			}

			const response = await openaiClient.models.list();
			const models = response.data.sort((a, b) => b.created - a.created);
			setModels(models);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch models');
			logger.error(err);
		} finally {
			setLoading(false);
		}
	};

	// Handle screen changes
	if (currentScreen === 'chat') {
		return <ChatScreen onExit={() => setCurrentScreen('main')} />;
	}

	return (
		<Box flexDirection="column">
			<Gradient name="rainbow">
				<BigText text="MTERM" />
			</Gradient>
			<Text>
				Hello, <Text color="green">{name}</Text>
				<Newline />
			</Text>

			{/* Input area */}
			<Box marginTop={1}>
				<Text>{'> '}</Text>
				<Text>{input}</Text>
			</Box>

			{/* Loading indicator */}
			{loading && (
				<Box marginTop={1}>
					<Spinner type="dots" label="Loading..." />
				</Box>
			)}

			{/* Error message */}
			{error && (
				<Alert variant="error">
					<Text color="red">Error: {error}</Text>
				</Alert>
			)}

			{/* Models list */}
			{models.length > 0 && (
				<Box flexDirection="column" marginTop={1} width="100%">
					<Text bold>OpenAI Models:</Text>
					<ScrollArea height={24}>
						{models.map(model => (
							<Text key={model.id}>{model.id}</Text>
						))}
					</ScrollArea>
				</Box>
			)}

			{/* Help text */}
			<Box marginTop={1}>
				<Text dimColor>
					Type <Text color="green">/models</Text> to see available OpenAI models
				</Text>
				<Text dimColor> | </Text>
				<Text dimColor>
					Type <Text color="green">/chat</Text> to start chatting with OpenAI
				</Text>
			</Box>
		</Box>
	);
}
