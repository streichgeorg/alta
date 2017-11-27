import { parse } from './parser';
import { evalExpr } from './evalExpr';

expect.extend({
    evalTo(a, b) {
        const expr = parse(a);
        return {pass: evalExpr(expr) === b};
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