import React, { useState } from 'react';
import OpenAI from 'openai';
import {Box, Newline, Text, useInput} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

import Table from './components/table.js';
import { useClearExit } from './hooks/useClearExit.js';
import Spinner from 'ink-spinner';
import { ScrollArea } from './components/scrollarea.js';

type Props = {
	name: string | undefined;
};

type Model = {
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

	useInput((value, key) => {
		if (key.return) {
			if (input === '/models') {
				fetchModels();
			}
			setInput('');
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
				// 如果没有API密钥，使用模拟数据进行演示
				setTimeout(() => {
					const mockModels = [
						{ id: 'gpt-4o', created: 1683758102, owned_by: 'openai' },
						{ id: 'gpt-4-turbo', created: 1683758102, owned_by: 'openai' },
						{ id: 'gpt-3.5-turbo', created: 1677610602, owned_by: 'openai' },
						{ id: 'dall-e-3', created: 1698274942, owned_by: 'openai' },
						{ id: 'whisper-1', created: 1677532384, owned_by: 'openai' },
						{ id: 'text-embedding-3-large', created: 1705953180, owned_by: 'openai' }
					];
					setModels(mockModels);
					setLoading(false);
				}, 1000); // 模拟网络延迟
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

	return (
			<Box flexDirection="column">
				<Gradient name="rainbow">
					<BigText text="MTERM"/>
				</Gradient>
				<Text>
					Hello, <Text color="green">{name}</Text>
					<Newline />
				</Text>

				{/* Input area */}
				<Box marginTop={1}>
					<Text>{`> `}</Text>
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
					<Box marginTop={1}>
						<Text color="red">Error: {error}</Text>
					</Box>
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
					<Text dimColor>Type <Text color="green">/models</Text> to see available OpenAI models</Text>
				</Box>
			</Box>
	);
}
