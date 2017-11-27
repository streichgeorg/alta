import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import { parse } from './math/parser';
import * as evaluate from './math/evaluate';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();

const upperContext = evaluate.context({
    functions: [ 
        evaluate.customFunc(parse('f(x) = x * x')),
    ]
});

const context = evaluate.context({
    parent: upperContext,
    functions: [ 
        evaluate.customFunc(parse('g(x) = x * f(x)'))
    ]
});

console.log(evaluate.evaluate(parse('g(5)'), context));