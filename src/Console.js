import React, { Component } from 'react';
import './Console.css'

import Card, { CardTypes }  from './Card';

import { parse, ParseError } from './math/parser';
import { addScope, constant, customFunc, currentScopeId, defaultStore, evaluate, UndefinedSymbol, variable, storeWithScope, setVariableValue } from './math/evaluate';
import { simplify, InvalidExpression, isFunctionDefinition, isVariableDefinition } from './math/expression';

class Console extends Component {
    constructor(props) {
        super(props);

        this.state = {
            store: defaultStore,
            cards: [],
            inputValue: '',
        };

        this.onInputChanged = this.onInputChanged.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.setSymbol = this.setSymbol.bind(this);
    }

    evalInput(input) {
        const parseInput = (value) => {
            try {
                return {expr: parse(value)};
            } catch (e) {
                if (e instanceof ParseError) {
                    return {hasError: true, error: e};
                }
            }
        }

        const { expr, parseError, hasError = false } = parseInput(input);

        if (hasError) {
            const card = {error: parseError, cardType: CardTypes.ERROR};
            return {card};
        }

        const isValidExpression = (value, store = this.state.store, scopeId = store.length) => {
            try {
                evaluate(value, storeWithScope(store, scopeId));
                simplify(expr);

                return {valid: true};
            } catch (e) {
                if (e instanceof UndefinedSymbol || e instanceof InvalidExpression) {
                    return {valid: false, error: e};
                }

                throw e;
            }
        }

        if (isFunctionDefinition(expr)) {
            // TODO: Consider functions that have arguments other than 'x'
            const symbols = [constant('x', 1)];
            const { store: funcStore, scopeId: funcScope } = addScope(this.state.store, symbols);

            const { valid, error: exprError } = isValidExpression(expr.right, funcStore, funcScope);

            if (!valid) {
                const card = {error: exprError, cardType: CardTypes.ERROR};

                return {card};
            }

            const card = {expr, cardType: CardTypes.FUNCTION};

            return {card, symbol: customFunc(expr)};
        }

        if (isVariableDefinition(expr)) {
            const { valid, error: exprError } = isValidExpression(expr.right);

            if (!valid) {
                const card = {error: exprError, cardType: CardTypes.ERROR};

                return {card}
            }

            const name = expr.left.name;
            const card = {name, expr: expr.right, cardType: CardTypes.VARIABLE};

            return {card, symbol: variable(name, expr.right)};
        }

        const { valid, error: exprError } = isValidExpression(expr);

        if (!valid) {
            const card = {error: exprError, cardType: CardTypes.ERROR};
            return {card};
        }

        const card = {expr, cardType: CardTypes.EXPRESSION};

        return {card};
    }

    stateWithNewCard(input) {
        const {card, symbol = null} = this.evalInput(input);

        let newStore = this.state.store;
        let newCard = {...card, scopeId: currentScopeId(this.state.store)};

        if (symbol) {
            newStore = addScope(this.state.store, [symbol]).store;
        }

        const cards = [...this.state.cards, newCard];


        return {
            ...this.state,
            cards,
            store: newStore
        };
    }

    setSymbol(scopeId, name, value) {
        this.setState({
            ...this.state,
            store: setVariableValue(storeWithScope(this.state.store, scopeId), name, value)
        });
    }

    onInputChanged(e) {
        this.setState({...this.state, inputValue: e.target.value});
    }

    onSubmit() {
        if (this.state.inputValue === '') {
            return;
        }

        this.setState({
            ...this.state,
            ...this.stateWithNewCard(this.state.inputValue),
            inputValue: ''
        });
    }

    render() {
        const cards = this.state.cards.map((card, i) =>
            <div key={i}>
                {i !== 0 && 
                    <div className='Seperator'></div>
                }
                <Card store={this.state.store} setSymbol={this.setSymbol} {...card}/>
            </div>
        );

        return <div className='Console'>
            {cards}

            <div className='Buffer'></div>

            <div className='Input'>
                <input className='TextInput' type='text' spellcheck='false' value={this.state.inputValue} onChange={this.onInputChanged} />
                <input className='SubmitButton' type='button' value='Submit' onClick={this.onSubmit} />
            </div>
        </div>
    }
}

export default Console;