import { parse } from './parser';
import * as expr from './expression';

expect.extend({
    toBeIdenticalTo(a, b) {
        return {pass: expr.identical(a, b)};
    }
});

test('parses identifier correctly', () => {
    const a = expr.identifier('a');
    const parsed = parse('a');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses int correctly', () => {
    const a = expr.number(1034);
    const parsed = parse('1034');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses float correctly', () => {
    const a = expr.number(1034.45);
    const parsed = parse('1034.45');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses addition correctly', () => {
    const a = expr.sum([expr.number(10), expr.identifier('a')]);
    const b = expr.sum([expr.identifier('a'), expr.number(10)]);

    const parsed = parse('10 + a');
    expect(a).toBeIdenticalTo(parsed);
    expect(b).toBeIdenticalTo(parsed);
});

test('parses addition correctly', () => {
    const a = expr.sum([expr.sum([expr.identifier('a'), expr.identifier('b')]), expr.identifier('c')]);

    const parsed = parse('a + b + c');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses function correctly', () => {
    const a = expr.functionCall('sin', [expr.identifier('x')]);
    const parsed = parse('sin(x)');

    expect(a).toBeIdenticalTo(parsed);
});

test('parses parentheses correctly', () => {
    const a = expr.sum([expr.number(1), expr.identifier('a')]);
    const parsed = parse('(1 + a)');

    expect(a).toBeIdenticalTo(parsed);
});

test('parses expression correctly', () => {
    const a = expr.product([
        expr.identifier('a'), 
        expr.sum([expr.number(1), expr.identifier('b')])
    ]);

    const parsed = parse('a * (1 + b)')

    expect(a).toBeIdenticalTo(parsed);
});