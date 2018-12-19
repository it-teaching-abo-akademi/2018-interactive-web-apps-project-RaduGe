import React from "react";
import Portfolio from "./Portfolio"
import 'w3-css/w3.css';

class Home extends React.Component {
  constructor(props) {
    super(props);

    /* binding click functions */
    this.deletePortfolio = this.deletePortfolio.bind(this);

    // pList is an array of Portfolio names
    // each array is a dictionary of the symbol and quantity of that portfolio

    // getting data from localStorage
    var pListInMemory = JSON.parse(window.localStorage.getItem('portfolioNames'));
    if (pListInMemory == null)
    {
      // if nothing saved yet
      pListInMemory = [];
    }
    
    // setting state from memory
    this.state = {
      pList: pListInMemory
    }

    // checking if it should add another portfolio
    if(this.props.location.state !== undefined)
    {
      // this triggers when there's a successful redirect from the New Portfolio "page"

      var oldList = this.state.pList;
     
      // max 10 portfolio requirement
      if (oldList.length === 10)
      {
        alert ("Maximum number of portfolios (10) already reached.");
      }
      else
      {
        // adding to list
        oldList.push(this.props.location.state.portName);

        // setting state
        this.state = {
            pList: oldList
        }
      }
    }

  }

  componentDidMount() {
      // updating local storage
      window.localStorage.setItem('portfolioNames', JSON.stringify(this.state.pList));
  }

  deletePortfolio(name) {
      /* gets data from state, deletes what's needed and updates the state and 
         the local storage */

      var new_pList = this.state.pList;
      var index = new_pList.indexOf(name);
      new_pList.splice(index, 1);
      this.setState({pList: new_pList});

      var old_dataList = JSON.parse(window.localStorage.getItem('portfolioData'));
      old_dataList.splice(index, 1);

      window.localStorage.setItem('portfolioNames', JSON.stringify(this.state.pList));
      window.localStorage.setItem('portfolioData', JSON.stringify(old_dataList));
  }

  render() {
    return (
      // returning a list of portfolios
      // we pass as props the portfolio name and the index it has
      // in the local storage array in order to save data for it later
      <div>
          <ul className="w3-ul">
              {this.state.pList.map((portfolio, index) =>
              <Portfolio key = {portfolio}
                         name = {portfolio}
                         index = {index}
                         deletePortfolio = {this.deletePortfolio} />)}
          </ul>
      </div>
    );
  }
}
 
export default Home;