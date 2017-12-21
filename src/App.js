import React, { Component } from 'react';
import './App.css';

import Console from './Console';


class App extends Component {
    render() {
        return <div className='App'>
            <div className='Menu'></div>
            <Console/>
            <div className='Buffer'></div>
        </div>
    }

}

export default App;
