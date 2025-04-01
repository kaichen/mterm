import React, {useState} from 'react';
import {Box, Newline, Text, useInput} from 'ink';
import {Alert, Spinner} from '@inkjs/ui';
import {useAtom} from 'jotai';

import {logger} from '../logger.js';
import {ScrollArea} from './scroll-area.js';
import {openaiClientAtom, openaiErrorAtom} from '../store/openai.js';
import {currentScreenAtom} from '../store/ui.js';

interface Model {
	id: string;
	created: number;
	owned_by: string;
}

interface ModelsScreenProps {
	onExit: () => void;
}

export const ModelsScreen: React.FC<ModelsScreenProps> = ({onExit}) => {
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterText, setFilterText] = useState('');
	const [currentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);

	// Handle user input
	useInput((value, key) => {
		if (currentScreen !== 'models') return;
		logger.info(`User input: ${JSON.stringify(key)}: ${value}`);

		// Handle Ctrl+U to reset filter
		if (key.ctrl && value === 'u') {
			logger.info('Ctrl+U pressed, resetting filter');
			setFilterText('');
			return;
		}

		if (key.return) {
			logger.info(`User input: ${value}`);
			if (value.trim() === '/exit') {
				logger.info(`Exiting models screen`);
				onExit();
				return;
			}
		} else if (key.escape) {
			if (filterText) {
				// If there's a filter, clear it first on ESC
				setFilterText('');
			} else {
				// When ESC is pressed and no filter, return to main screen
				logger.info(`ESC pressed, returning to main screen`);
				onExit();
			}
		} else if (key.backspace || key.delete) {
			// Remove last character from filter text
			setFilterText(prev => prev.slice(0, -1));
		} else if (!key.ctrl && !key.meta && value.length > 0) {
			// Add typed character to filter text
			setFilterText(prev => prev + value);
		}
	});

	// Fetch models on component mount
	React.useEffect(() => {
		if (currentScreen === 'models') {
			fetchModels();
		}
	}, [currentScreen]);

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

	if (currentScreen !== 'models') return null;

	return (
		<Box flexDirection="column" height={30}>
			<Box marginBottom={1}>
				<Text bold>
					Listing OpenAI Models{' '}
					<Text color="gray">(Type ESC to return to main screen)</Text>
				</Text>
			</Box>

			{/* Loading indicator */}
			{loading && (
				<Box marginTop={1}>
					<Spinner type="dots" label="Loading models..." />
				</Box>
			)}

			{/* Error message */}
			{error && (
				<Alert variant="error">
					<Text color="red">Error: {error}</Text>
				</Alert>
			)}

			{/* Filter display */}
			{filterText && (
				<Box marginY={1}>
					<Text>Filter: </Text>
					<Text color="blue" bold>{filterText}</Text>
					<Box marginLeft={2}>
						<Text dimColor><Text color="gray">(Ctrl+U to reset)</Text></Text>
					</Box>
				</Box>
			)}

			{/* Filter help text */}
			{!models.length && !loading && !error && (
				<Box marginY={1}>
					<Text dimColor>
						Type to filter models
						<Newline />
						Use <Text color="yellow">^</Text> for prefix search (e.g., ^gpt)
						<Newline />
						Use <Text color="yellow">$</Text> for suffix search (e.g., tts$)
					</Text>
				</Box>
			)}

			{/* Models list */}
			{models.length > 0 && (
				<Box flexDirection="column" marginTop={1} width="100%">
					<ScrollArea height={filterText ? 22 : 24}>
						{models
							.filter(model => {
								if (!filterText) return true;

								const modelId = model.id.toLowerCase();
								const filter = filterText.toLowerCase();

								// Prefix search: ^o1
								if (filter.startsWith('^')) {
									return modelId.startsWith(filter.slice(1));
								}

								// Suffix search: tts$
								if (filter.endsWith('$')) {
									return modelId.endsWith(filter.slice(0, -1));
								}

								// Default substring search
								return modelId.includes(filter);
							})
							.map(model => (
								<Text key={model.id}>{model.id}</Text>
							))}
					</ScrollArea>
				</Box>
			)}
		</Box>
	);
};