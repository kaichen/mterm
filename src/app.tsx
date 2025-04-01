import {Box, Newline, Text, useInput} from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import OpenAI from 'openai';
import React, {useState} from 'react';

import {ScrollArea} from './components/scrollarea.js';
import Table from './components/table.js';
import {useClearExit} from './hooks/useClearExit.js';
import ChatScreen from './components/ChatScreen.js';
import { Alert, Spinner } from '@inkjs/ui';

interface Props {
	name: string | undefined;
}

interface Model {
	id: string;
	created: number;
	owned_by: string;
}

// App screens
type Screen = 'main' | 'chat';

export default function App({name = 'Kai'}: Props) {
	useClearExit();
	const [input, setInput] = useState('');
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [currentScreen, setCurrentScreen] = useState<Screen>('main');

	useInput((value, key) => {
		// Only handle input in main screen
		if (currentScreen !== 'main') return;

		if (key.return) {
			if (input === '/models') {
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
		}
	});

	const fetchModels = async () => {
		try {
			setLoading(true);
			setError('');

			const apiKey = process.env['OPENAI_API_KEY'];
			if (!apiKey) {
				setError('OPENAI_API_KEY environment variable is not set.');
				setLoading(false);
				return;
			}

			const client = new OpenAI({
				apiKey,
			});

			const response = await client.models.list();
			const models = response.data.sort((a, b) => b.created - a.created);
			setModels(models);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch models');
			console.error(err);
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
					<Text color="green">
						<Spinner type="dots" />
					</Text>
					<Text color="yellow">Loading...</Text>
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
						<Table data={models} columns={['id', 'created', 'owned_by']} />
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