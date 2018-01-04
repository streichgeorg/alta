import React, { Component } from 'react';

import './Card.css';

import FunctionPlot from './FunctionPlot';

import { assert } from './util';
import { parse, ParseError } from './math/parser';
import { evaluate, evaluateFunction, EvalError, UndefinedSymbol } from './math/evaluate';
import { variable, constant } from './math/symbolStore';
import { identifier, expressionToString, simplify, getParameters } from './math/expression';

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

    constructor(props) {
        super(props);

        if (props.cardType !== CardTypes.ERROR) {
            const params = getParameters(props.expr);
            let dependent = {};
            for (const param of params) {
                dependent[param] = evaluate(identifier(param), props.store);
            }

            this.state = {
                dependent
            };
        }

    }

    componentWillReceiveProps(nextProps) {
        if (this.props.cardType === CardTypes.ERROR) {
            return;
        }

        let changedValues = {};

        for (const param in this.state.dependent) {
            const newValue = evaluate(identifier(param), nextProps.store);

            if (newValue !== this.state.dependent[param]) {
                changedValues[param] = newValue;
            }
        }

        this.setState({
            ...this.state,
            dependent: {
                ...this.state.dependent,
                ...changedValues
            }
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.cardType === CardTypes.ERROR) {
            return false;
        }

        for (let param in this.state.dependent) {
            if (nextState.dependent[param] !== this.state.dependent[param]) {
                return true;
            }
        }

        return false;
    }

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
        const str = expressionToString(this.props.expr);
        const funcDef = this.props.expr.left;

        if (funcDef.args.length > 1) {
            console.warn('Cannot display funtion with more than one argument');

            return <div>
                <div className='FunctionTitle'>{str}</div>
            </div>
        }

        const func = x => {
            const symbol = [funcDef.args[0].name, x];
            return evaluateFunction([symbol], this.props.expr, this.props.store);
        };

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

        return <div>
            {inner}

            <div className='Footer'>
                <a className='FooterText' onClick={this.props.remove}>Delete</a>
            </div>
        </div>;
    }
}

export default Card;
export { CardTypes };