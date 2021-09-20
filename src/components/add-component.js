import React, {Component} from 'react';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import Editor from './editor-component';
import Utilities from './js/utilities.js';
const {getGlobal} = window.require('@electron/remote');

class Add extends Component {
  constructor(props) {
    super(props);
    this.pressEnter = this.pressEnter.bind(this);
    this.tag = React.createRef();
    this.CKEditor = React.createRef();

    this.state = {
      date: getGlobal('adding').date,
      tags: getGlobal('adding').tags,
      editor: getGlobal('adding').editor,
      rank: getGlobal('adding').rank,
      all_tags: getGlobal('adding').all_tags
    }
  }

  componentDidMount() {
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "add";
    document.addEventListener("keydown", this.pressEnter, false);
  }

  componentWillUnmount() {

    getGlobal('adding').tags = this.tag.value;
    getGlobal('adding').editor = this.CKEditor.editor.getData();
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "";
    document.removeEventListener("keydown", this.pressEnter, false);
  }

  pressEnter(event) {
    if (event.keyCode === 13 && getGlobal('enterTracker').tag_insert_tracker === false && getGlobal('enterTracker').component_tracker === "add") {
      this.handleSubmit();
    } else if (event.keyCode === 13 && getGlobal('enterTracker').tag_insert_tracker === true && getGlobal('enterTracker').component_tracker === "add") {
      this.addTag();
    }
  }

  handleSubmit() {

    let trimmed_body = this.CKEditor.editor.getData();
    trimmed_body = trimmed_body.replace(/&nbsp;/ig, "");
    trimmed_body = trimmed_body.replace(/\n/ig, "");

    if (trimmed_body === "" || this.state.date === "" || this.state.all_tags.length === 0) {
      alert("You must enter text into the body along with a date and at least one tag for this entry.");
    } else {

      let date = this.state.date;
      let rank = this.state.rank;
      let date_check = new Date(date);
      date_check.setHours(0, 0, 0, 0);
      let date_in_ms = date_check.getTime();
      let entered_date = new Date();
      let entered_date_ms = entered_date.getTime();

      if (date) {

        var entry = {
          body: this.CKEditor.editor.getData(),
          date: date_in_ms,
          display_date: date,
          tags: this.state.all_tags,
          rank: rank,
          entered: entered_date_ms
        };

        this.props.addEntry(entry);

        this.resetAdd();

        this.tag.value = "";
      } else {
        alert("You must enter a valid date.");
      }
    }
  }


  handleTabKey(e) {

    if (e.keyCode == 9) {

      document.execCommand('insertHTML', false, '&#009');

      e.preventDefault();
    }
  }

  addTag() {

    let state = Object.assign({}, this.state);

    let new_tag = this.tag.value;

    new_tag = Utilities.keepAllLettersNumbersSpacesDashes(new_tag);

    new_tag = new_tag.trim();

    if (new_tag !== "") {

      let tags = state.all_tags;

      let counter = 0;
      let tags_length = tags.length;
      for (var i = 0; i < tags_length; i++) {

        let nt_trimlc = new_tag;
        nt_trimlc = nt_trimlc.toLowerCase();
        nt_trimlc = nt_trimlc.trim();
        let t_trimlc = tags[i];
        t_trimlc = t_trimlc.toLowerCase();
        t_trimlc = t_trimlc.trim();
        if (nt_trimlc === t_trimlc) {
          counter = counter + 1;
        }
      }

      if (counter === 0) {

        tags.push(new_tag);

        state.tags = "";

        this.setState(state);
        getGlobal('adding').all_tags = tags;

        this.tag.value = "";

        this.tag.blur();

        getGlobal('enterTracker').tag_insert_tracker = false;
        getGlobal('enterTracker').component_tracker = "add";
      } else {
        alert("You have already entered that tag for this entry.");
      }
    } else {
      getGlobal('enterTracker').component_tracker = "add";
      this.handleSubmit();
    }
  }

  handle_tags_Change(event) {
    this.setState({ tags: event.target.value }, function() {
      getGlobal('adding').tags = this.state.tags;
    });
  }

  handle_rank_Change(event) {
    this.setState({ rank: event.target.value }, function() {
      getGlobal('adding').rank = this.state.rank;
      getGlobal('enterTracker').tag_insert_tracker = false;
      getGlobal('enterTracker').component_tracker = "add";
    });
  }

  handle_editor_Change(event) {
    this.setState({ editor: event.editor.getData() }, function() {
      getGlobal('adding').editor = this.state.editor;
      getGlobal('enterTracker').component_tracker = "add";
    });
  }

  handle_date_Change(event) {
    this.setState({ date: event }, function() {
      getGlobal('adding').date = this.state.date;
      getGlobal('enterTracker').tag_insert_tracker = false;
      getGlobal('enterTracker').component_tracker = "add";
    });
  }

  handle_tracker_tags_onClick() {
    getGlobal('enterTracker').tag_insert_tracker = true;
    getGlobal('enterTracker').component_tracker = "add";
  }


  displayingTags() {

    let ran_num = new Date().getTime();

    return this.state.all_tags.map((entry, i) => {
      return (
        <span key={"tag_span" + ran_num + i}>
          {this.state.all_tags[i]} <button className="button" onClick={this.deleteTag.bind(this, i)}>X</button> {" "}
        </span>
      )
    });
  }


  deleteTag(i) {

    let state = Object.assign({}, this.state);

    state.all_tags.splice(i, 1);
    getGlobal('adding').all_tags = state.all_tags;
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "add";

    this.setState(state);
  }


  resetAdd() {

    this.setState({date: new Date(), tags: "", all_tags: [], editor: "", rank: "0"});
    this.tag.value = "";

    getGlobal('adding').tags = "";
    getGlobal('adding').date = new Date();
    getGlobal('adding').all_tags = [];
    getGlobal('adding').editor = "";
    getGlobal('adding').rank = "0";
    getGlobal('enterTracker').tag_insert_tracker = false;
    getGlobal('enterTracker').component_tracker = "add";
  }

  render() {
    const { editor, date, tags } = this.state;
    return (
      <div className="theader">
        <h3>Insert a new timeline entry: <div className="float_right"><button className="button" onClick={this.props.viewAdd}>Hide</button></div></h3>
        <div>
          <Editor editorData={editor} handleEditorChange={this.handle_editor_Change.bind(this)} theRef={CKEditor => this.CKEditor = CKEditor} cssTemplate={this.props.cssTemplate}></Editor>
          <br/>
          Select event date: <DatePicker selected={date} onChange={this.handle_date_Change.bind(this)} />
          <br/>
          Tags: <input onBlur={this.handle_tags_Change.bind(this)} defaultValue={tags} ref={tag => this.tag = tag} onClick={this.handle_tracker_tags_onClick.bind(this)} /> <button className="button" onClick={this.addTag.bind(this)}>Add Tag</button> {this.displayingTags()}
          <br/>
          Importance: <select onChange={this.handle_rank_Change.bind(this)} value={this.state.rank}>
                        <option value="0"></option>
                        <option value="5">Very Important</option>
                        <option value="4">Important</option>
                        <option value="3">Average</option>
                        <option value="2">Less Important</option>
                        <option value="1">Least Important</option>
                      </select>
          <br/>
          <button className="button" onClick={this.handleSubmit.bind(this)}>Submit</button> <button className="button" onClick={this.resetAdd.bind(this)}>Reset</button>
        </div>
      </div>
    )
  }
}

export default Add;
