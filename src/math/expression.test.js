import * as expr from './expression';
import { parse } from './parser';

expect.extend({
    toBeIdenticalTo(a, b) {
        return {pass: expr.identical(a, b)};
    }
});

test('compares identifiers correctly', () => {
    const a = expr.identifierExpression('a');
    const b = expr.identifierExpression('b');

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);

    expect(expr.compareExpressions(a, b)).toBeTruthy(); // a > b
});

test('compares numbers correctly', () => {
    const a = expr.numberExpression(10);
    const b = expr.identifierExpression(5);
    const c = expr.identifierExpression(2);

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);

    expect(expr.compareExpressions(a, b)).toBeFalsy(); // 10 > 5
});

test('compares sum correctly', () => {
    const a = expr.sumExpression([expr.identifierExpression('a'), expr.numberExpression(10)]);
    const b = expr.sumExpression([expr.numberExpression(10), expr.identifierExpression('a')]);
    const c = expr.sumExpression([expr.identifierExpression('b'), expr.numberExpression(10), expr.identifierExpression('a')]);

    expect(a).toBeIdenticalTo(a);
    expect(a).toBeIdenticalTo(b);
    expect(a).not.toBeIdenticalTo(c);

    expect(expr.compareExpressions(a, b)).toBeTruthy(); // IDENTIFIER > NUMBER
    expect(expr.compareExpressions(a, c)).toBeTruthy(); // a > b
});

test('compares product correctly', () => {
    const a = expr.productExpression(expr.identifierExpression('a'), expr.identifierExpression('b'));
});

test('compares function correctly', () => {
    const a = expr.functionExpression('sin', [expr.identifierExpression('x')]);
    const b = expr.functionExpression('cos', [expr.identifierExpression('x')]);
    const c = expr.functionExpression('cos', [expr.identifierExpression('y')]);

    expect(a).toBeIdenticalTo(a);
    expect(a).not.toBeIdenticalTo(b);
    expect(b).not.toBeIdenticalTo(c);

    expect(expr.compareExpressions(a, b)).toBeFalsy(); // sin > cos
});

test('compares fractions correctly', () => {
    const a = expr.fractionExpression(
        expr.productExpression([expr.identifierExpression('a'), expr.identifierExpression('b')]),
        expr.productExpression([expr.identifierExpression('c'), expr.identifierExpression('d')]),
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