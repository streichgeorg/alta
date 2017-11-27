import { parse } from './parser';
import * as expr from './expression';

expect.extend({
    toBeIdenticalTo(a, b) {
        return {pass: expr.identical(a, b)};
    }
});

test('parses identifier correctly', () => {
    const a = expr.identifierExpression('a');
    const parsed = parse('a');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses int correctly', () => {
    const a = expr.numberExpression(1034);
    const parsed = parse('1034');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses float correctly', () => {
    const a = expr.numberExpression(1034.45);
    const parsed = parse('1034.45');
    expect(a).toBeIdenticalTo(parsed);
});

test('parses addition correctly', () => {
    const a = expr.sumExpression([expr.numberExpression(10), expr.identifierExpression('a')]);
    const b = expr.sumExpression([expr.identifierExpression('a'), expr.numberExpression(10)]);

    const parsed = parse('10 + a');
    expect(a).toBeIdenticalTo(parsed);
    expect(b).toBeIdenticalTo(parsed);
});

test('parses function correctly', () => {
    const a = expr.functionExpression('sin', [expr.identifierExpression('x')]);
    const parsed = parse('sin(x)');

    expect(a).toBeIdenticalTo(parsed);
});

test('parses parentheses correctly', () => {
    const a = expr.sumExpression([expr.numberExpression(1), expr.identifierExpression('a')]);
    const parsed = parse('(1 + a)');

    expect(a).toBeIdenticalTo(parsed);
});

test('parses expression correctly', () => {
    const a = expr.productExpression([
        expr.identifierExpression('a'), 
        expr.sumExpression([expr.numberExpression(1), expr.identifierExpression('b')])
    ]);

    const parsed = parse('a * (1 + b)')

    expect(a).toBeIdenticalTo(parsed);
});