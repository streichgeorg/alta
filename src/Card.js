import React, { Component } from 'react';

import './Card.css';

import FunctionPlot from './FunctionPlot';

import { assert } from './util';
import { parse, ParseError } from './math/parser';
import { evaluate, evaluateFunction, EvalError, UndefinedSymbol } from './math/evaluate';
import { variable } from './math/symbolStore';
import { expressionToString, simplify } from './math/expression';

const CardTypes = {
    EXPRESSION: 0,
    FUNCTION: 1,
    VARIABLE: 2,
    ERROR: 3,
};

class VariableCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            inputValue: expressionToString(props.expr),
            expr: props.expr
        };

        this.onChange = this.onChange.bind(this);
    }

    onChange(e) {
        const inputValue = e.target.value;
        let expr = null;

        try {
            let parsed = parse(e.target.value);
            evaluate(parsed, this.props.store);

            expr = simplify(parsed);

            this.props.setSymbol(this.props.storePosition, this.props.name, variable(expr));
        } catch (e) {
            if ((e instanceof EvalError || e instanceof UndefinedSymbol)) {
                // TODO: Maybe display this to the user
                console.log(e);
            } else if (!(e instanceof ParseError)) { // Ignore parse errors
                throw e;
            }
        }

        this.setState({
            ...this.state,
            inputValue,
            expr
        });
    }

    render() {
        let result = null;
        if (this.state.expr) {
            try {
                result = '' + evaluate(this.state.expr, this.props.store);
            } catch (e) {}
        }

        return <div className='Card'>
            <a>{this.props.name} = </a>
            <input type='text' value={this.state.inputValue} onChange={this.onChange} />
            { (result !== null && result !== this.state.inputValue.trim()) &&
                <a> = {result}</a>
            }
        </div>
    }
}

class Card extends Component {
    renderError(e) {
        return <div className='Card' >{e.message}</div>
    }

    renderExpression() {
        try {
            const result = evaluate(this.props.expr, this.props.store);
            const str = expressionToString(this.props.expr);
            return <div className='Card'>{str} = {result}</div>;
        } catch (e) {
            if (e instanceof EvalError) {
                return this.renderError(e);
            } else {
                throw e;
            }
        }
    }

    renderFunction() {
        // TODO: Consider params other than x
        const func = x => evaluateFunction([['x', x]], this.props.expr, this.props.store);
        const str = expressionToString(this.props.expr);
        return <div>
            <div className='FunctionTitle'>{str}</div>
            <FunctionPlot domain={{x: [-10, 10], y: [-10, 10]}}  func={func}/>
        </div>
    }

    renderVariable() {
        return <VariableCard {...this.props}/>
    }

    render() {
        let inner;
        switch (this.props.cardType) {
            case CardTypes.ERROR:
                inner = this.renderError(this.props.error);
                break;
            case CardTypes.EXPRESSION:
                inner = this.renderExpression();
                break;
            case CardTypes.FUNCTION:
                inner = this.renderFunction();
                break;
            case CardTypes.VARIABLE:
                inner = this.renderVariable();
                break
            default:
                assert(false);
        }

        return <div>{inner}</div>;
    }
}

export default Card;
export { CardTypes };