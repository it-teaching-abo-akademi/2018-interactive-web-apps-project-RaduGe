import React from "react";
import {Redirect} from "react-router"
import 'w3-css/w3.css';

class NewPortfolio extends React.Component {
  constructor(props) {
    super(props);
    // stores portfolio name and whether we're done adding and should redirect to home "page"
    this.state = {portName: '',
                  toHome: false};

    // binding functions
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  
  handleChange(event) {
    // memorising input as it changes
    this.setState({portName: event.target.value});
  }

  handleSubmit(event) {

    if (this.state.portName)
    {
      // checking input
      this.setState(() => ({
        toHome: true
      }))
    }
    else
    {
      alert("You must add a correct name or go back to Home.");
    }
    
    event.preventDefault();
  }

  render() {
    if (this.state.toHome === true)
    {
      // redirecting if we're done
      return (<Redirect to={{
                              pathname: '/',
                              state: { portName: this.state.portName }
                            }} />)
    }

    return (
      <div className="w3-card-4 w3-row-padding w3-margin">
        <div className="w3-container w3-row-padding w3-blue-gray">
            <h2>New portfolio</h2>
        </div>

        <form className="w3-container" onSubmit={this.handleSubmit}>
          <input 
            placeholder="Portfolio Name"
            onChange={this.handleChange}
            className="w3-input w3-margin-top"
            />
          <button className="w3-btn w3-block w3-medium w3-blue-gray w3-margin-top w3-margin-bottom" type="submit">Add Portfolio</button>
        </form>

      </div>
    ); 
  }
}
 
export default NewPortfolio;