import React, {Component} from 'react';
import Utilities from './js/utilities.js';
import Chart from 'chart.js';

class Metrics extends Component {
  constructor(props) {
    super(props);
    this.tagsBarChar = React.createRef();
    this.tagsPieChart = React.createRef();

    this.state = {
      backgroundColors: ['#ff6666', '#00cc00', '#4d4dff', '#ffff00', '#a64dff', '#ffa366', '#ff80b3', '#00ffbf', '#88cc00', '#e6004c', '#c2c2a3', '#d2a679', '#ffdb4d', '#ff80ff', '#cccccc', '#4dff88', '#ff531a', '#ff0000'],
      borderColors: ['#ff0000', '#006600', '#0000cc', '#e6e600', '#6600cc', '#ff6600', '#ff0066', '#00b386', '#669900', '#990033', '#999966', '#996633', '#e6b800', '#ff00ff', '#999999', '#00cc44', '#cc3300', '#b30000'],
      entries: [],
      word_count: "",
      counter: 0,
      oldest_event: "",
      most_recent_event: "",
      all_tags: [],
      loaded: false
    }
  }

  componentDidMount() {
    this.loadMetrics();
  }

  loadMetrics() {

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

          this.eventTimeframe();

          var colors = Utilities.doubleShuffler(this.state.backgroundColors, this.state.borderColors);

          this.setState({backgroundColors: colors.first_array, borderColors: colors.second_array}, function() {

            this.topTags();
            this.topTagsPie();
          });
        });

        this.wordCount();
        this.entryCounter();
        this.setState({all_tags: Utilities.allTags(entries)});
      }

      this.setState({loaded: true});
    }.bind(this));
  }


  topTags() {

    let tags = [];

    for (var i = 0, ent_length = this.state.entries.length; i < ent_length; i++) {
      for (var j = 0, tags_length = this.state.entries[i].tags.length; j < tags_length; j++) {
        tags.push({tag: this.state.entries[i].tags[j]});
      }
    }

    let results = Utilities.occurrenceCounter(tags, "tag");

    results.sort(function(a, b) { return b.quantity - a.quantity; });

    let results_length = results.length;

    let max = 15;

    if (results_length > max) {

      results.splice(max);
    }

    let labels = [];
    for (var i = 0, l_length = results.length; i < l_length; i++) {
      labels.push(results[i].tag);
    }


    let quantities = [];
    for (var i = 0, q_length = results.length; i < q_length; i++) {
      quantities.push(results[i].quantity);
    }


    var ctx = this.tagsBarChar;

    var barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'number of tags',
          data: quantities,
          backgroundColor: this.state.backgroundColors,
          borderColor: this.state.borderColors,
          borderWidth: 1,
          barPercentage: 0.5,
          barThickness: 'flex',
          maxBarThickness: 25,
          minBarLength: 2,
          gridLines: {
            offsetGridLines: true
          }
        }]
      },
      options: {
        title: {
					display: true,
					text: 'Most common tags:'
        },
        scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(label, index, labels) {

                       if (Math.floor(label) === label) {
                           return label;
                       }

                }
              }
            }]
        }
      }
    });
  }

  topTagsPie() {

    if (this.state.entries.length > 0) {

      let tags = [];

      for (var i = 0, ent_length = this.state.entries.length; i < ent_length; i++) {
        for (var j = 0, tags_length = this.state.entries[i].tags.length; j < tags_length; j++) {
          tags.push({tag: this.state.entries[i].tags[j]});
        }
      }

      let results = Utilities.occurrenceCounter(tags, "tag");

      results.sort(function(a, b) { return b.quantity - a.quantity; });


      let results_length = results.length;

      let max = 15;

      let others = [];

      if (results_length > max) {

        for (var i = max, length = results.length; i < length; i++) {
          others.push(results[i]);
        }

        results.splice(max);
      }


      let total_tags = 0;

      for (var i = 0, length = results.length; i < length; i++) {
        total_tags = total_tags + results[i].quantity;
      }


      let labels = [];
      for (var i = 0, l_length = results.length; i < l_length; i++) {
        labels.push(results[i].tag);
      }


      let quantities = [];
      for (var i = 0, q_length = results.length; i < q_length; i++) {
        quantities.push((results[i].quantity / total_tags) * 100);
      }

      if (others.length > 0) {
        let others_amount = 0;
        for (var i = 0, length = others.length; i < length; i++) {
          others_amount = others_amount + others[i].quantity;
        }


        quantities.push((others_amount / total_tags) * 100);
        labels.push("Others");
      }


      var ctx = this.tagsPieChart;

      var pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'number of tags',
            data: quantities,
            backgroundColor: this.state.backgroundColors,
            borderColor: this.state.borderColors,
            borderWidth: 1
          }]
        },
        options: {
          title: {
  					display: true,
  					text: 'Tags percentages:'
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem, data) {
                return data['labels'][tooltipItem['index']] + ': ' + data['datasets'][0]['data'][tooltipItem['index']].toFixed(1) + '%';
              }
            }
          }
        }
      });
    }
  }


  wordCount() {

    let total_words = [];

    for (var i = 0, ent_length = this.state.entries.length; i < ent_length; i++) {

      let trimmed_body = this.state.entries[i].body.replace(/(<([^>]+)>)/ig, "");
      trimmed_body = trimmed_body.replace(/\n/ig, "");
      trimmed_body = trimmed_body.split(" ");

      for (var j = 0, trimmed_length = trimmed_body.length; j < trimmed_length; j++) {
        total_words.push(trimmed_body[j]);
      }
    }

    this.setState({word_count: total_words.length});
  }

  entryCounter() {
    this.setState({counter: this.state.entries.length});
  }


  eventTimeframe() {
    let state = Object.assign({}, this.state);
    state.entries.sort(function(a, b) { return a.date - b.date; });
    let options = { year: "numeric", month: "long", day: "numeric" };
    let oldest = new Date(state.entries[0].date);
    let recent = new Date(state.entries[state.entries.length - 1].date);
    state.oldest_event = oldest.toLocaleDateString("en-US", options);
    state.most_recent_event = recent.toLocaleDateString("en-US", options);
    this.setState(state);
  }

  render() {
    const { entries, counter, word_count, oldest_event, most_recent_event, all_tags, loaded } = this.state;
    return (
      <div>
        { loaded === false ? <div>Loading...</div> :
          <div>
            { entries.length > 0 ?
              <div>
                <div>
                  <h3>Timeline metrics:</h3>
                </div>
                <div className="entry">
                  <div>
                    Total entries: <b>{counter.toLocaleString('en-US', {minimumFractionDigits: 0})}</b>
                  </div>
                  <div>
                    Total word count for all entries: <b>{word_count.toLocaleString('en-US', {minimumFractionDigits: 0})}</b>
                  </div>
                  <div>
                    Oldest entry event: <b>{oldest_event}</b>
                  </div>
                  <div>
                    Most recent entry event: <b>{most_recent_event}</b>
                  </div>
                  <div>
                    Complete tag list ({all_tags.length}): <b>{all_tags.join(", ")}</b>
                  </div>
                </div>
              </div>
            : <div><h3>Add some entries to view your Timeline metrics.</h3></div>
            }
          </div>
        }
        <div className="entry">
          <canvas ref={tagsBarChar => this.tagsBarChar = tagsBarChar} height="25% !important" width="70% !important"></canvas>
        </div>
        <div className="entry">
          <canvas ref={tagsPieChart => this.tagsPieChart = tagsPieChart} height="25% !important" width="70% !important"></canvas>
        </div>
      </div>
    )
  }
}

export default Metrics;
