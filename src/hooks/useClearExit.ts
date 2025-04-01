import { useCallback, useLayoutEffect } from 'react';
import { useApp, useInput, useStdin } from 'ink';
import { clear } from '../cli.js';

const ctrlC = `\x03`;
export const useClearExit = (): void => {
  const { exit } = useApp();
  const exitWithClear = useCallback(() => {
    clear();
    exit();
  }, [exit]);

  // manually handle ctrl+c, as ink doesn't allow clean before exit;
  const { stdin } = useStdin();
  useLayoutEffect(() => {
    const listener = (input: string) => input === ctrlC && exitWithClear();
    stdin.addListener(`data`, listener);
    return () => void stdin.removeListener(`data`, listener);
  });
  useInput((_, { escape }) => escape && exitWithClear(), { isActive: true });
};