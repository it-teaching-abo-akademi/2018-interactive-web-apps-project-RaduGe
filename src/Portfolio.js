import React from "react"
import ReactTable from 'react-table'
import 'react-table/react-table.css'
import ReactModal from 'react-modal'
import Graph from './Graph'
import 'w3-css/w3.css';

ReactModal.setAppElement('#root');

class Portfolio extends React.Component {

    /* this is the main class of the app
       A component that displays everything we want is defined */
    constructor(props){
        super(props);
        
        // binding click functions
        this.newStockBtn = this.newStockBtn.bind(this);
        this.addStockBtn = this.addStockBtn.bind(this);
        this.addStockSymbolChange = this.addStockSymbolChange.bind(this);
        this.addStockQuantityChange = this.addStockQuantityChange.bind(this);
        this.addStockCancel = this.addStockCancel.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.refresh = this.refresh.bind(this);
        this.showEuros = this.showEuros.bind(this);
        this.showDollars = this.showDollars.bind(this);
        this.toggleRow = this.toggleRow.bind(this);
        this.removeStocks = this.removeStocks.bind(this);
        this.perfGraph = this.perfGraph.bind(this);
        this.closeModal = this.closeModal.bind(this);

        // getting data for this portfolio from memory
        var pDataInMemory = JSON.parse(window.localStorage.getItem('portfolioData'));
        if(pDataInMemory == null)
        {
            pDataInMemory = [];
        }
        else {
            pDataInMemory = pDataInMemory[this.props.index];
            if (pDataInMemory == null)
            {
                pDataInMemory = [];
            }
        }

        this.state = {
            requested_input: false,
            name: this.props.name,
            memory_index: this.props.index,
            stock_list: pDataInMemory,
            new_symbol: '',
            new_quantity: '',
            loading: false,
            currency: '\u0024', // dollar
            currency_multiplier: 1,
            old_multiplier: 1,
            selected: {},
            needs_refresh: {},
            show_modal: false
        };
    }
    
    componentDidMount()
    {
        // updating local storage
        var oldData = JSON.parse(window.localStorage.getItem('portfolioData'));
        if (oldData == null)
        {
            oldData = [];
        }
        oldData[this.state.memory_index] = this.state.stock_list;
        window.localStorage.setItem('portfolioData', JSON.stringify(oldData));
    }

    
    async getStockPrice(symbol)
    {
        /* 
            this function gets the latest stock price for a symbol;
            it first searches the iextrading.com API because there are the most chances 
            for success there; if it doesn't find anything it searches the alphavantage api
            as well 
            it's an asynchronous function
        */
        var url = "https://api.iextrading.com/1.0/stock/";
        url = url + symbol + "/price";

        return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.json())
            .then(
                (result) => {
                    // found
                    var stock_price = result;
                    resolve(stock_price);
                }
                )
            .catch((err) => {
                // not found in the iextrading.com api, trying alphavantage

                var other_url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=";
                other_url = other_url + symbol + "&apikey=ICK74I6KCSZI8JZ1";

                fetch(other_url)
                    .then(res => res.json())
                    .then(
                        (result) => {
                            if("Note" in result)
                            {
                                // API call limit exceded, will handle this code later
                                resolve(-1);
                            }
                            else
                            {
                                if ("05. price" in result["Global Quote"])
                                {
                                    // found
                                    var stock_price = result["Global Quote"]["05. price"];
                                    resolve(stock_price);
                                }
                                else
                                {
                                    // not found for that symbol, will handle this code later
                                    resolve(-2);
                                }
                            }
                        }
                        )
            })
        });
    }

    async refresh()
    {
        /*
            this gets called when the refresh button is pressed
            it parses the symbol_list from this.state and checks the stock price
            for each symbol and updates it;
        */
        // for React Table component
        this.setState({
            loading: true
        });


        var stockList = this.state.stock_list;
        var toRefresh = this.state.needs_refresh;
        for(var i=0; i<stockList.length; i++)
        {
            toRefresh[stockList[i].stock_symbol] = true;
        }

        for (var key in toRefresh)
        {
            // parsing keys aka stock symbols
            if(toRefresh[key] === true)
            {
                // finding the index of the current key in the main array
                const index = stockList.findIndex(object => object.stock_symbol === key);
                // API Calls -> awaiting for them to be finished
                // i'm updating sequentially because it doesn't take long
                // parallel updates could also be done but i didn't see the necessity

                const value = await this.getStockPrice(key);

                if(value >= 0)
                {
                    stockList[index].unit_value = value;
                    stockList[index].total_value = value * stockList[index].stock_quantity;
                    toRefresh[key] = false;
                }
                else
                {
                    // this shouldn't happen with the iextrading.com API
                    alert("Not everything could be refreshed because of API call limits.");
                }
            }
        }

        // setting state
        this.setState({
            stock_list: stockList,
            needs_refresh: toRefresh,
            loading: false
        })

        // updating localStorage
        var oldData = JSON.parse(window.localStorage.getItem('portfolioData'));
        if (oldData == null)
        {
            oldData = [];
        }
        oldData[this.state.memory_index] = this.state.stock_list;
        window.localStorage.setItem('portfolioData', JSON.stringify(oldData));
    }

    toggleRow(symbol) {
        // this gets called when the user selects a stock from the table
        var oldSelected = this.state.selected;
        oldSelected[symbol] = !this.state.selected[symbol];

        // memorising in state
        this.setState({
            selected: oldSelected
        });
    }

    removeStocks() {
        // the remove selected button triggers this
        
        var list = this.state.stock_list;
        var selectionList = this.state.selected;

        var toRemove = [];

        // removing 
        for(var i=0; i<list.length; i++)
        {
            if(selectionList[list[i].stock_symbol] === true)
            {
                toRemove.push(i);
                selectionList[list[i].stock_symbol] = false;
            }
        }

        for(i=toRemove.length-1; i>=0; i--)
        {
            list.splice(toRemove[i], 1);
        }

        // updating state and local storage

        this.setState({
            stock_list: list,
            selected: selectionList
        });

        var oldData = JSON.parse(window.localStorage.getItem('portfolioData'));
        if (oldData == null)
        {
            oldData = [];
        }
        oldData[this.state.memory_index] = this.state.stock_list;
        window.localStorage.setItem('portfolioData', JSON.stringify(oldData));
    }

    showDollars() {
        // changing state for conditional rendering

        // encoded as \u0024
        
        if (this.state.currency !== '\u0024')
        {
            this.setState({
                currency: '\u0024',
                currency_multiplier: 1.0
            });
        }
    }

    showEuros() {

        // encoded as\u20AC
        
        // will try to obtain latest exchange rate
        // if there's a successfull api call a previous exchange rate state item is updated as well
        // it will be used later in case the api call limit is exceded or some server error

        if (this.state.currency !== '\u20AC')
        {
            var url = "http://data.fixer.io/api/latest?access_key=710c0551ec72322ca6cf7caead8f6dd8";

            fetch(url)
                .then(res => res.json())
                .then(
                    (result) => {
                        if(result.success === true)
                        {
                            this.setState({
                                currency: '\u20AC',
                                currency_multiplier: result.rates.USD,
                                old_multiplier: result.rates.USD
                            })
                        }
                        else
                        {
                            // checking if there was a successful call in the past
                            if(this.state.old_multiplier === 1)
                            {
                                alert("API error. Most likely free limit reached. Couldn't complete operation.");
                            }
                            else
                            {
                                alert("API error. Most likely free limit reached. Using old converter.");
                                this.setState({
                                    currency: '\u20AC',
                                    currency_multiplier: this.state.old_multiplier
                                })
                            }
                            
                        }
                    }
                )
        }
    }
    newStockBtn() {
        // for conditional rendering
        // showing new stock input form
        this.setState({
            requested_input: true
        });
    }

    async addStockBtn() {

        // checking input
        if(this.state.new_symbol && this.state.new_quantity)
        {
            // converting string to number then checking if it's an integer
            if(Number.isInteger(+this.state.new_quantity))
            {
                if(this.state.stock_list.length === 50)
                {
                    // symbol limit reached
                    alert("Maximum number of different stocks is 50");
                }
                else
                {
                    if(this.state.stock_list.some(e => e.stock_symbol === this.state.new_symbol))
                    {
                        // symbols must be different
                        alert("Stocks must be different");
                    }
                    else
                    {
                        // API Call
                        const value = await this.getStockPrice(this.state.new_symbol);
                        if(value >= 0)
                        {
                            // everything ok, adding to state and local storage
                            var newList = this.state.stock_list;
                            newList.push({
                                stock_symbol: this.state.new_symbol.toUpperCase(),
                                stock_quantity: this.state.new_quantity,
                                unit_value: value,
                                total_value: value * this.state.new_quantity,
                            });

                            this.setState({
                                stock_list: newList,
                                requested_input: false
                            });

                            var oldData = JSON.parse(window.localStorage.getItem('portfolioData'));
                            if (oldData == null)
                            {
                                oldData = [];
                            }
                            oldData[this.state.memory_index] = this.state.stock_list;
                            window.localStorage.setItem('portfolioData', JSON.stringify(oldData));
                        }
                        else if(value === -1)
                        {
                            // API limit
                            alert("API Calls exceded. Wait for a minute.");
                        }
                        else if(value === -2)
                        {
                            // invalid stock symbol
                            alert("Nothing found with that symbol.");
                        }
                    }
                }
            }
            else
            {
                alert("That quantity is not an integer/number.");
            }
        }
        else
        {
            alert("Empty values not allowed.");
        }
        
    }
    addStockCancel() {
        // cancel pressed
        this.setState({
            requested_input: false
        });
    }
    addStockSymbolChange(event) {
        this.setState({
            new_symbol: event.target.value
        });
    }
    
    addStockQuantityChange(event) {
        this.setState({
            new_quantity: event.target.value
        });
    }
    
    deleteItem(){
        // calling function from parent
        this.props.deletePortfolio(this.props.name);
    }

    objectMap(object, mapFn) {
        return Object.keys(object).reduce(function(result, key) {
            result[key] = mapFn(object[key])
            return result
        }, {})
    }

    perfGraph()
    {
        // for conditional rendering
        this.setState({
            show_modal: true
        });
    }

    closeModal()
    {
        // for conditional rendering
        this.setState({
            show_modal: false
        });
    }

    output() {
        // this function is just for readability
        // could have added this code in render as well
        if(this.state.requested_input)
        {
            // showing new stock "form"
            return <div className="w3-row-padding w3-card-2 w3-margin w3-blue-gray">
                   
                    <div className="w3-row-padding w3-margin-top">
                        <h3>{this.state.name}</h3>
                    </div>

                    <div className="w3-row-padding w3-margin-top">
                        <div>
                            <input
                                placeholder="Stock symbol"
                                onChange={this.addStockSymbolChange}
                                className="w3-input"
                            />
                            <input
                                placeholder="Quantity"
                                onChange={this.addStockQuantityChange}
                                className="w3-input"
                            />
                        </div>
                        <div className="w3-row-padding w3-margin-top w3-margin-bottom">
                            <button 
                                onClick={this.addStockCancel}
                                className="w3-button w3-half w3-round w3-medium w3-blue-grey">
                                Cancel
                            </button>
                            <button 
                                onClick={this.addStockBtn}
                                className="w3-button w3-half w3-round w3-medium w3-blue-grey">
                                Submit
                            </button>
                        </div>
                        
                    </div>
                </div>;
        } else 
        {
            // showing data table
                const columns = [
                {
                    Header: 'Stock Name',
                    accessor: 'stock_symbol' 
                },
                {
                    Header: 'Unit value (' + this.state.currency + ')',
                    accessor: 'unit_value',
                }, 
                {
                    Header: 'Quantity',
                    accessor: 'stock_quantity',
                },
                {
                    Header: 'Total Value (' + this.state.currency + ')',
                    accessor: 'total_value',
                },
                {
                    Header: 'Select',
                    accessor: 'selected',
                    Cell: ({original}) => {
                        return (
                            <input
                                type="checkbox"
                                className="w3-check w3-right"
                                checked={this.state.selected[original.stock_symbol] === true}
                                onChange={() => this.toggleRow(original.stock_symbol)}
                            />
                        );
                    },
                    sortable: false
                }];
            
                var data = [];
                for(var i=0; i<this.state.stock_list.length; i++)
                {
                    data.push({
                        stock_symbol: this.state.stock_list[i].stock_symbol,
                        unit_value: (this.state.stock_list[i].unit_value / this.state.currency_multiplier).toFixed(3),
                        stock_quantity: this.state.stock_list[i].stock_quantity,
                        total_value: (this.state.stock_list[i].total_value / this.state.currency_multiplier).toFixed(3)
                    });
                }

                return <div className="w3-row-padding w3-card-2 w3-margin w3-container">
                        <div className="w3-row-padding w3-container">

                            <div className="w3-half w3-mobile w3-margin-top">
                                <h3>
                                {this.state.name}
                                </h3>
                            </div>

                            <div className="w3-row-padding w3-mobile w3-margin-top w3-bar">
                                <button className="w3-bar-item w3-mobile w3-button w3-round w3-small" 
                                        onClick={this.showEuros}>
                                        Show in Euros
                                </button>

                                <button className="w3-bar-item w3-mobile w3-button w3-round w3-small"
                                        onClick={this.showDollars}>
                                        Show in Dollars
                                </button>

                                <button className="w3-bar-item w3-mobile w3-button w3-round w3-small" 
                                        onClick={this.refresh}>
                                        Refresh
                                </button>

                                <button className="w3-bar-item w3-mobile w3-button w3-round w3-small w3-right w3-dark-grey"
                                        onClick={this.deleteItem}>
                                        Delete
                                </button>
                            </div>
                        </div>

                        <div className="w3-row-padding w3-margin w3-card">
                            <ReactTable
                                data={data}
                                columns={columns}
                                resolveData={data => data.map(row => row)}
                                showPagination={false}
                                loading={this.state.loading}
                                style={{
                                    height: "250px" // their documentation says that this is how vertical scroll is enabled
                                                    // otherwise have to use default pagination - which isn't nice for this case
                                }}
                                className="-striped -highlight"
                                defaultPageSize={this.state.stock_list.length}
                                noDataText={''}
                                resizable={false}
                            />
                        </div>

                        <div className="w3-row-padding w3-half w3-margin-top">
                            <h4>
                            Total value of portfolio: {(this.state.stock_list.map(o=>o.total_value).reduce((a,c)=>a+c, 0) / this.state.currency_multiplier).toFixed(3)} {this.state.currency}
                            </h4>
                        </div>

                        
                            <div className="w3-row-padding w3-mobile w3-margin-top w3-bar w3-margin-bottom">
                                <button 
                                    onClick={this.newStockBtn}
                                    className="w3-bar-item w3-mobile w3-button w3-round w3-small w3-blue-grey w3-margin-left w3-margin-top">
                                    Add Stock
                                </button>
                                <button 
                                    onClick={this.perfGraph}
                                    className="w3-bar-item w3-mobile w3-button w3-round w3-small w3-blue-grey w3-margin-top w3-margin-left">
                                Performance Graph
                                </button>
                                <button 
                                    onClick={this.removeStocks}
                                    className="w3-bar-item w3-mobile w3-button w3-round w3-small w3-right w3-dark-grey w3-margin-top">
                                Remove Selected
                                </button>
                            </div>
                        
                    </div>;
        }
    }
    render() {
        return (
            // ReactModal triggers a modal window that shows performance graph data
            <li>
                <div >
                    {this.output()}
                </div>
            

                <div className="w3-row-padding">
                    <ReactModal
                        isOpen={this.state.show_modal}
                    >
                        <div className="w3-row-padding">
                            <div className="w3-right">
                                <button 
                                onClick={this.closeModal}
                                className="w3-button w3-mobile w3-round w3-small w3-right w3-dark-grey"
                                >
                                Close
                            </button>
                            </div>
                        </div>
                        
                        <div className="w3-row-padding">
                            <Graph
                                pName={this.state.name}
                                sList={this.state.stock_list}
                            >
                            </Graph>
                        </div>
                        

                    </ReactModal>
                </div>
            </li>
        );
    }
}


export default Portfolio;

