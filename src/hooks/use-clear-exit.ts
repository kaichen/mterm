import {useApp, useInput, useStdin} from 'ink';
import {useCallback, useLayoutEffect} from 'react';
import {clear} from '../cli.js';
import {useAtom} from 'jotai';
import {currentScreenAtom} from '../store/ui.js';

const ctrlC = '\x03';
export const useClearExit = (): void => {
	const {exit} = useApp();
	const [currentScreen] = useAtom(currentScreenAtom);
	
	const exitWithClear = useCallback(() => {
		clear();
		exit();
	}, [exit]);

	// manually handle ctrl+c, as ink doesn't allow clean before exit;
	const {stdin} = useStdin();
	useLayoutEffect(() => {
		const listener = (input: string) => input === ctrlC && exitWithClear();
		stdin.addListener('data', listener);
		return () => void stdin.removeListener('data', listener);
	});
	
	// Only exit when ESC is pressed in the main screen
	// For chat and models screens, navigation is handled in their respective components
	useInput((_, {escape}) => {
		if (escape && currentScreen === 'main') {
			exitWithClear();
		}
	}, {isActive: true});
};