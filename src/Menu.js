import React, { Component } from 'react';
import './Menu.css';

class Menu extends Component {
    constructor(props) {
        super(props);

        this.state = {
            helpExpanded: false
        }

        this.expandAbout = this.expandAbout.bind(this);
    }

    expandAbout() {
        this.setState({
            ...this.state,
            aboutExpanded: !this.state.aboutExpanded 
        });
    }

    render() {
        return <div className='Menu'>
            <div className='MenuTitle'>ALTA</div>
            <div className='MenuItem' >
                <p className='MenuText' onClick={this.expandAbout}>About</p>
                { this.state.aboutExpanded &&
                    <div className='AboutText'>
                        You can evaluate mathematical expressions and plot functions with alta.
                        The following builtin functions are available: 'sin', 'asin', 'cos', 'acos', 'tan',
                        atan, sqrt as well as the mathematical constants 'pi' and 'e'. You can define 
                        and plot your own functions with '&lt;name&gt;(&lt;args&gt;) = &lt;expr&gt;' and your 
                        own variables with '&lt;name&gt; = &lt;expr&gt;' 
                    </div>
                } 
            </div>
        </div>
    }

}

export default Menu;
