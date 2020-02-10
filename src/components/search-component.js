import React, {Component} from 'react';
import Select from 'react-select';
import Utilities from './js/utilities.js';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import memoize from "memoize-one";
const remote = window.require('electron').remote;

class Search extends Component {
  constructor(props) {
    super(props);
    this.pressEnter = this.pressEnter.bind(this);
    this.description = React.createRef();

    this.state = {
      tag: remote.getGlobal('search').search_arguments.tag.field,
      date_start: remote.getGlobal('search').search_arguments.date_start.field,
      date_end: remote.getGlobal('search').search_arguments.date_end.field,
      description: remote.getGlobal('search').search_arguments.description.field,
      rank: remote.getGlobal('search').search_arguments.rank.field,
      searchbydate: remote.getGlobal('search').search_arguments.searchbydate.field,
      search_message: this.props.searchMessage,
      all_tags: this.props.all_tags
    }
  }

  componentDidMount() {
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "search";
    document.addEventListener("keydown", this.pressEnter, false);


    this.setState({
      tag: remote.getGlobal('search').search_arguments.tag.field,
      date_start: remote.getGlobal('search').search_arguments.date_start.field,
      date_end: remote.getGlobal('search').search_arguments.date_end.field,
      description: remote.getGlobal('search').search_arguments.description.field,
      rank: remote.getGlobal('search').search_arguments.rank.field,
      searchbydate: remote.getGlobal('search').search_arguments.searchbydate.field
    });
  }

  filter = memoize(
    (propTags, stateTags) => propTags.filter(item => stateTags.includes(item))
  );

  componentWillUnmount() {
    remote.getGlobal('search').search_arguments.description.field = this.description.value;
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "";
    document.removeEventListener("keydown", this.pressEnter, false);
  }

  pressEnter(event) {
    if (event.keyCode === 13 && remote.getGlobal('enterTracker').tag_insert_tracker === false && remote.getGlobal('enterTracker').component_tracker === "search") {
      this.handleSearch();
    }
  }


  handleSearch() {
    let description = this.description.value;

    if ((this.state.tag === null || this.state.tag.length === 0) && this.state.searchbydate === false && description === "" && (this.state.rank === null || this.state.rank.length === 0)) {
      alert("Please enter something to search for.");
    } else {

      if (this.state.searchbydate === true) {

        if (this.state.date_end && this.state.date_start) {

          let start_set_to_midnight = this.state.date_start;
          if (remote.getGlobal('search').view_all === true) {
            start_set_to_midnight.setHours(0, 0, 0, 0);
          }
          let end_set_to_midnight = this.state.date_end;
          if (remote.getGlobal('search').view_all === true) {
            end_set_to_midnight.setHours(0, 0, 0, 0);
          }
          let start_date_in_ms = typeof start_set_to_midnight !== "number" ? start_set_to_midnight.getTime() : start_set_to_midnight;
          let end_date_in_ms = typeof end_set_to_midnight !== "number" ? end_set_to_midnight.getTime() : end_set_to_midnight;

          let test_start = start_date_in_ms;
          let test_end = end_date_in_ms;
          if (test_start > test_end) {

            start_date_in_ms = test_end;
            end_date_in_ms = test_start;
          }

          remote.getGlobal('search').search_arguments.date_start.searched = start_date_in_ms;
          remote.getGlobal('search').search_arguments.date_end.searched = end_date_in_ms;

          this.props.confirmTimelineSearch({tag: this.state.tag, date_start: start_date_in_ms, date_end: end_date_in_ms, description: description, rank: this.state.rank, searchbydate: this.state.searchbydate}, false, true);
        } else {
          alert("You must have a valid start and end date.")
        }
      } else {
        this.props.confirmTimelineSearch({tag: this.state.tag, date_start: "", date_end: "", description: description, rank: this.state.rank, searchbydate: this.state.searchbydate}, false, true);
      }

      remote.getGlobal('search').search_arguments.description.field = description;
    }
  }

  resetSearch() {
    this.setState({ tag: null, date_start: new Date(), date_end: new Date(), description: "", rank: null, searchbydate: false });

    this.description.value = "";

    remote.getGlobal('search').search_arguments.tag = { field: null, searched: null };
    remote.getGlobal('search').search_arguments.date_start = { field: "", searched: "" };
    remote.getGlobal('search').search_arguments.date_end = { field: "", searched: "" };
    remote.getGlobal('search').search_arguments.description = { field: "", searched: "" };
    remote.getGlobal('search').search_arguments.rank = { field: null, searched: null };
    remote.getGlobal('search').search_arguments.searchbydate = { field: false, searched: false };
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "search";
  }

  handle_date_start_Change(date) {
    this.setState({ date_start: date }, function() {
      remote.getGlobal('search').search_arguments.date_start.field = this.state.date_start;
      remote.getGlobal('enterTracker').tag_insert_tracker = false;
      remote.getGlobal('enterTracker').component_tracker = "search";
    });
  }

  handle_date_end_Change(date) {
    this.setState({ date_end: date }, function() {
      remote.getGlobal('search').search_arguments.date_end.field = this.state.date_end;
      remote.getGlobal('enterTracker').tag_insert_tracker = false;
      remote.getGlobal('enterTracker').component_tracker = "search";
    });
  }

  handle_description_Change(event) {
    let description = event.target.value;
    this.setState({ description: description }, function() {
      remote.getGlobal('search').search_arguments.description.field = description;
    });
  }

  searchByDate(searchby) {
    this.setState({ searchbydate: searchby }, function() {
      remote.getGlobal('search').search_arguments.searchbydate.field = this.state.searchbydate;

      if (searchby === false) {
        this.setState({ date_start: "", date_end: "" }, function() {
          remote.getGlobal('search').search_arguments.date_start.field = this.state.date_start;
          remote.getGlobal('search').search_arguments.date_end.field = this.state.date_end;
          remote.getGlobal('enterTracker').tag_insert_tracker = false;
          remote.getGlobal('enterTracker').component_tracker = "search";
        });
      }
    });
  }

  handle_tracker_onClick() {
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "search";
  }

  render() {
    const { rank, tag, all_tags } = this.state;
    const options = [
      { value: '5', label: 'Very Important' },
      { value: '4', label: 'Important' },
      { value: '3', label: 'Average' },
      { value: '2', label: 'Less Important' },
      { value: '1', label: 'Least Important' }
    ];
  
    const updatedTags = this.filter(this.props.all_tags, all_tags);
    return (
      <div>
        <div className="theader">
          <h3>Searching timeline: <div className="float_right"><button className="button" onClick={this.props.viewSearch}>Hide</button></div></h3>
          <Select
            styles={Utilities.reactSelectStyles(this.props.cssTemplate)}
            value={tag}
            onChange={value => this.setState({ tag: value }, function() {
              remote.getGlobal('search').search_arguments.tag.field = value;
              remote.getGlobal('enterTracker').tag_insert_tracker = false;
              remote.getGlobal('enterTracker').component_tracker = "search";
            })}
            options={Utilities.createTagOptions(updatedTags)}
            closeMenuOnSelect={false}
            placeholder="Select a tag (or tags)..."
            isMulti
          />
          <br/>
          { this.state.searchbydate === true ?
          <div>
          Select a date range: <DatePicker selected={this.state.date_start} onChange={this.handle_date_start_Change.bind(this)} /> to <DatePicker selected={this.state.date_end} onChange={this.handle_date_end_Change.bind(this)} />
          <br/>
          <button className="button" onClick={this.searchByDate.bind(this, false)}>Disable date search</button>
          </div>
          : <div><button className="button" onClick={this.searchByDate.bind(this, true)}>Search by date</button></div>
          }
          <br/>
          <Select
            styles={Utilities.reactSelectStyles(this.props.cssTemplate)}
            value={rank}
            onChange={value => this.setState({ rank: value }, function() {
              remote.getGlobal('search').search_arguments.rank.field = value;
              remote.getGlobal('enterTracker').tag_insert_tracker = false;
              remote.getGlobal('enterTracker').component_tracker = "search";
            })}
            options={options}
            closeMenuOnSelect={false}
            placeholder="Select a rank (or rank)..."
            isMulti
          />
          <br/>
          Words in entry: <input ref={description => this.description = description} onBlur={this.handle_description_Change.bind(this)} onClick={this.handle_tracker_onClick.bind(this)} defaultValue={this.state.description} />
          <br/>
          <button className="button" onClick={this.handleSearch.bind(this)}>Search</button> <button className="button" onClick={this.resetSearch.bind(this)}>Reset</button>
        </div>
        { this.state.search_message !== "" ? <div>{this.state.search_message}</div> : "" }
      </div>
    )
  }
}

export default Search;
