import { assert, reversed } from '../util';

export const SymbolTypes = {
    VALUE: 0,
    FUNCTION: 1,
};

export function isValue(symbol)  {
    return symbol.symbolType === SymbolTypes.VALUE;
}

export function isFunction(symbol)  {
    return symbol.symbolType === SymbolTypes.FUNCTION;
}

export const FunctionTypes = {
    BUILTIN: 0,
    CUSTOM: 1,
};

export function isBuiltin(func) {
    return func.type === FunctionTypes.BUILTIN;
}

export function isCustom(func) {
    return func.type === FunctionTypes.CUSTOM;
}

export function builtinFunc(func, argCount=1) {
    return {
        func,
        argCount,

        symbolType: SymbolTypes.FUNCTION,
        type: FunctionTypes.BUILTIN
    };
}

export function funcFromAssignment(assignment) {
    const expr = assignment.right;
    const argNames = assignment.left.args.map(arg => arg.name);

    return [assignment.left.name, customFunc(expr, argNames)];
}

export function customFunc(expr, argNames) {
    return {
        expr,
        argNames,

        symbolType: SymbolTypes.FUNCTION,
        type: FunctionTypes.CUSTOM
    };
}


export const ValueTypes = {
    CONSTANT: 0,
    VARIABLE: 1
};

export function isConstant(value) {
    return value.type === ValueTypes.CONSTANT;
}

export function isVariable(value) {
    return value.type === ValueTypes.VARIABLE;
}

export function constant(value) {
    return {
        value,

        symbolType: SymbolTypes.VALUE,
        type: ValueTypes.CONSTANT
    };
}

export function variableFromAssignment(assignment) {
    return [assignment.left.name, variable(assignment.right)];
}

export function variable(expr) {
    return {
        expr,

        symbolType: SymbolTypes.VALUE,
        type: ValueTypes.VARIABLE
    };
}

export class SymbolStore {
    static fromSymbolList(symbols) {
        let scope = {};
        for (let symbol of symbols) {
            scope[symbol[0]] = symbol[1];
        }

        return new SymbolStore([scope]);
    }

    static storeWithPosition(store, position) {
        return new SymbolStore(store.scopes, position);
    }

    constructor(scopes, position = null) {
        this.scopes = scopes;

        if (position) {
            assert(position <= scopes.length);
            this.position = position;
        } else {
            this.position = scopes.length;
        }
    }

    addScope(symbols) {
        const newScope = {};
        for (const symbol of symbols) {
            newScope[symbol[0]] = symbol[1];
        }

        const scopes = [...this.scopes, newScope];

        return new SymbolStore(scopes);
    }

    branch(position) {
        return new SymbolStore(this.scopes.slice(0, position));
    }

    findScopeWithSymbol(name) {
        const i = reversed(this.scopes.slice(0, this.position))
                                .findIndex(scope => name in scope);
        if (i === -1) {
            return {hasScope: false};
        }

        const position = this.position - i - 1;
        return {hasScope: true, scope: this.scopes[position], position};
    }

    hasSymbol(name) {
        return this.findScopeWithSymbol(name).hasScope;
    }

    getSymbol(name) {
        let { hasScope, scope, position } = this.findScopeWithSymbol(name);
        return {symbol: scope[name], position};
    }

    setSymbol(position, name, value) {
        let scope = this.scopes[position];
        assert(name in scope);

        let newScope = scope;
        newScope[name] = value;

        let newStore = [
            ...this.scopes.slice(0, position),   
            newScope,
            ...this.scopes.slice(position + 1)
        ];

        return new SymbolStore(newStore);
    }
}