import {atom} from 'jotai';
import OpenAI from 'openai';

// Atom for storing OpenAI client instance
export const openaiClientAtom = atom<OpenAI | null>(() => {
	const apiKey = process.env['OPENAI_API_KEY'];

	if (!apiKey) {
		return null;
	}

	return new OpenAI({
		apiKey,
	});
});

// Derived atom for error state (when client is null)
export const openaiErrorAtom = atom(get => {
	const client = get(openaiClientAtom);
	return client === null
		? 'OPENAI_API_KEY environment variable is not set.'
		: '';
});
