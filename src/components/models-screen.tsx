import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
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
	const [currentScreen] = useAtom(currentScreenAtom);
	const [openaiClient] = useAtom(openaiClientAtom);
	const [openaiError] = useAtom(openaiErrorAtom);

	// Handle user input
	useInput((value, key) => {
		if (currentScreen !== 'models') return;
		logger.info(`User input: ${JSON.stringify(key)}: ${value}`);
		if (key.return) {
			logger.info(`User input: ${value}`);
			if (value.trim() === '/exit') {
				logger.info(`Exiting models screen`);
				onExit();
				return;
			}
		} else if (key.escape) {
			// When ESC is pressed, return to main screen
			logger.info(`ESC pressed, returning to main screen`);
			onExit();
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
					OpenAI Models{' '}
					<Text color="gray">(Type '/exit' to return to main screen)</Text>
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

			{/* Models list */}
			{models.length > 0 && (
				<Box flexDirection="column" marginTop={1} width="100%">
					<ScrollArea height={24}>
						{models.map(model => (
							<Text key={model.id}>{model.id}</Text>
						))}
					</ScrollArea>
				</Box>
			)}
		</Box>
	);
};