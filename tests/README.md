# Testing Guide

This directory contains comprehensive test suites for the MTERM application.

## Test Structure

```
tests/
├── components/        # Component tests
│   ├── alert-error.test.tsx
│   ├── app.test.tsx
│   ├── chat-input.test.tsx
│   ├── chat-messages.test.tsx
│   └── role-badge.test.tsx
├── hooks/            # Custom hook tests
│   └── use-terminal-size.test.tsx
├── utils/            # Utility and type tests
│   ├── test-helpers.ts
│   └── types.test.ts
└── __fixtures__/     # Test data and fixtures
    └── messages.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (if you add a watch script)
npm run test:watch

# Run specific test file
npx ava tests/components/role-badge.test.tsx

# Run tests with verbose output
npx ava --verbose
```

## Test Utilities

### `test-helpers.ts`
- **`render()`**: Enhanced wrapper around ink-testing-library's render
- **`getTextContent()`**: Strips ANSI codes for easier text assertions
- **`hasColor()`**: Checks for specific ANSI color codes
- **`mockProcessStdout()`**: Mocks process.stdout for terminal size testing

### Test Fixtures
- **`messages.ts`**: Pre-defined message objects for testing chat components

## Testing Patterns

### Component Testing
```typescript
test('component renders correctly', t => {
  const {lastFrame} = render(<Component prop="value" />);
  const frame = lastFrame();

  t.truthy(frame);
  const textContent = getTextContent(frame!);
  t.true(textContent.includes('expected text'));
});
```

### Hook Testing
```typescript
// Create a test component that uses the hook
const TestComponent = () => {
  const hookResult = useCustomHook();
  return <Text>{JSON.stringify(hookResult)}</Text>;
};

test('hook returns expected value', t => {
  const {lastFrame} = render(<TestComponent />);
  // Assert on the rendered output
});
```

### ANSI Color Testing
```typescript
test('text has correct color', t => {
  const {lastFrame} = render(<ColoredComponent />);
  const frame = lastFrame();

  // Check for specific ANSI color codes
  t.true(frame!.includes('\u001b[32m')); // Green
  t.true(frame!.includes('\u001b[1m'));  // Bold
});
```

## Coverage

Test coverage includes:
- **Components**: All core UI components
- **Hooks**: Custom React hooks for terminal interaction
- **Types**: TypeScript type definitions
- **Error handling**: Error states and edge cases
- **Color rendering**: ANSI color code verification
- **Conditional rendering**: Different states and props

## Best Practices

1. **Use descriptive test names** that explain the expected behavior
2. **Test both happy path and edge cases**
3. **Verify text content AND visual formatting** (colors, styling)
4. **Use fixtures for complex test data** to keep tests readable
5. **Test component interactions** and state changes
6. **Mock external dependencies** when necessary
7. **Group related tests** logically within files

## Adding New Tests

When adding new components or features:

1. Create a new test file in the appropriate directory
2. Import test utilities from `test-helpers.ts`
3. Use existing fixtures or create new ones in `__fixtures__/`
4. Follow existing naming conventions and patterns
5. Test all props, states, and user interactions
6. Verify accessibility and error handling
