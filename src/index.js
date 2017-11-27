import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import { parse } from './math/parser';
import { simplify, identical } from './math/expression';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();

const a = simplify(parse('a * a * (1 / (a * a * a))'));

console.log(a);