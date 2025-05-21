import {Box, Newline, Text, useInput} from 'ink';
import BigText from 'ink-big-text';
import Gradient from 'ink-gradient';
import React, {useState, useEffect} from 'react';
import {useAtom} from 'jotai';

import {ChatScreen} from './screens/chat-screen.js';
import {ModelsScreen} from './screens/models-screen.js';
import {McpProvider} from './components/mcp-provider.js';
import {useClearExit} from './hooks/use-clear-exit.js';
import {currentScreenAtom} from './store/ui.js';
import {logger} from './logger.js';

interface Props {
	initialScreen?: string | undefined;
}

export default function App({initialScreen}: Props) {
	useClearExit();
	const [input, setInput] = useState('');
	const [currentScreen, setCurrentScreen] = useAtom(currentScreenAtom);

	useEffect(() => {
		if (initialScreen === 'chat' || initialScreen === 'models') {
			setCurrentScreen(initialScreen);
		}
		// If initialScreen is not 'chat' or 'models', or undefined,
		// it will default to 'main' as currentScreenAtom's default value is 'main'.
	}, [initialScreen, setCurrentScreen]);

	useInput((value, key) => {
		// Only handle input in main screen
		if (currentScreen !== 'main') return;
		logger.info(`Input: ${JSON.stringify(key)}: ${value}`);

		if (key.return) {
			logger.info(`Input: ${input}`);
			if (input === '/models') {
				setCurrentScreen('models');
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

	return (
		<McpProvider>
			{currentScreen === 'chat' ? (
				<ChatScreen onExit={() => setCurrentScreen('main')} />
			) : currentScreen === 'models' ? (
				<ModelsScreen onExit={() => setCurrentScreen('main')} />
			) : (
				<Box flexDirection="column">
					<Gradient name="rainbow">
						<BigText text="MTERM" />
					</Gradient>

					{/* Input area */}
					<Box marginTop={1}>
						<Text>{'> '}</Text>
						<Text>{input}</Text>
					</Box>

					{/* Help text */}
					<Box marginTop={1}>
						<Text dimColor>
							Type <Text color="green">/models</Text> to see available OpenAI
							models
							<Newline />
							Type <Text color="green">/chat</Text> to start chatting with
							OpenAI
						</Text>
					</Box>
				</Box>
			)}
		</McpProvider>
	);
}
