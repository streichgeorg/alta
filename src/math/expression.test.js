import * as expr from './expression';
import { parse } from './parser';

expect.extend({
    toBeIdenticalTo(a, b) {
        return {pass: expr.identical(a, b)};
    }
});

test('compares identifiers correctly', () => {
    const a = expr.identifier('a');
    const b = expr.identifier('b');

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);

    expect(expr.compareExpressions(a, b)).toBeTruthy(); // a > b
});

test('compares numbers correctly', () => {
    const a = expr.number(10);
    const b = expr.identifier(5);
    const c = expr.identifier(2);

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);

    expect(expr.compareExpressions(a, b)).toBeFalsy(); // 10 > 5
});

test('compares sum correctly', () => {
    const a = expr.sum([expr.identifier('a'), expr.number(10)]);
    const b = expr.sum([expr.number(10), expr.identifier('a')]);
    const c = expr.sum([expr.identifier('b'), expr.number(10), expr.identifier('a')]);

    expect(a).toBeIdenticalTo(a);
    expect(a).toBeIdenticalTo(b);
    expect(a).not.toBeIdenticalTo(c);

    expect(expr.compareExpressions(a, b)).toBeTruthy(); // IDENTIFIER > NUMBER
    expect(expr.compareExpressions(a, c)).toBeTruthy(); // a > b
});

test('compares product correctly', () => {
    const a = expr.product(expr.identifier('a'), expr.identifier('b'));
});

test('compares function correctly', () => {
    const a = expr.functionCall('sin', [expr.identifier('x')]);
    const b = expr.functionCall('cos', [expr.identifier('x')]);
    const c = expr.functionCall('cos', [expr.identifier('y')]);

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);
    expect(b).not.toBeIdenticalTo(c);

    expect(expr.compareExpressions(a, b)).toBeFalsy(); // sin > cos
});

test('compares fractions correctly', () => {
    const a = expr.fraction(
        expr.product([expr.identifier('a'), expr.identifier('b')]),
        expr.product([expr.identifier('c'), expr.identifier('d')]),
    );

    expect(a).toBeIdenticalTo(a);
});

test('compares expression correctly', () => {
    const a = parse('a * (1 + b)');
    const b = parse('a * b');

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);
});

function simplifiesCorrectly(a, b) {
    test(a + ' == ' + b, () => {
        expect(expr.simplify(parse(a))).toBeIdenticalTo(expr.simplify(parse(b)));
    });
}

simplifiesCorrectly('a + a', '2 * a');
simplifiesCorrectly('0 + a', 'a');
simplifiesCorrectly('0 * a', '0');
simplifiesCorrectly('1 * a', 'a');
simplifiesCorrectly('a - a', '0');
simplifiesCorrectly('a - 2 * a', '-a');
simplifiesCorrectly('(a / b) / (c / d)', '(a * d) / (b * c)');
simplifiesCorrectly('a / a', '1');
simplifiesCorrectly('a * a / a', 'a');
simplifiesCorrectly('(a - a) / b', '0');
simplifiesCorrectly('b / (a / a)', 'b');
simplifiesCorrectly('a / (a * a * a)', '1 / (a * a)');
simplifiesCorrectly('a * (1 / (a * a))', '1 / a');
simplifiesCorrectly('a * a * (1 / (a * a * a))', '1 / a');
simplifiesCorrectly('(a * a * b * c * c * 4) / (a * b * c * 5)', '(a * c * 4) / 5');

test('parses function definition correctly', () => {
    expect(expr.isFunctionDefinition(parse('f(x) = x + x')));
});

test('finds correct parameters', () => {
    const a = parse('a + g * g - 4 * h(x + d)');
    const parameters = expr.getParameters(a);
    const expected = new Set(['a', 'g', 'x', 'd']);

    expect(parameters.size === expected.size).toBeTruthy();
    for (const el of expected) {
        expect(parameters.has(el)).toBeTruthy();
    }
});