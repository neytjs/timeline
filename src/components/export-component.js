import React, {Component} from 'react';
import Utilities from './js/utilities.js';
const {getGlobal} = window.require('@electron/remote');
const fs = window.require('fs');
const os = window.require('os');

class Export extends Component {
  constructor(props) {
    super(props);
    this.pressEnter = this.pressEnter.bind(this);

    this.state = {
      file_type: getGlobal('export').file_type,
      selection: getGlobal('export').selection,
      jsonChecked: getGlobal('export').jsonChecked,
      txtChecked: getGlobal('export').txtChecked,
      allChecked: getGlobal('export').allChecked,
      selChecked: getGlobal('export').selChecked,
      message: getGlobal('export').message
    }
  }

  componentDidMount() {
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "export";
    document.addEventListener("keydown", this.pressEnter, false);
  }

  componentWillUnmount() {
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "";
    document.removeEventListener("keydown", this.pressEnter, false);
  }

  pressEnter(event) {
    if (event.keyCode === 13 && getGlobal('enterTracker').tag_insert_tracker === false && getGlobal('enterTracker').component_tracker === "export") {
      this.exportData();
    }
  }

  exportData() {
    if (this.state.file_type === "") {
      alert("You must select a file type for exported data output.");
    } else {
      let ascdesc = getGlobal('search').ascdesc;
      let sorted = getGlobal('search').sorted;

      if (this.state.selection === "sel") {

        let tag = getGlobal('search').search_arguments.tag.searched;
        let date_start = getGlobal('search').search_arguments.date_start.searched;
        let date_end = getGlobal('search').search_arguments.date_end.searched;
        let description = getGlobal('search').search_arguments.description.searched;
        let rank = getGlobal('search').search_arguments.rank.searched;

        description = description.replace(/(<([^>]+)>)/ig, " ");
        description = description.replace(/&nbsp;/ig, " ");
        description = description.replace(/\n/ig, " ");

        let search_desc = Utilities.customSplit(description);


        let tags = [];

        if (typeof tag === "string") {
          tags.push(tag);
        } else {
          if (tag !== null) {
            for (var i = 0, length = tag.length; i < length; i++) {
              tags.push(tag[i].value);
            }
          }
        }


        let ranks = [];
        if (rank !== null) {
          for (var i = 0, length = rank.length; i < length; i++) {
            ranks.push(rank[i].value);
          }
        }


        this.props.entries_shortterm.find({}, function(err, entries) {

          entries = Utilities.arrayComparerFindAll(tags, entries, "tags");

          entries = Utilities.arrayComparerFindAll(search_desc.notquotes, entries, "body");
          entries = Utilities.arrayComparer(search_desc.quotes, entries, "body");

          if (rank !== "0") {
            entries = Utilities.arrayComparerFindAny(ranks, entries, "rank");
          }

          entries = Utilities.datePruning(entries, date_start, date_end);

          entries = this.props.entriesSorter(entries, ascdesc, sorted);

          this.createFile(entries);
        }.bind(this));
      } else if (this.state.selection === "all") {

        this.props.entries_shortterm.find({}, function(err, entries) {

          entries = this.props.entriesSorter(entries, ascdesc, sorted);

          this.createFile(entries);
        }.bind(this));
      } else {
        alert("You must select whether to export all entries or only your current search results.")
      }
    }
  }

  createFile(entries) {
    let filepath = this.props.app_path;
    let file_type = this.state.file_type;
    let slash = os.platform() === "win32" ? "\\" : "\/";
    if (file_type === "txt") {
      let filename = slash + "entries" + new Date().getTime() + "." + file_type;
      let savePath = filepath + filename;
      let entries_txt = "";

      for (var i = 0, length = entries.length; i < length; i++) {
        let entered = new Date(entries[i].entered);
        let occurred = new Date(entries[i].date);
        let body = entries[i].body;
        let rank = entries[i].rank !== "0" ? this.props.displayRank(entries[i].rank) : "Unranked";

        body = body.replace(/(&nbsp;|<([^>]+)>)/ig, " ");
        body = body.replace(/&ldquo;|&rdquo;|&quot;/ig, "\"");
        body = body.replace(/&lsquo;|&rsquo;|&#39;/ig, "\'");
        body = body.replace(/&ndash;|&mdash;/ig, "--");
        body = body.replace(/\n/ig, " ");
        body = body.trim();

        entries_txt += entered.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }) + " (Date Entered)" + "\n" + occurred.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + " (Event Occurred)" + "\n" + entries[i].tags.join(", ") + "\n" + rank +  "\n" + body + "\n\n" + "***************" + "\n\n";
      }

      fs.writeFile(savePath, entries_txt, function(err) {

        this.resetExport();

        let message = "File saved at " + savePath;

        this.setState({ message: message }, function() {
          getGlobal('export').message = this.state.message;
        });
      }.bind(this));
    } else if (file_type === "json") {
      let filename = slash + "entries" + new Date().getTime() + "." + file_type;
      let savePath = filepath + filename;
      let entries_json = JSON.stringify(entries);

      fs.writeFile(savePath, entries_json, function(err) {

        this.resetExport();

        let message = "File saved at " + savePath;

        this.setState({ message: message }, function() {
          getGlobal('export').message = this.state.message;
        });
      }.bind(this));
    }
  }

  resetExport() {
    this.setState({
      file_type: "",
      selection: "",
      txtChecked: false,
      jsonChecked: false,
      allChecked: false,
      selChecked: false
    });
    getGlobal('export').file_type = "";
    getGlobal('export').selection = "";
    getGlobal('export').txtChecked = false;
    getGlobal('export').jsonChecked = false;
    getGlobal('export').allChecked = false;
    getGlobal('export').selChecked = false;
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "export";
  }

  handleFileTypeChange(event) {
    this.setState({
      file_type: event.target.value,
      txtChecked: (event.target.value === "txt" ? true : false),
      jsonChecked: (event.target.value === "json" ? true : false)
    }, function() {
      getGlobal('export').file_type = this.state.file_type;
      getGlobal('export').txtChecked = this.state.txtChecked;
      getGlobal('export').jsonChecked = this.state.jsonChecked;
      getGlobal('enterTracker').tag_insert_tracker = false;
      getGlobal('enterTracker').component_tracker = "export";
    });
  }

  handleSelectionChange(event) {
    this.setState({
      selection: event.target.value,
      allChecked: (event.target.value === "all" ? true : false),
      selChecked: (event.target.value === "sel" ? true : false)
    }, function() {
      getGlobal('export').selection = this.state.selection;
      getGlobal('export').allChecked = this.state.allChecked;
      getGlobal('export').selChecked = this.state.selChecked;
      getGlobal('enterTracker').tag_insert_tracker = false;
      getGlobal('enterTracker').component_tracker = "export";
    });
  }

  hide_message() {
    this.setState( { message: "" }, function() {
      getGlobal('export').message = "";
    });
  }

  render() {
    const { message, txtChecked, jsonChecked, allChecked, selChecked } = this.state;
    return (
      <div>
        <div className="theader">
          <h3>Export Timeline data: <div className="float_right"><button className="button" onClick={this.props.viewExport}>Hide</button></div></h3>
          <p>
            <b>Select an export file type:</b>
            <br/>
            TXT: <input type="radio" value="txt" onChange={this.handleFileTypeChange.bind(this)} checked={txtChecked} name="file_type"/> JSON: <input type="radio" value="json" onChange={this.handleFileTypeChange.bind(this)} checked={jsonChecked} name="file_type"/>
          </p>
          <p>
            <b>Select amount of entries to export:</b>
            <br/>
            All entries: <input type="radio" value="all" onChange={this.handleSelectionChange.bind(this)} checked={allChecked} name="selection"/> Current search results: <input type="radio" value="sel" onChange={this.handleSelectionChange.bind(this)} checked={selChecked} name="selection"/>
          </p>
          <button className="button" onClick={this.exportData.bind(this)}>Export Data</button> <button className="button" onClick={this.resetExport.bind(this)}>Reset Form</button>
        </div>
        {message} { message !== "" ? <button className="button" onClick={this.hide_message.bind(this)}>X</button> : "" }
      </div>
    )
  }
}

export default Export;
