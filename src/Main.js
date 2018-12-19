import React from "react";
import {
  Route,
  NavLink,
  HashRouter
} from "react-router-dom";

import Home from "./Home";
import NewPortfolio from "./NewPortfolio";
import 'w3-css/w3.css';

class Main extends React.Component {
  render() {
    return (
        /* creating navigation routes */
        /* the home page displays the portfolio list and data and there's another 
           route to add a new portfolio */
        /* router is not really necessary for this app */
        <HashRouter>
        <div>
          <ul className="w3-bar w3-blue-gray w3-row-padding">
            <li className="w3-bar-item w3-button w3-mobile"><NavLink exact to="/">Home</NavLink></li>
            <li className="w3-bar-item w3-button w3-mobile"><NavLink to="/new">Add a portfolio</NavLink></li>
          </ul>
          <div className="content w3-bar">
            <Route exact path="/" component={Home}/>
            <Route path="/new" component={NewPortfolio}/>
          </div>
        </div>
        </HashRouter>
    );
  }
}
 
export default Main;