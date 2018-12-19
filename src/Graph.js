import React from "react";
import Checkbox from "./Checkbox.js"
import DatePicker from "react-datepicker";
import {
    Charts,
    ChartContainer,
    ChartRow,
    YAxis,
    LineChart,
    Resizable,
    styler,
    Legend
} from "react-timeseries-charts";
import { TimeRange, TimeSeries } from "pondjs";
import "react-datepicker/dist/react-datepicker.css";
import 'w3-css/w3.css';
import ReactLoading from 'react-loading';


class Graph extends React.Component {
    // this component defines the whole content in the modal window
    // not just the Graph..
    constructor(props) {
        super(props);

        // binding functions
        this.handleCheck = this.handleCheck.bind(this);
        this.handleStartDateChange = this.handleStartDateChange.bind(this);
        this.handleEndDateChange = this.handleEndDateChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this);

        this.state ={
            name: this.props.pName,
            list: this.props.sList.map(obj => obj.stock_symbol),
            checkedItems: {},
            startDate: new Date(),
            endDate: new Date(),
            data: {
                symbol: '',
                values: [],
            },
            dataLoaded: false,
            styles: [],
            categories: []
        };
    }

    handleCheck(e) {
        // if stock is checked adding to array
        const item = e.target.name;

        var oldSelected = this.state.checkedItems;
        oldSelected[item] = !this.state.checkedItems[item];

        this.setState({
            checkedItems: oldSelected
        });
    }

    handleStartDateChange(date) {
        // modifying state when date is modified
        // the last two items are needed for the Graph library
        this.setState({
            startDate: date,
            originalRange: new TimeRange([date.getTime(), this.state.endDate.getTime()]),
            tRange: new TimeRange([date.getTime(), this.state.endDate.getTime()])
        });
    }

    handleEndDateChange(date) {
        this.setState({
            endDate: date,
            originalRange: new TimeRange([this.state.startDate.getTime(), date.getTime()]),
            tRange: new TimeRange([this.state.startDate.getTime(), date.getTime()])
        });

    }

    handleTimeRangeChange = timerange => {
        this.setState({
            tRange: timerange
         });
    };

    async handleClick() {
        // API Call to get historical data for the stocks
        var stockList = [];
        var data = [];

        for (var key in this.state.checkedItems)
        {
            // determining what we have to search for
            if(this.state.checkedItems[key] === true)
            {
                stockList.push(key);
            }
        }

        // validating input
        if(stockList.length === 0)
        {
            alert("Please select at least a stock");
        }
        else
        {
            /* 
                determining the apropriate API Call
                I want to obtain a reasonable number of data points for the graph
            */
            var timeDiff = this.state.endDate - this.state.startDate;
            var url = "https://www.alphavantage.co/query?function=";

            if(timeDiff / 1000 / 60 / 60 <= 24)
            {
                // fewer than 24 hrs => every minute
                url = url + "TIME_SERIES_INTRADAY&interval=1min&outputsize=full&apikey=ICK74I6KCSZI8JZ1&symbol=";
            }
            else if(timeDiff / 1000 / 60 / 60 / 24 < 50)
            {
                // 1 - 50 days => hourly data
                url = url + "TIME_SERIES_INTRADAY&interval=60min&outputsize=full&apikey=ICK74I6KCSZI8JZ1&symbol=";
            }
            else
            {
                // > 50 days => daily data
                url = url + "TIME_SERIES_DAILY&outputsize=full&apikey=ICK74I6KCSZI8JZ1&symbol=";
            }

            if(timeDiff <= 0)
            {
                alert("That time period isn't valid");
            }
            else
            {
                for(var i=0; i<stockList.length; i++)
                {
                    // parsing symbol list and making API Calls

                    const result = await this.getHistoricalData(stockList[i], url);
                    var val = [];
                    
                    // since the DAILY API call returns all historical data, I have to
                    // cut what isn't in the specified time period
                    if (result === -1)
                    {
                        alert("Please try again. Data for " + stockList[i] + " could not be found. API Call limit might be exceded.");
                    }
                    else
                    {
                        for (var k in result)
                        {
                            var d = new Date(k);
                            if(d - this.state.startDate >=0 && this.state.endDate - d >= 0)
                            {
                                val.push([d.getTime(), Number(result[k][Object.keys(result[k])[0]])]);
                            }
                        }
                        
                        // this formatting is necessary for the TimeSeries part of the Graph
                        data.push({
                            name: stockList[i],
                            columns: ["time", stockList[i]],
                            points: val.reverse()
                        });
                    }
                    
                }

                // styles - for line color
                // categories - for legend

                var styles = [];
                var categories = [];
                for(var j = 0; j<data.length; j++)
                {
                    styles.push({
                        key: data[j].name,
                        width: 2,
                        color: this.getRandomColor()
                    });

                    categories.push({
                        key: data[j].name,
                        label: data[j].name
                    })
                }

                this.setState({
                    data: data,
                    dataLoaded: true,
                    styles: styles,
                    categories: categories
                });
            }
        }
    }

    async getHistoricalData(symbol, url)
    {
        // function for the api call

        var hUrl = url + symbol;

        return new Promise((resolve, reject) => {
        fetch(hUrl)
            .then(res => res.json())
            .then(
                (result) => {
                    if("Note" in result)
                    {
                        resolve(-1);
                    }
                    else
                    {
                        resolve(result[Object.keys(result)[1]]);
                    }
                }
                )
        });
    }

    getRandomColor() {
        // for styling - line color
        // found on stackoverflow
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    render() {
        const isLoaded = this.state.dataLoaded;
        const style = styler(this.state.styles);
        const categ = this.state.categories;
        let charts = [];
        let legend;
        let chart;

        if(isLoaded)
        {
            const dataArr = this.state.data;
            // max and min are for the Y axis value limit
            var max = 0;
            var min = 10000;


            for(var i=0; i<dataArr.length; i++)
            {
                const series = new TimeSeries(dataArr[i]);

                if(series.min(dataArr[i].name) < min)
                {
                    min = series.min(dataArr[i].name);
                }
                if(series.max(dataArr[i].name) > max)
                {
                    max = series.max(dataArr[i].name);
                }

                charts.push(
                    <LineChart
                        key={dataArr[i]}
                        axis="y"
                        interpolation="curveLinear"
                        series={series}
                        columns={dataArr[i]}
                        style={style}
                    />
                );
            }

            const timeRange = this.state.tRange;

            chart =  <Resizable>
            <ChartContainer timeRange={timeRange}
                            enablePanZoom={true}
                            onTimeRangeChanged={this.handleTimeRangeChange}
                            maxTime={this.state.originalRange.end()}
                            minTime={this.state.originalRange.begin()} >
            <ChartRow height="300">
            <YAxis id="y" width={50} label="Price ($)" min={min} max={max} type="linear" format=".2f"/>
              <Charts>
                {charts}
              </Charts>
            </ChartRow>
          </ChartContainer>
          </Resizable>;

          
          legend = <Legend
                type="line"
                align="right"
                style={style}
                categories={categ}
            />;
        }
        else
        {
            // showing a loading component and a prompt to search for data
            chart = <div>
                        <h4 className="w3-margin">Press the button.</h4>
                        <ReactLoading type={"bars"} color={'#687681'} height={'30%'} width={'30%'} />
                    </div>;
        }

        return (
            <div className="w3-row-padding ">
                <div className="w3-left w3-mobile w3-quarter">
                    <h3 className="w3-row-padding">
                        {this.state.name} Performance
                    </h3>

                    <ul className="w3-ul">
                        {this.state.list.map(item => (
                            <li>
                                <label key={item}>
                                    <span>
                                        {item}
                                    </span>
                                    <Checkbox name={item} 
                                            checked={this.state.checkedItems[item]} 
                                            onChange={this.handleCheck} 
                                            className="w3-check" />
                                </label>
                            </li>
                            
                        ))
                        }
                    </ul>
                    
                </div>

                <div className="w3-rest w3-mobile w3-margin-top w3-margin-bottom w3-margin-right">
                    <div className="w3-margin">
                        {chart}
                    </div>
                    <div>
                        {legend}
                    </div>

                    <div className=" w3-margin w3-mobile">
                        <span className="w3-margin-left w3-mobile">
                            <DatePicker
                                selected={this.state.startDate}
                                onChange={this.handleStartDateChange}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy h:mm"
                                timeCaption="time"
                            />
                        </span>
                        <span className="w3-margin-left w3-mobile">
                            <DatePicker
                                selected={this.state.endDate}
                                onChange={this.handleEndDateChange}
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                dateFormat="dd/MM/yyyy h:mm"
                                timeCaption="time"
                            />
                        </span>
                        <button 
                            onClick={this.handleClick}
                            className="w3-button w3-round w3-small w3-dark-grey w3-margin-left w3-mobile">
                            Go
                        </button>
                    </div>
                </div>
            </div>
        )
    }
  }
   
  export default Graph;