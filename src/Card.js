import React, { Component } from 'react';

import './Card.css';

import FunctionPlot from './FunctionPlot';

import { evaluate, evaluateFunction, EvalError } from './math/evaluate';

const CardTypes = {
    EXPRESSION: 0,
    FUNCTION: 1,
    ERROR: 2,
};

class Card extends Component {
    constructor(props) {
        super(props);

        this.state = props.state;
    }

    renderError() {
        return <div>{this.state.error.message}</div>
    }

    renderExpression() {
        try {
            const result = evaluate(this.state.expr, this.state.context);
            return <div className='ExpressionCard'>{result}</div>;
        } catch (e) {
            if (e instanceof EvalError) {
                return this.renderError(e);
            }
        }
    }

    renderFunction(func) {
        return <FunctionPlot domain={{x: [-10, 10], y: [-10, 10]}} context={this.state.context} func={this.state.expr}/>;
    }

    render() {
        let inner;
        switch (this.state.cardType) {
            case CardTypes.ERROR:
                inner = this.renderError();
                break;
            case CardTypes.EXPRESSION:
                inner = this.renderExpression();
                break;
            case CardTypes.FUNCTION:
                inner = this.renderFunction();
                break;
        }

        return <div className='Card'>{inner}</div>;
    }
}

export default Card;
export { CardTypes };