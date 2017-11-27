import { ExpressionTypes } from './expression';

const FunctionTypes = {
    BUILTIN: 0,
};

const defaultFunctions = {
    'sin': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.sin
    },
    'cos': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.cos
    },
    'tan': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.tan
    },
    'asin': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.asin
    },
    'acos': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.acos
    },
    'atan': {
        type: FunctionTypes.BUILTIN,
        argCount: 1,
        func: Math.atan
    },
};

const SymbolTypes = {
    CONSTANT: 0
};

const defaultSymbols = {
    'pi': {
        type: SymbolTypes.CONSTANT,
        value: Math.PI
    },
    'e': {
        type: SymbolTypes.CONSTANT,
        value: Math.E
    },
};

function evaluationContext(parent=null, symbols, functions) {
    return {
        parent,
        symbols,
        functions
    };
}

const defaultContext = evaluationContext();

function evalIdentifier(context, identifier) {
    const getSymbol = (name, context) => {
        if (name in context.symbols) {
            return {hasSymbol: true, symbol: context.symbols[name]};
        }
        if (context.parent) {
            return getSymbol(name, context.parent);
        }

        return {hasSymbol: false, symbol: null};
    }

    const { hasSymbol, symbol } = getSymbol(identifier.name, context);

    if (!hasSymbol) {
        throw '\'' + name + '\' is not defined';
    }

    switch (symbol.type) {
        case SymbolTypes.CONSTANT:
            return symbol.value;
        default:
            throw 'Unsupported symbol type';
    }
}

function evalFunction(context, expr) {
    const getFunction = (name, context)  => {
        if (name in context.functions) {
            return {hasFunction: true, func: context.functions[name]};
        }
        if (context.parent) {
            return getFunction(name, context.parent)
        }

        return {hasFunction: false, func: null};
    }

    const { hasFunction, func } = getFunction(expr.name, context);

    const args = func.args.map(arg => evalExpr(context, arg));

    switch (func.type) {
        case FunctionTypes.BUILTIN:
            if (func.argCount !== args.length) {
                throw 'Wrong amount of arguments';
            }

            return func.func(...args);
        default:
            throw 'Unsupported function type';
    }
}

function evalExpr(expr, context=defaultContext) {
    switch (expr.type) {
        case ExpressionTypes.IDENTIFIER:
            return evalIdentifier(context, expr);
        case ExpressionTypes.NUMBER:
            return expr.number;
        case ExpressionTypes.SUM:
            return expr.summands.reduce((acc, value) => acc + evalExpr(value), 0);
        case ExpressionTypes.PRODUCT:
            return expr.factors.reduce((acc, value) => acc * evalExpr(value), 1);
        case ExpressionTypes.FRACTION:
            return evalExpr(expr.numerator) / evalExpr(expr.denominator);
        case ExpressionTypes.POWER:
            return Math.pow(evalExpr(expr.base), evalExpr(expr.exponent));
        case ExpressionTypes.FUNCTION:
            return evalFunction(context, expr);
        default:
            throw 'Can\'t evalExpr expression';
    }
}

export { evalExpr };