import * as listUtil from '../listUtil';

import { ExpressionTypes } from './expression';

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

            type: FunctionTypes.CUSTOM
        }
    };
}

const defaultFunctions = [
    builtinFunc('sin', Math.sin),
    builtinFunc('cos', Math.cos),
    builtinFunc('tan', Math.tan),
    builtinFunc('asin', Math.asin),
    builtinFunc('acos', Math.acos),
    builtinFunc('atan', Math.atan),
];

const SymbolTypes = {
    CONSTANT: 0
};

function constant(name, value) {
    return {
        name,
        value: {
            value,

            type: SymbolTypes.CONSTANT
        }
    };
}

function context({parent = defaultContext, symbols = [], functions = []}) {
    const symbolMap = {};
    for (let {name, value} of symbols) {
        symbolMap[name] = value;
    }

    const functionMap = {};
    for (let {name, value} of functions) {
        functionMap[name] = value;
    }

    return {
        parent,
        symbols: symbolMap,
        functions: functionMap
    };
}

const defaultSymbols = [
    constant('pi', Math.PI),
    constant('e', Math.E),
];

const defaultContext = context({parent: null, symbols: defaultSymbols, functions: defaultFunctions});

function evalIdentifier(expr, currentContext) {
    const getSymbol = (name, currentContext) => {
        if (name in currentContext.symbols) {
            return {hasSymbol: true, symbol: currentContext.symbols[name]};
        }

        if (currentContext.parent) {
            return getSymbol(name, currentContext.parent);
        }

        return {hasSymbol: false, symbol: null};
    }

    const { hasSymbol, symbol } = getSymbol(expr.name, currentContext);

    if (!hasSymbol) {
        throw '\'' + expr.name + '\' is not defined';
    }

    switch (symbol.type) {
        case SymbolTypes.CONSTANT:
            return symbol.value;
        default:
            throw 'Unsupported symbol type';
    }
}

function evalFunction(expr, currentContext) {
    const getFunction = (name, currentContext)  => {
        if (name in currentContext.functions) {
            return {hasFunction: true, func: currentContext.functions[name]};
        }
        if (currentContext.parent) {
            return getFunction(name, currentContext.parent)
        }

        return {hasFunction: false, func: null};
    }

    const { hasFunction, func } = getFunction(expr.name, currentContext);

    const args = expr.args.map(arg => evaluate(arg, currentContext));

    if (!hasFunction) {
        throw '\'' + expr.name + '\' is not defined';
    }

    switch (func.type) {
        case FunctionTypes.BUILTIN:
            if (func.argCount !== args.length) {
                throw 'Wrong number of arguments';
            }

            return func.func(...args);
        case FunctionTypes.CUSTOM:
            if (func.argNames.length !== args.length) {
                throw 'Wrong number of arguments';
            }

            const symbols = listUtil.zip(func.argNames, args).map(([ name, value ]) => constant(name, value));

            return evaluate(func.expr, context({parent: currentContext.parent, symbols}));
        default:
            throw 'Unsupported function type';
    }
}

function evaluate(expr, currentContext=defaultContext) {
    switch (expr.type) {
        case ExpressionTypes.IDENTIFIER:
            return evalIdentifier(expr, currentContext);
        case ExpressionTypes.NUMBER:
            return expr.number;
        case ExpressionTypes.SUM:
            return expr.summands.reduce((acc, value) => acc + evaluate(value, currentContext), 0);
        case ExpressionTypes.PRODUCT:
            return expr.factors.reduce((acc, value) => acc * evaluate(value, currentContext), 1);
        case ExpressionTypes.FRACTION:
            return evaluate(expr.numerator, currentContext) / evaluate(expr.denominator, currentContext);
        case ExpressionTypes.POWER:
            return Math.pow(evaluate(expr.base, currentContext), evaluate(expr.exponent, currentContext));
        case ExpressionTypes.FUNCTION:
            return evalFunction(expr, currentContext);
        default:
            throw 'Unsupported expression type ';
    }
}

export { context, customFunc, constant, evaluate };