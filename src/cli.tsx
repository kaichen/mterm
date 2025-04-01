#!/usr/bin/env node
import {Box, Text, render} from 'ink';
import meow from 'meow';
import React from 'react';
import App from './app.js';
import {enterFullscreen, exitFullscreen} from './utils/terminal.js';
import {useAtom} from 'jotai';
import {globalErrorAtom} from './store/ui.js';
import {Spinner, ThemeProvider, extendTheme, defaultTheme} from '@inkjs/ui';

const cli = meow(
	`
	Usage
	  $ mterm

	Options
		--name  Your name

	Examples
	  $ mterm --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

const customTheme = extendTheme(defaultTheme, {
	components: {
		Spinner: {
			styles: {
				frame: (): TextProps => ({
					color: 'magenta',
				}),
			},
		},
	},
});

const Fallback = () => {
	const [globalError] = useAtom(globalErrorAtom);
	return (
		<Box>
			<Text>
				{globalError ? JSON.stringify(globalError) : 'something went wrong'}
			</Text>
		</Box>
	);
};

enterFullscreen();
const {clear, waitUntilExit} = render(
	<React.Suspense fallback={<Fallback />}>
		<ThemeProvider theme={customTheme}>
			<App name={cli.flags.name} />
		</ThemeProvider>
	</React.Suspense>,
	{
		exitOnCtrlC: false,
	},
);
waitUntilExit().then(() => exitFullscreen());

export {clear};
