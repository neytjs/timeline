import React, {Component} from 'react';
import Select from 'react-select';
import Utilities from './js/utilities.js';
import Chart from 'chart.js';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
const remote = window.require('electron').remote;

class Analysis extends Component {
  constructor(props) {
    super(props);
    this.pressEnter = this.pressEnter.bind(this);
    this.analysisLineChar = React.createRef();

    this.state = {
      backgroundColors: ['#ff6666', '#00cc00', '#4d4dff', '#ffff00', '#a64dff', '#ffa366', '#ff80b3', '#00ffbf', '#88cc00', '#e6004c', '#c2c2a3', '#d2a679', '#ffdb4d', '#ff80ff', '#cccccc', '#4dff88', '#ff531a', '#ff0000'],
      borderColors: ['#ff0000', '#006600', '#0000cc', '#e6e600', '#6600cc', '#ff6600', '#ff0066', '#00b386', '#669900', '#990033', '#999966', '#996633', '#e6b800', '#ff00ff', '#999999', '#00cc44', '#cc3300', '#b30000'],
      entries: [],
      date_start: remote.getGlobal('analysis').date_start,
      date_end: remote.getGlobal('analysis').date_end,
      tag: remote.getGlobal('analysis').tag,
      all_tags: this.props.all_tags
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.pressEnter, false);

    this.props.entries_shortterm.find({}, function(err, entries) {

      if (entries.length > 0) {

        entries = entries.sort(function(a, b) {

            if (a.entered > b.entered) {
              return -1;
            }
            if (b.entered > a.entered) {
              return 1;
            }
        });

        this.setState({entries: entries}, function() {

          if (remote.getGlobal('analysis').analyzed === true) {
            this.conductAnalysis();
          }
        });
      }
    }.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.pressEnter, false);
  }

  pressEnter(event) {
    if (event.keyCode === 13) {
      this.conductAnalysis();
    }
  }

  conductAnalysis() {

    remote.getGlobal('analysis').analyzed = true;
    let state = Object.assign({}, this.state);
    let start = new Date(state.date_start);
    let end = new Date(state.date_end);

    let test_start = start.getTime();
    let test_end = end.getTime();
    if (test_start > test_end) {

      start = new Date(test_end);
      end = new Date(test_start);
    }

    if (state.entries.length > 1) {

      if (start.setHours(0, 0, 0, 0) !== end.setHours(0, 0, 0, 0)) {
        let max = 60;

        let results = [];

        let date_start = start.setHours(0, 0, 0, 0);
        let date_end = end.setHours(0, 0, 0, 0);

        for (var i = 0, length = this.state.entries.length; i < length; i++) {
          if (this.state.entries[i].date >= date_start && this.state.entries[i].date <= date_end) {
            results.push(this.state.entries[i]);
          }
        }

        let distance_label = "";
        end.setMonth((end.getMonth() + 1), 1);
        let distance = end.getMonth() - start.getMonth() + (12 * (end.getFullYear() - start.getFullYear()));
        let distance_ms = date_end - date_start;
        let day_ms = 1000 * 60 * 60 * 24;
        let week_ms = 1000 * 60 * 60 * 24 * 7;

        if (distance >= max) {
          distance_label = "years";
          distance = end.getFullYear() - start.getFullYear();
        } else if (distance < max && distance_ms > (week_ms * max)) {
          distance_label = "months";
        } else {
          if (distance_ms <= (1000 * 60 * 60 * 24 * max)) {
            distance_label = "days";

            distance = Math.ceil(distance_ms / day_ms);
          } else {
            distance_label = "weeks";

            distance = Math.ceil(distance_ms / week_ms);
          }
        }


        let months_years = [];


        function dateFixer(date) {
          let hour = date.getHours();
          if (hour === 1) {
            date.setHours(0, 0, 0, 0);
          } else if (hour === 23) {
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 1);
          }
          return new Date(date);
        }

        if (distance_label === "months") {
          for (var i = 0; i < (distance + 1); i++) {
            if (i === 0) {
              months_years.push(new Date(start));
            } else if (i > 0 && i === distance) {
              let next_day = new Date(date_end);
              next_day.setDate(next_day.getDate() + 1);
              months_years.push(next_day);
            } else {
              months_years.push(new Date(start.setMonth(start.getMonth() + 1, 1)));
            }
          }
        } else if (distance_label === "years") {
          for (var i = start.getFullYear(); i <= (end.getFullYear() + 1); i++) {
            if (i === start.getFullYear()) {
              months_years.push(new Date(start));
            } else if (i > 0 && i === (end.getFullYear() + 1)) {
              let next_day = new Date(date_end);
              next_day.setDate(next_day.getDate() + 1);
              months_years.push(next_day);
            } else {
              months_years.push(new Date('January 1, ' + i + ' 00:00:00'));
            }
          }
        } else if (distance_label === "days") {

          let next_day = start.getTime();

          for (var i = 0; i < (distance + 2); i++) {
            if (i === 0) {
              months_years.push(dateFixer(new Date(start)));
            } else if (i > 0) {
              next_day = next_day + day_ms;
              months_years.push(dateFixer(new Date(next_day)));
            }
          }
        } else if (distance_label === "weeks") {
          let next_week = start.getTime();

          for (var i = 0; i < (distance + 2); i++) {
            if (i === 0) {
              months_years.push(dateFixer(new Date(start)));
            } else if (i > 0 && i <= distance && ((next_week + week_ms) <= date_end)) {
              next_week = next_week + week_ms;
              months_years.push(dateFixer(new Date(next_week)));
            } else if (i === (distance + 1)) {
              let final_week = new Date(date_end);
              final_week.setDate(final_week.getDate() + 1);
              months_years.push(dateFixer(new Date(final_week)));
            }
          }
        }


        let search_tag = [];
        if (state.tag !== null) {
          for (var i = 0, length = state.tag.length; i < length; i++) {
            search_tag.push(state.tag[i].value);
          }
        }


        let unit_averages = [];

        if (search_tag.length > 0) {

          for (var t = 0, tlength = search_tag.length; t <tlength; t++) {
            unit_averages.push({ label: search_tag[t], data: [] });
          }
          for (var i = 0, length = (months_years.length - 1); i < length; i++) {
            for (var j = 0, jlength = unit_averages.length; j < jlength; j++) {
              if (i === 0) {
                unit_averages[j].data.push({ range_start: months_years[0], range_end: months_years[1], entry_ranks: [] });
              } else if (i > 0) {
                unit_averages[j].data.push({ range_start: months_years[i], range_end: months_years[i + 1], entry_ranks: [] });
              }
            }
          }
        } else {

          unit_averages.push({ label: "all entries", data: [] });
          for (var i = 0, length = (months_years.length - 1); i < length; i++) {
            if (i === 0) {
              unit_averages[0].data.push({ range_start: months_years[0], range_end: months_years[1], entry_ranks: [] });
            } else if (i > 0) {
              unit_averages[0].data.push({ range_start: months_years[i], range_end: months_years[i + 1], entry_ranks: [] });
            }
          }
        }

        let tag_matches = 0;
        let tag_searching = false;

        for (var i = 0, length = results.length; i < length; i++) {
          for (var j = 0, jlength = unit_averages.length; j < jlength; j++) {

            if (search_tag.length > 0) {
              tag_searching = true;
              for (var k = 0, klength = results[i].tags.length; k < klength; k++) {
                for (var s = 0, slength = search_tag.length; s < slength; s++) {
                  if (results[i].tags[k].toLowerCase() === search_tag[s].toLowerCase()) {

                    for (var l = 0, llength = unit_averages[j].data.length; l < llength; l++) {

                      if (search_tag[s] === unit_averages[j].label && results[i].date >= unit_averages[j].data[l].range_start && results[i].date < unit_averages[j].data[l].range_end) {
                        unit_averages[j].data[l].entry_ranks.push(parseInt(results[i].rank));
                        tag_matches = tag_matches + 1;
                      }
                    }
                  }
                }
              }
            } else {

              for (var l = 0, llength = unit_averages[j].data.length; l < llength; l++) {
                if (results[i].date >= unit_averages[j].data[l].range_start && results[i].date < unit_averages[j].data[l].range_end) {
                  unit_averages[j].data[l].entry_ranks.push(parseInt(results[i].rank));
                }
              }
            }
          }
        }

        function creatXY(unit_averages) {
          let units = [];

          for (var i = 0, length = unit_averages.length; i < length; i++) {
            units.push({ label: unit_averages[i].label, data: [] });
          }

          for (var i = 0, length = unit_averages.length; i < length; i++) {
            for (var j = 0, jlength = unit_averages[i].data.length; j < jlength; j++) {
              for (var k = 0, klength = units.length; k < klength; k++) {

                if (unit_averages[i].label === units[k].label) {

                  if (unit_averages[i].data[j].entry_ranks.length > 0) {
                    units[k].data.push({ x: (distance_label === "years" ? parseInt(new Date(unit_averages[i].data[j].range_start).toLocaleDateString("en-US", {year: "numeric"})) : new Date(unit_averages[i].data[j].range_start)), y: ((unit_averages[i].data[j].entry_ranks.reduce((a, b) => a + b, 0))), range_end: unit_averages[i].data[j].range_end });
                  }
                }
              }
            }
          }

          return units;
        }


        let x_y_data = creatXY(unit_averages);


        var colors = Utilities.doubleShuffler(this.state.backgroundColors, this.state.borderColors);


        function generateChartData() {
          var data = [];
          for (var i = 0, length = x_y_data.length; i < length; i++) {
            data.push({
              label: x_y_data[i].label,
              data: x_y_data[i].data,
              backgroundColor: colors.first_array[i],
              borderColor: colors.second_array[i],
              borderWidth: 3,
              pointBackgroundColor: colors.first_array[i],
              pointBorderColor: colors.second_array[i],
              pointBorderWidth: 1,
              fill: false,
              tension: 0,
              showLine: true
            });
          }
          return data;
        }


        var data = generateChartData();


        end.setMonth((end.getMonth() - 1), 1);


        let options = {};
        if (distance_label === "days") {
          options = {year: "numeric", month: "long", day: "numeric"};
        } else if (distance_label === "weeks") {
          options = {year: "numeric", month: "long", day: "numeric"};
        } else if (distance_label === "months") {
          options = {year: "numeric", month: "long"};
        } else {
          options = {year: "numeric"};
        }



        var ctx = this.analysisLineChar;

        if (window.myLineChart && window.myLineChart !== null) {
          window.myLineChart.destroy();
        }


        function genChartTitle() {
          let title = "Event importance";

          if (search_tag.length > 0) {
            let tag = "";
            if (search_tag.length === 1) {
              tag = search_tag[0];
            } else {
              tag += "[";
              for (var i = 0, length = search_tag.length; i < length; i++) {
                if (i !== (length - 1)) {
                  tag += search_tag[i] + ", ";
                } else {
                  tag += search_tag[i];
                }
              }
              tag += "]";
            }
            title += " for entries tagged in " + tag;
          } else {
            title += " for all entries";
          }

          title += ", between " + new Date(date_start).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"}) + " and " + new Date(date_end).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"}) + ".";

          return title;
        }

        let points = 0;
        for (var i = 0, length = x_y_data.length; i < length; i++) {
          points = points + x_y_data[i].data.length;
        }
        let labels = [];

        if (distance_label === "years") {
          start = new Date(start).toLocaleDateString("en-US", {year: "numeric"});
          end = new Date(end).toLocaleDateString("en-US", {year: "numeric"});
          for (var start_year = parseInt(start), end_year = parseInt(end); start_year <= end_year; start_year++) {
            labels.push(start_year);
          }
        }


        if ((tag_searching === true && tag_matches > 0) || tag_searching === false) {

          if (points > 0) {

            window.myLineChart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: (distance_label === "years" ? labels : [start, end]),
                datasets: data
              },
              options: {
                scales: {
                    xAxes: [{
                        type: (distance_label === "years" ? 'category' : 'time'),
                        time: {
                            displayFormats: {
                                month: (distance_label === "years" ? 'YYYY' : 'MMM YYYY'),
                                year: 'YYYY'
                            }
                        }
                    }],
                    yAxes: [{
                      ticks: {
                        precision: 0,
                        beginAtZero: true
                      }
                    }],
                    responsive: false,
                    maintainAspectRatio: false
                },

                title: {
        					display: true,
        					text: genChartTitle()
                },
                tooltips: {
                  callbacks: {
                    title: function(tooltipItem, data) {
                      if (distance_label === "weeks") {

                        let range_end_label = new Date(x_y_data[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].range_end);
                        range_end_label.setDate(range_end_label.getDate() - 1);

                        return new Date(tooltipItem[0].label).toLocaleDateString("en-US", options) + ' – ' + range_end_label.toLocaleDateString("en-US", options);
                      } else if (distance_label === "years") {
                        return x_y_data[tooltipItem[0].datasetIndex].data[tooltipItem[0].index].x;
                      } else {
                        return new Date(tooltipItem[0].label).toLocaleDateString("en-US", options);
                      }
                    },
                    label: function(tooltipItem, data) {

                      return data.datasets[tooltipItem.datasetIndex].label + ': ' + tooltipItem.value;
                    }
                  }
                }
              }
            });

            window.scrollTo(0, document.body.scrollHeight);
          } else {
            alert("No entries were found during this time period. Try expanding your search.");
          }
        } else {
          alert("No matching tags found to analyze. Try removing the tag that you entered or enter a different tag.");
        }
      } else {
        alert("You must select a timeframe of at least one day to conduct analysis.");
      }
    } else {
      alert("You must enter at least two entries to begin conducting analysis.");
    }
  }

  handle_date_start_Change(date) {
    this.setState({ date_start: date }, function() {
      remote.getGlobal('analysis').date_start = this.state.date_start;
    });
  }

  handle_date_end_Change(date) {
    this.setState({ date_end: date }, function() {
      remote.getGlobal('analysis').date_end = this.state.date_end;
    });
  }

  resetForm() {
    this.setState({date_start: new Date(), date_end: new Date(), tag: null});

    remote.getGlobal('analysis').date_start = new Date();
    remote.getGlobal('analysis').date_end = new Date();
    remote.getGlobal('analysis').tag = null;
    remote.getGlobal('analysis').analyzed = false;

    window.myLineChart.destroy();
  }

  render() {
    const { tag, all_tags, date_start, date_end } = this.state;
    return (
      <div>
        <div className="theader">
          <h3>Analyze entry data:</h3>
          Select a date range: <DatePicker selected={date_start} onChange={this.handle_date_start_Change.bind(this)} /> to <DatePicker selected={date_end} onChange={this.handle_date_end_Change.bind(this)} />
          <br/><br/>
          <Select
            styles={Utilities.reactSelectStyles(this.props.cssTemplate)}
            value={tag}
            onChange={value => this.setState({ tag: value }, function() {
              remote.getGlobal('analysis').tag = value;
            })}
            options={Utilities.createTagOptions(all_tags)}
            closeMenuOnSelect={false}
            placeholder="Select a tag (or tags)..."
            isMulti
          />
          <br/>
          <button className="button" onClick={this.conductAnalysis.bind(this)}>Generate Chart</button> <button className="button" onClick={this.resetForm.bind(this)}>Reset</button>
        </div>
        <canvas ref={analysisLineChar => this.analysisLineChar = analysisLineChar} height="175" width="400"></canvas>
      </div>
    )
  }
}

export default Analysis;
