import { parse } from './parser';
import * as evaluate from './evaluate';

const EPSILON = 0.000001;

expect.extend({
    evalTo(a, b) {
        const expr = parse(a);
        const result = evaluate.evaluate(expr);
        return {message: 'Expected ' + b + ' but received ' + result, pass: Math.abs(result - b) < EPSILON};
    },

    evalToWithContext(a, b) {
        const { input, context } = a;
        const expr = parse(input);
        const result = evaluate.evaluate(expr, context);
        return {message: 'Expected ' + b + ' but received ' + result, pass: Math.abs(result - b) < EPSILON};
    }
});

function evalsCorrectly(expr, value) {
    test(expr + ' to ' + value, () => {
        expect(expr).evalTo(value);
    });
}


evalsCorrectly('10', 10);
evalsCorrectly('10 + 10', 20);
evalsCorrectly('10 * 10', 100);
evalsCorrectly('10 / 5', 2);
evalsCorrectly('2 + 3 * 4', 14);
evalsCorrectly('sin(0)', 0);
evalsCorrectly('cos(0)', 1);

test('evaluates constants correctly', () => {
    expect('pi').evalTo(Math.PI);
});

test('evaluates parameters correctly', () => {
    const context = evaluate.context({symbols: [evaluate.constant('x', 5)]});
    expect({context, input: 'x * x - 2 * x'}).evalToWithContext(15);
});

test('evaluates multiple parameters correctly', () => {
    const context = evaluate.context({
        symbols: [ 
            evaluate.constant('x', 5),
            evaluate.constant('a', 2)
        ]
    });

    expect({context, input: 'a + x * a'}).evalToWithContext(12);
});

test('evaluates custom function correctly', () => {
    const context = evaluate.context({
        functions: [ 
            evaluate.customFunc(parse('f(x) = x * x'))
        ]
    });

    expect({context, input: 'f(10)'}).evalToWithContext(100);
});

test('nested contexts', () => {
    const upperContext = evaluate.context({
        functions: [ 
            evaluate.customFunc(parse('f(x) = x * x')),
        ]
    });

    const context = evaluate.context({
        parent: upperContext,
        functions: [ 
            evaluate.customFunc(parse('g(x) = x * f(x)'))
        ]
    });

    expect({context, input: 'g(5)'}).evalToWithContext(125);
});