import React, {Component} from 'react';
const {getGlobal} = window.require('@electron/remote');

class Settings extends Component {
  constructor(props) {
    super(props);
    this.pressEnter = this.pressEnter.bind(this);
    this.per_page = React.createRef();
    this.genSelectTempOpts = this.genSelectTempOpts.bind(this);

    this.state = {
      per_page: 0,
      sort_by: "",
      width: 0,
      selected_template: "",
      sel_temp_data: {},
      templates: [],
      message: "",
      entries_inserted: this.props.entries_inserted,
      saved: false
    }
  }

  componentDidMount() {
    if (this.state.entries_inserted === true && this.state.saved === false) {
      this.loadAppData();
      document.addEventListener("keydown", this.pressEnter, false);
    }
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.pressEnter, false);
  }

  pressEnter(event) {
    if (event.keyCode === 13) {
      this.saveChanges();
    }
  }

  loadAppData() {
    this.props.app_data_shortterm.findOne({}, function(err, app_data) {
      this.setState({
        per_page: app_data.per_page,
        sort_by: app_data.sort_by,
        width: app_data.width,
        selected_template: app_data.selected_template,
        sel_temp_data: app_data.sel_temp_data,
        templates: app_data.templates
      });
    }.bind(this));
  }

  handle_per_page_Change(event) {
    this.setState({per_page: event.target.value});
  }

  handle_width_Change(event) {
    this.setState({width: event.target.value});
  }

  handle_sort_by_Change(event) {
    this.setState({sort_by: event.target.value}, function() {

      getGlobal('search').sorted = this.state.sort_by;
    });
  }

  handle_selected_template_Change(event) {
    let sel_temp_data = {};
    for (var i = 0, length = this.state.templates.length; i < length; i++) {
      if (this.state.templates[i].template_name === event.target.value) {
        sel_temp_data = this.state.templates[i].css_props;
      }
    }
    this.setState({selected_template: event.target.value, sel_temp_data: sel_temp_data});
  }


  genSelectTempOpts() {
    let templates = [];
    for (var i = 0, length = this.state.templates.length; i < length; i++) {
      templates.push(this.state.templates[i].template_name);
    }

    return templates.map((template, i) => {
      return (
        <option key={template + i} value={template}>{template}</option>
      )
    });
  }

  saveChanges() {
    if (this.state.per_page > 0) {
      this.props.app_data_longterm.update({}, {$set: {per_page: this.state.per_page, sort_by: this.state.sort_by, width: this.state.width, selected_template: this.state.selected_template, sel_temp_data: this.state.sel_temp_data}}, function() {
        this.props.app_data_shortterm.update({}, {$set: {per_page: this.state.per_page, sort_by: this.state.sort_by, width: this.state.width, selected_template: this.state.selected_template, sel_temp_data: this.state.sel_temp_data}}, function() {
          this.setState({saved: true}, function() {
            this.props.updateCSS(this.state.sel_temp_data);
            this.props.updateWidth(this.state.width);
            alert("Changes saved.");
          });
        }.bind(this));
      }.bind(this));
    } else {
      this.setState({message: "Your amount of entries per page must be greater than zero."})
    }
  }

  render() {
    let { per_page, sort_by, width, message, selected_template, entries_inserted } = this.state;
    return (
      <div className="theader">
        { entries_inserted === false ? <div>Loading...</div> :
          <div>
            <h3>Settings</h3>
            <p>
              <b>Amount of entries displayed per page:</b> <input ref={per_page => this.per_page = per_page} onChange={this.handle_per_page_Change.bind(this)} value={this.state.per_page} size="2"/>
            </p>
            <p>
              <b>Set default entries sorting:</b> <select onChange={this.handle_sort_by_Change.bind(this)} value={sort_by}>
                                <option value="bd_a">By Occurred Date ↑</option>
                                <option value="bd_d">By Occurred Date ↓</option>
                                <option value="">By Entered Date ↑</option>
                                <option value="be_d">By Entered Date ↓</option>
                                <option value="br_a">By Ranking ↑</option>
                                <option value="br_d">By Ranking ↓</option>
                              </select>
            </p>
            <p>
              <b>Select color theme:</b> <select onChange={this.handle_selected_template_Change.bind(this)} value={selected_template}>
                                {this.genSelectTempOpts()}
                              </select>
            </p>
            <p>
              <b>Adjust interface width:</b> <select onChange={this.handle_width_Change.bind(this)} value={width}>
                                <option value="95%">95%</option>
                                <option value="90%">90%</option>
                                <option value="85%">85%</option>
                                <option value="80%">80%</option>
                                <option value="75%">75%</option>
                                <option value="70%">70%</option>
                              </select>
            </p>
            <button className="button" onClick={this.saveChanges.bind(this)}>Save</button>
            <br/>
            {message}
          </div>
        }
      </div>
    )
  }
}

export default Settings;
