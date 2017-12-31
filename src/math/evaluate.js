import { zip, reversed, assert, createErrorType } from '../util';
import { ExpressionTypes, InvalidExpression } from './expression';
import { constant, isValue, isFunction, builtinFunc, FunctionTypes, ValueTypes, SymbolTypes, SymbolStore, funcFromAssignment } from './symbolStore';
import { factorial } from './factorial'

const EPSILON = 0.00001;
const apprxEqu = (a, b) => Math.abs(a - b) < EPSILON;

const EvalError = createErrorType('EvalError');
const UndefinedSymbol = createErrorType('UndefinedSymbol');

const defaultSymbols = [
    ['sin', builtinFunc(Math.sin)],
    ['cos', builtinFunc(Math.cos)],
    ['tan', builtinFunc(Math.tan)],
    ['asin', builtinFunc(Math.asin)],
    ['acos', builtinFunc(Math.acos)],
    ['atan', builtinFunc(Math.atan)],
    ['sqrt', builtinFunc(Math.sqrt)],
    ['ln', builtinFunc(Math.log)],
    ['log', builtinFunc(Math.log10)],

    ['pi', constant(Math.PI)],
    ['e', constant(Math.E)],
];

const defaultStore = SymbolStore.fromSymbolList(defaultSymbols);

function evalIdentifier(expr, store) {
    if (!store.hasSymbol(expr.name)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    const { symbol: value, position } = store.getSymbol(expr.name);
    if (!isValue(value)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    switch (value.type) {
        case ValueTypes.CONSTANT:
            return value.value;
        case ValueTypes.VARIABLE:
            return evaluate(value.expr, store.setPosition(position));
        default: 
            assert(false);
    }
}

function evalFunction(expr, store) {
    if (!store.hasSymbol(expr.name)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const { symbol: func, position } = store.getSymbol(expr.name);
    if (!isFunction(func)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const args = expr.args.map(arg => evaluate(arg, store));


    switch (func.type) {
        case FunctionTypes.BUILTIN:
            if (func.argCount !== args.length) {
                throw new InvalidExpression('Wrong number of arguments');
            }

            if ((expr.name === 'ln' || expr.name === 'log') && apprxEqu(args[0], 0)) {
                throw new EvalError('log(0) is undefined');
            }

            return func.func(...args);
        case FunctionTypes.CUSTOM:
            if (func.argNames.length !== args.length) {
                throw new InvalidExpression('Wrong number of arguments');
            }

            const symbols = zip(func.argNames, args).map(([ name, value ]) => [name, constant(value)]);
            const funcStore  = store.branch(position).addScope(symbols);

            return evaluate(func.expr, funcStore);
        default:
            assert(false);
    }
}

function evalSummation(expr, store) {
    const low = evaluate(expr.low, store);
    const high = evaluate(expr.high, store);

    if (low > high) {
        throw EvalError('Cannot sum in reverse order');
    }

    let sum = 0;
    for (let i = low; i <= high; i++) {
        let symbol = [expr.counter, constant(i)];
        let counterStore = store.addScope([symbol]);
        sum += evaluate(expr.expr, counterStore);
    }

    return sum;
}

function evaluate(expr, store = defaultStore) {
    switch (expr.type) {
        case ExpressionTypes.IDENTIFIER:
            return evalIdentifier(expr, store);
        case ExpressionTypes.NUMBER:
            return expr.number;
        case ExpressionTypes.SUM:
            return expr.summands.reduce((acc, value) => acc + evaluate(value, store), 0);
        case ExpressionTypes.PRODUCT:
            return expr.factors.reduce((acc, value) => acc * evaluate(value, store), 1);
        case ExpressionTypes.FRACTION:
            const numerator = evaluate(expr.numerator, store);
            const denominator = evaluate(expr.denominator, store);

            if (denominator === 0) {
                throw new EvalError('Division by 0 is undefined');
            }

            return numerator / denominator;
        case ExpressionTypes.POWER:
            let base = evaluate(expr.base, store);
            let exponent = evaluate(expr.exponent, store);
            if (base < 0 && exponent % 1 !== 0)  {
                throw new EvalError('Non Integer exponent with a negative base');
            }
            return Math.pow(evaluate(expr.base, store), evaluate(expr.exponent, store));
        case ExpressionTypes.FUNCTION:
            return evalFunction(expr, store);
        case ExpressionTypes.SUMMATION:
            return evalSummation(expr, store);
        case ExpressionTypes.FACTORIAL:
            const child = evaluate(expr.child, store);

            if (child % 1 !== 0) {
                throw new EvalError('Factorial is only defined for integers');
            }

            if (child > 171) {
                throw new EvalError('Factorial is only defined for integers smaller than 171');
            }

            return factorial(child);
        default:
            throw new EvalError('Unsupported expression type');
    }
}

function evaluateFunction(args, expr, store) {
    const argSymbols = args.map(([name, value]) => [name, constant(value)]);
    const funcStore = store.addScope(argSymbols);
    const result = evaluate(expr.right, funcStore);

    return result;
}

export { defaultStore, evaluate, evaluateFunction, EvalError, UndefinedSymbol };