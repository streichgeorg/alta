import { zip, assert, createErrorType } from '../util';
import { ExpressionTypes, InvalidExpression } from './expression';

const EvalError = createErrorType('EvalError');
const UndefinedSymbol = createErrorType('UndefinedSymbol');

const SymbolTypes = {
    VARIABLE: 0,
    FUNCTION: 1,
};

function isVariable(symbol)  {
    return symbol.symbolType === SymbolTypes.VARIABLE;
}

function isFunction(symbol)  {
    return symbol.symbolType === SymbolTypes.FUNCTION;
}

const FunctionTypes = {
    BUILTIN: 0,
    CUSTOM: 1,
};

function builtinFunc(name, func, argCount=1) {
    return {
        name,

        value: {
            func,
            argCount,

            symbolType: SymbolTypes.FUNCTION,
            type: FunctionTypes.BUILTIN
        }
    };
}

function customFunc(assignment) {
    const expr = assignment.right;
    const name = assignment.left.name;
    const argNames = assignment.left.args.map(arg => arg.name);

    return {
        name,

        value: {
            expr,
            name,
            argNames,

            symbolType: SymbolTypes.FUNCTION,
            type: FunctionTypes.CUSTOM
        }
    };
}


const VariableTypes = {
    CONSTANT: 0
};

function constant(name, value) {
    return {
        name,

        value: {
            value,

            symbolType: SymbolTypes.VARIABLE,
            type: VariableTypes.CONSTANT
        }
    };
}

function newContext({parent = defaultContext, symbols = []} = {}) {
    const symbolMap = {};
    for (let {name, value} of symbols) {
        symbolMap[name] = value;
    }

    return {
        parent: parent,
        symbols: symbolMap,
    };
}

function hasSymbol(context, name) {
    if (name in context.symbols) {
        return true;
    }

    if (context.parent) {
        return hasSymbol(context.parent, name);
    }

    return false;
}

function getSymbol(context, name) {
    if (name in context.symbols) {
        return context.symbols[name];
    }

    if (context.parent) {
        return getSymbol(context.parent, name);
    }

    return null;
}

const defaultSymbols = [
    builtinFunc('sin', Math.sin),
    builtinFunc('cos', Math.cos),
    builtinFunc('tan', Math.tan),
    builtinFunc('asin', Math.asin),
    builtinFunc('acos', Math.acos),
    builtinFunc('atan', Math.atan),

    constant('pi', Math.PI),
    constant('e', Math.E),
];

const defaultContext = newContext({parent: null, symbols: defaultSymbols});

function evalIdentifier(expr, context) {
    if (!hasSymbol(context, expr.name)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    const variable = getSymbol(context, expr.name);
    if (!isVariable(variable)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    switch (variable.type) {
        case VariableTypes.CONSTANT:
            return variable.value;
        default:
            assert(false);
    }
}

function evalFunction(expr, context) {
    if (!hasSymbol(context, expr.name)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const func = getSymbol(context, expr.name);
    if (!isFunction(func)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const args = expr.args.map(arg => evaluate(arg, context));

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

            const symbols = zip(func.argNames, args).map(([ name, value ]) => constant(name, value));

            return evaluate(func.expr, newContext({parent: context, symbols}));
        default:
            assert(false);
    }
}

function evaluate(expr, context=defaultContext) {
    switch (expr.type) {
        case ExpressionTypes.IDENTIFIER:
            return evalIdentifier(expr, context);
        case ExpressionTypes.NUMBER:
            return expr.number;
        case ExpressionTypes.SUM:
            return expr.summands.reduce((acc, value) => acc + evaluate(value, context), 0);
        case ExpressionTypes.PRODUCT:
            return expr.factors.reduce((acc, value) => acc * evaluate(value, context), 1);
        case ExpressionTypes.FRACTION:
            const numerator = evaluate(expr.numerator, context);
            const denominator = evaluate(expr.denominator, context);

            if (denominator === 0) {
                throw new EvalError('Division by 0');
            }

            return numerator / denominator;
        case ExpressionTypes.POWER:
            return Math.pow(evaluate(expr.base, context), evaluate(expr.exponent, context));
        case ExpressionTypes.FUNCTION:
            return evalFunction(expr, context);
        default:
            throw new EvalError('Unsupported expression type');
    }
}

function evaluateFunction(args, expr, context=defaultContext) {
    const functionContext = newContext({parent: context, symbols: args.map(arg => constant(...arg))});
    return evaluate(expr.right, functionContext);
}

export { newContext, customFunc, constant, evaluate, evaluateFunction, EvalError, UndefinedSymbol };