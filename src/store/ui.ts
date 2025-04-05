import {atom} from 'jotai';

// App screens
export type Screen = 'main' | 'chat' | 'models';

export const currentScreenAtom = atom<Screen>('main');

export const globalErrorAtom = atom<Error | string | null>(null);
