import React, { Component } from 'react';
import './Console.css'

import Card, { CardTypes }  from './Card';

import { parse, ParseError } from './math/parser';
import { defaultStore, evaluate, UndefinedSymbol, EvalError, evaluateFunction } from './math/evaluate';
import { simplify, InvalidExpression, isFunctionDefinition, isVariableDefinition } from './math/expression';
import { SymbolStore, funcFromAssignment, variableFromAssignment, constant } from './math/symbolStore';

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

    evalInput(input, currentState) {
        const parseInput = (value) => {
            try {
                return {expr: parse(value)};
            } catch (e) {
                if (e instanceof ParseError) {
                    return {hasError: true, parseError: e};
                } else {
                    throw e;
                }
            }
        }

        const { expr, parseError, hasError = false } = parseInput(input);

        if (hasError) {
            const card = {error: parseError, cardType: CardTypes.ERROR};
            return {card};
        }

        const isValidExpression = (value, store = currentState.store) => {
            try {
                evaluate(value, store);
                simplify(expr);

                return {valid: true};
            } catch (e) {
                if (e instanceof UndefinedSymbol || e instanceof InvalidExpression) {
                    return {valid: false, error: e};
                } else if (e instanceof EvalError) {
                    // Eval errors get handled by the cards themselves
                    return {valid: true};
                } else {
                    throw e;
                }
            }
        }

        if (isFunctionDefinition(expr)) {
            // TODO: Consider functions that have arguments other than 'x'
            const symbols = expr.left.args.map(arg => [arg.name, constant(1)]);
            const funcStore = currentState.store.addScope(symbols);

            const { valid, error: exprError } = isValidExpression(expr.right, funcStore);

            if (!valid) {
                const card = {error: exprError, cardType: CardTypes.ERROR};

                return {card};
            }

            const card = {expr, cardType: CardTypes.FUNCTION};

            return {card, symbol: funcFromAssignment(expr)};
        }

        if (isVariableDefinition(expr)) {
            const { valid, error: exprError } = isValidExpression(expr.right);

            if (!valid) {
                const card = {error: exprError, cardType: CardTypes.ERROR};

                return {card}
            }

            const name = expr.left.name;
            const card = {name, expr: expr.right, cardType: CardTypes.VARIABLE};

            return {card, symbol: variableFromAssignment(expr)};
        }

        const { valid, error: exprError } = isValidExpression(expr);

        if (!valid) {
            const card = {error: exprError, cardType: CardTypes.ERROR};
            return {card};
        }

        const card = {expr, cardType: CardTypes.EXPRESSION};

        return {card};
    }

    stateWithNewCard(input, currentState) {
        const {card, symbol = null} = this.evalInput(input, currentState);

        let newStore = currentState.store;
        let newCard = {...card, storePosition: currentState.store.scopes.length};

        if (symbol) {
            newStore = currentState.store.addScope([symbol]);
        }

        const cards = [...currentState.cards, newCard];


        return {
            ...currentState,
            cards,
            store: newStore
        };
    }

    setSymbol(storePosition, name, value) {
        this.setState({
            ...this.state,
            store: this.state.store.setSymbol(storePosition, name, value)
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
            ...this.stateWithNewCard(this.state.inputValue, this.state),
            inputValue: ''
        });
    }

    addCards(inputs) {
        let newState = this.state;
        for (let input of inputs) {
            newState = this.stateWithNewCard(input, newState)
            console.log(newState);
        }

        this.setState({
            ...this.state,
            ...newState
        });
    }

    removeCard(id) {

    }

    componentDidMount() {
        this.props.registerMethods({
            addCards: this.addCards.bind(this)
        });
    }

    render() {
        const cards = this.state.cards.map((card, i) =>
            <div key={i}>
                <Card remove={() => this.removeCard(i)} store={this.state.store.setPosition(card.storePosition)} setSymbol={this.setSymbol} {...card}/>
                <div className='Seperator'></div>
            </div>
        );

        return <div className='OuterContainer'>
            <div className='InnerContainer'>
            <div className='Console'>
                {cards}

                <div className='Buffer'></div>

                <div className='InputCard'>
                    <div className='Input'>
                        <input className='TextInput' type='text' spellCheck='false'
                            value={this.state.inputValue}
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    this.onSubmit();
                                }
                            }}
                            onChange={this.onInputChanged} />
                        <input className='SubmitButton' type='button' value='Submit' onClick={this.onSubmit} />
                    </div>
                </div>
            </div>
            </div>
        </div>
    }
}

export default Console;