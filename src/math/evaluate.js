import { zip, reversed, assert, createErrorType } from '../util';
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
    CONSTANT: 0,
    VARIABLE: 1
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

function variable(name, value) {
    return {
        name,

        value: {
            value,

            symbolType: SymbolTypes.VARIABLE,
            type: VariableTypes.VARIABLE
        }
    };
}

function addScope(store, symbols = []) {
    const newScope = {};
    for (const symbol of symbols) {
        newScope[symbol.name] = symbol.value;
    }

    const newStore = [...store, newScope];

    return {scopeId: currentScopeId(newStore), store: newStore};
}

function currentScopeId(store) {
    return store.length;
}

function storeWithScope(store, scopeId = null) {
    if (!scopeId) {
        return {
            store,
            scopeId: currentScopeId(store)
        };
    }

    return {
        scopeId,
        store
    };
}

function findScopeWithSymbol(scopedStore, symbolName) {
    const { scopeId, store } = scopedStore;

    assert(scopeId <= store.length);
    const reversedIndex = reversed(store.slice(0, scopeId)).findIndex(scope => symbolName in scope);

    if (reversedIndex === -1) {
        return {hasScope: false};
    }

    const id = scopeId - reversedIndex - 1;

    return {hasScope: true, scope: store[id], index: id};
}

function setVariableValue(scopedStore, name, value) {
    let { store, scopeId } = scopedStore;

    assert(scopedStore.scopeId <= store.length);

    let scope = store[scopeId];
    assert(scope[name].symbolType === SymbolTypes.VARIABLE);
    assert(scope[name].type === VariableTypes.VARIABLE);


    let newScope = scope;
    newScope[name] = {
        value,
        symbolType: SymbolTypes.VARIABLE,
        type: VariableTypes.VARIABLE,
    };

    const newStore = [
        ...store.slice(0, scopeId),
        newScope,
        ...store.slice(scopeId + 1)
    ];

    return newStore;
}

function hasSymbol(scopedStore, name) {
    const { hasScope } = findScopeWithSymbol(scopedStore, name);
    return hasScope;
}

function getSymbol(scopedStore, name) {
    const { scope, index } = findScopeWithSymbol(scopedStore, name);

    return {symbol: scope[name], scopeId: index};
}

const defaultSymbols = [
    builtinFunc('sin', Math.sin),
    builtinFunc('cos', Math.cos),
    builtinFunc('tan', Math.tan),
    builtinFunc('asin', Math.asin),
    builtinFunc('acos', Math.acos),
    builtinFunc('atan', Math.atan),
    builtinFunc('sqrt', Math.sqrt),

    constant('pi', Math.PI),
    constant('e', Math.E),
];

const { scopeId: defaultScopeId, store: defaultStore } = addScope([], defaultSymbols);

function evalIdentifier(expr, scopedStore) {
    if (!hasSymbol(scopedStore, expr.name)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    const { symbol: variable, scopeId } = getSymbol(scopedStore, expr.name);
    if (!isVariable(variable)) {
        throw new UndefinedSymbol('Variable \'' + expr.name + '\' is not defined');
    }

    switch (variable.type) {
        case VariableTypes.CONSTANT:
            return variable.value;
        case VariableTypes.VARIABLE:
            return evaluate(variable.value, storeWithScope(scopedStore.store, scopeId));
        default: 
            assert(false);
    }
}

function evalFunction(expr, scopedStore) {
    if (!hasSymbol(scopedStore, expr.name)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const { symbol: func, scopeId } = getSymbol(scopedStore, expr.name);
    if (!isFunction(func)) {
        throw new UndefinedSymbol('Function \'' + expr.name + '\' is not defined');
    }

    const args = expr.args.map(arg => evaluate(arg, scopedStore));

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
            const store  = addScope(scopedStore.store.slice(0, scopeId), symbols);

            return evaluate(func.expr, store);
        default:
            assert(false);
    }
}

function evaluate(expr, scopedStore=storeWithScope(defaultStore, defaultScopeId)) {
    switch (expr.type) {
        case ExpressionTypes.IDENTIFIER:
            return evalIdentifier(expr, scopedStore);
        case ExpressionTypes.NUMBER:
            return expr.number;
        case ExpressionTypes.SUM:
            return expr.summands.reduce((acc, value) => acc + evaluate(value, scopedStore), 0);
        case ExpressionTypes.PRODUCT:
            return expr.factors.reduce((acc, value) => acc * evaluate(value, scopedStore), 1);
        case ExpressionTypes.FRACTION:
            const numerator = evaluate(expr.numerator, scopedStore);
            const denominator = evaluate(expr.denominator, scopedStore);

            if (denominator === 0) {
                throw new EvalError('Division by 0 is undefined');
            }

            return numerator / denominator;
        case ExpressionTypes.POWER:
            let base = evaluate(expr.base, scopedStore);
            let exponent = evaluate(expr.exponent, scopedStore);
            if (base < 0 && exponent % 1 !== 0)  {
                throw new EvalError('Non Integer exponent with a negative base');
            }
            return Math.pow(evaluate(expr.base, scopedStore), evaluate(expr.exponent, scopedStore));
        case ExpressionTypes.FUNCTION:
            return evalFunction(expr, scopedStore);
        default:
            throw new EvalError('Unsupported expression type');
    }
}

function evaluateFunction(args, expr, scopedStore=storeWithScope(defaultStore, defaultScopeId)) {
    const symbols = args.map(arg => constant(...arg));
    const funcStore = addScope(scopedStore.store.slice(0, scopedStore.scopeId), symbols);
    return evaluate(expr.right, funcStore);
}

export { defaultStore, storeWithScope, addScope, currentScopeId, customFunc, constant, variable, setVariableValue, 
         evaluate, evaluateFunction, EvalError, UndefinedSymbol };