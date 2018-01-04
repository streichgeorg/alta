import React, { Component } from 'react';
import './Menu.css';

import { range } from './util';

class Section extends Component {
    constructor(props) {
        super(props);

        this.state = {toggled: false};

        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState({
            toggled: !this.state.toggled
        });
    }

    render() {
        return <div className='MenutItem'>
            <p className='MenuText' onClick={this.toggle}>{this.props.title}</p>
            {this.state.toggled &&
                this.props.children
            }
        </div>
    }
}

class Menu extends Component {
    render() {
        return <div className='Menu'>
            <div className='MenuTitle'>ALTA</div>
            <Section title='Examples'>
                <p className='SmallText' onClick={() => this.props.addCards(['f(x)=e^x'])}>Exponential</p>
                <p className='SmallText'
                    onClick={() =>{
                        this.props.addCards(['r=10', 'f(x) = sqrt(r^2- x^2)'])
                    }
                }>
                    Half circle
                </p>
                <p className='SmallText'
                    onClick={() =>{
                        this.props.addCards(['n=10', 'f(x) = sum(i, 0, n, ((-1)^i*x^(2*i+1))/((2*i+1)!))'])
                    }
                }>
                    Summation
                </p>
            </Section>
            <Section title='About'>
                <div className='SmallText'>
                    Use alta to evaluate and plot mathematical expressions.
                </div>
            </Section>
        </div>
    }

}

export default Menu;
