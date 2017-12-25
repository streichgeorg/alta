import { zip, reversed, assert, createErrorType } from '../util';
import { ExpressionTypes, InvalidExpression } from './expression';
import { constant, isValue, isFunction, builtinFunc, FunctionTypes, ValueTypes, SymbolTypes, SymbolStore } from './symbolStore';

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
        default:
            throw new EvalError('Unsupported expression type');
    }
}

function evaluateFunction(args, expr, store) {
    const argSymbols = args.map(([name, value]) => [name, constant(value)]);
    const funcStore = store.addScope(argSymbols);
    return evaluate(expr.right, funcStore);
}

export { defaultStore, evaluate, evaluateFunction, EvalError, UndefinedSymbol };