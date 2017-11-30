import React, { Component } from 'react';
import './Console.css'

import Card, { CardTypes }  from './Card';

import { parse, ParseError } from './math/parser';
import { constant, customFunc, newContext, evaluate, UndefinedSymbol } from './math/evaluate';
import { simplify, InvalidExpression, isFunctionDefinition } from './math/expression';

class Console extends Component {
    constructor(props) {
        super(props);

        this.state = {
            context: newContext({parent: this.props.context}),
            cards: [],
            inputValue: '',
        };

        this.onInputChanged = this.onInputChanged.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
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

        const isValidExpression = (value, context = this.state.context) => {
            try {
                evaluate(value, context);
                simplify(expr);

                return {valid: true};
            } catch (e) {
                if (e instanceof UndefinedSymbol || e instanceof InvalidExpression) {
                    return {valid: false, error: e};
                }
            }
        }

        if (isFunctionDefinition(expr)) {
            // TODO: Consider functions that have arguments other than 'x'
            const functionContext = newContext({parent: this.state.currentContext, symbols: [constant('x', 1)]});
            const { valid, error: exprError } = isValidExpression(expr.right, functionContext);

            if (!valid) {
                const card = {error: exprError, cardType: CardTypes.ERROR};

                return {card};
            }

            const card = {expr, cardType: CardTypes.FUNCTION};

            return {card, func: customFunc(expr)};
        }

        const { valid, exprError } = isValidExpression(expr);

        if (!valid) {
            const card = {error: exprError, cardType: CardTypes.ERROR};
            return {card};
        }

        const card = {expr, cardType: CardTypes.EXPRESSION};

        return {card};
    }

    stateWithNewCard(input) {
        const {card, func = null} = this.evalInput(input);

        let context = this.state.context;

        card.context = context;

        if (func) {
            context = newContext({parent: context, symbols: [func]});
        }

        const cards = [...this.state.cards, card];

        return {
            ...this.state,
            context,
            cards
        };
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
        const cards = this.state.cards.map((card, i) => <Card key={i} state={card}/>);

        return <div className='Console'>
            {cards}

            <div className='Buffer'></div>

            <div className='Input'>
                <input className='TextInput' type='text' value={this.state.inputValue} onChange={this.onInputChanged} />
                <input className='SubmitButton' type='button' value='Submit' onClick={this.onSubmit} />
            </div>
        </div>
    }
}

export default Console;