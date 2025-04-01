#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import { enterFullscreen, exitFullscreen } from './utils/terminal.js';

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

enterFullscreen();
const { clear, waitUntilExit } = render(<App name={cli.flags.name} />, {
  exitOnCtrlC: false,
});
waitUntilExit().then(() => exitFullscreen());

export { clear };
