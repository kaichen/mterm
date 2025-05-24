import test from 'ava';

interface TestType {
	name: string;
	value: number;
}

test('typescript test works', t => {
	const obj: TestType = {
		name: 'test',
		value: 42,
	};

	t.is(obj.name, 'test');
	t.is(obj.value, 42);
});

test('array methods work', t => {
	const numbers = [1, 2, 3, 4, 5];
	const doubled = numbers.map(n => n * 2);

	t.deepEqual(doubled, [2, 4, 6, 8, 10]);
});