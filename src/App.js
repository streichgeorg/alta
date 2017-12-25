import React, { Component } from 'react';
import './App.css';

import Console from './Console';
import Menu from './Menu';


class App extends Component {
    render() {
        return <div className='App'>
            <div className='MenuContainer'>
                <Menu/>
            </div>
            <Console/>
            <div className='Buffer'></div>
        </div>
    }

}

export default App;
