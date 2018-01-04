import React, { Component } from 'react';
import './App.css';

import Console from './Console';
import Menu from './Menu';


class App extends Component {
    constructor(props) {
        super(props);

        this.addCards = this.addCards.bind(this);
    }

    addCards(input) {
        this.state.consoleMethods.addCards(input);
    }

    render() {
        return <div className='App'>
            <div className='MenuContainer'>
                <Menu addCards={this.addCards}/>
            </div>
            <Console registerMethods={methods => {
                this.setState({...this.state, consoleMethods: methods})
            }}/>
            <div className='Buffer'></div>
        </div>
    }

}

export default App;
