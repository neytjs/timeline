import React, {Component} from 'react';
const fs = window.require('fs');
import styled from 'styled-components';
import ViewTimeline from './view-timeline-component';
import Analysis from './analysis-component';
import Metrics from './metrics-component';
import Settings from './settings-component';
import Help from './help-component';
import Utilities from './js/utilities.js';
const {app, getGlobal} = window.require('@electron/remote');
const ipcRenderer = window.require('electron').ipcRenderer;
import AppData from './js/app_data.js';
const defaultAppData = AppData.defaultAppData();

let app_path = app.getAppPath('');

var DataStore = window.require('nedb');
var app_data_longterm = new DataStore({ filename: app_path+'/data/app_data.db', autoload: true });
var app_data_shortterm = new DataStore();

class App extends Component {
  constructor() {
    super();
    this.filepath = "";

    this.entries_longterm = new DataStore({ filename: '', autoload: true });
    this.entries_shortterm = new DataStore();
    this.keyPress = this.keyPress.bind(this);
    this.running = false;
    this.keys = [];

    this.state = {
      entries_inserted: false,
      view_or_add: "view",
      all_tags: [],
      css_template: {},
      corrupt: false,
      width: "",
      table_width: "",
      corrupt_file: ""
    }
  }


  async componentDidMount() {
    document.addEventListener("keydown", this.keyPress, false);
    let ret_app_data = await this.getEntries();
    this.setState({ entries_inserted: ret_app_data });

    ipcRenderer.on('new_db', function(event, response) {

      this.setState({entries_inserted: false});

      this.entries_shortterm.find({}, function(err, entries) {
        let warning = false;

        if (entries.length > 0 && this.filepath === "") {
          warning = true;
        }

        let newFile = () => {
          this.filepath = "";

          this.entries_longterm = new DataStore({ filename: this.filepath, autoload: true });

          this.entries_shortterm = new DataStore();

          app_data_longterm.update({}, {$set: {filepath: this.filepath}}, function() {
            this.setState({ view_or_add: "view" });
            getGlobal('searching_adding').searching_adding = "adding";

            this.getEntries(true);
          }.bind(this));
        }

        if (warning === true) {

          var confirm_delete = confirm("Warning, any unsaved changes will be lost if confirmed.");

          if (confirm_delete === true) {
            newFile();
          } else {
            this.setState({entries_inserted: true});
          }
        } else {
          newFile();
        }
      }.bind(this));
    }.bind(this));
    ipcRenderer.on('save_as_db', function(event, response) {

      this.setState({entries_inserted: false});

      this.filepath = response;

      app_data_longterm.update({}, {$set: {filepath: this.filepath}}, function() {

        this.entries_longterm = new DataStore({ filename: this.filepath, autoload: true });

        this.saveEntries();
      }.bind(this));
    }.bind(this));

    ipcRenderer.on('load_timeline', function(event, response) {

      this.setState({entries_inserted: false});

      this.entries_shortterm.find({}, function(err, entries) {
        let warning = false;

        if (entries.length > 0 && this.filepath === "") {
          warning = true;
        }

        let loadFile = () => {

          this.filepath = response;

          app_data_longterm.update({}, {$set: {filepath: this.filepath}}, function() {
            this.setState({ view_or_add: "view" });

            this.getEntries();
          }.bind(this));
        };

        if (warning === true) {

          var confirm_delete = confirm("Warning, any unsaved changes will be lost if confirmed.");

          if (confirm_delete === true) {
            loadFile();
          } else {
            this.setState({entries_inserted: true});
          }
        } else {
          loadFile();
        }
      }.bind(this));
    }.bind(this));
    ipcRenderer.on('view', function(event, response) {
      getGlobal('searching_adding').searching_adding = "none";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('search', function(event, response) {
      getGlobal('searching_adding').searching_adding = "searching";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('add', function(event, response) {
      getGlobal('searching_adding').searching_adding = "adding";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('export', function(event, response) {
      getGlobal('searching_adding').searching_adding = "exporting";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('analysis', function(event, response) {
      getGlobal('searching_adding').searching_adding = "none";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('metrics', function(event, response) {
      getGlobal('searching_adding').searching_adding = "none";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('settings', function(event, response) {
      getGlobal('searching_adding').searching_adding = "none";
      this.setState({ view_or_add: response });
    }.bind(this));
    ipcRenderer.on('help', function(event, response) {
      getGlobal('searching_adding').searching_adding = "none";
      this.setState({ view_or_add: response });
    }.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyPress, false);
  }



  keyPress(event) {

    if (event.ctrlKey === true && event.keyCode === 65) {
      event.preventDefault();
    }

    let ctrl = event.ctrlKey;
    let key = event.keyCode;

    this.keys.push({ctrl: ctrl, key: key});
    if (this.running === true) {

      return false;
    }

    function innerFunction() {

      this.running = true;

      setTimeout(function() {
        let final_key = "";
        let status = "";

        for (var i = 0, length = this.keys.length; i < length; i++) {

          if (this.keys[i].ctrl === true && this.keys[i].key === 83) {
            status = "searching";
          }
          if (this.keys[i].ctrl === true && this.keys[i].key === 65) {
            status = "adding";
          }
          if (this.keys[i].ctrl === true && this.keys[i].key === 69) {
            status = "exporting";
          }
          if (this.keys[i].ctrl === true && this.keys[i].key === 78) {
            status = "analysis";
          }
          if (this.keys[i].ctrl === true && this.keys[i].key === 77) {
            status = "metrics";
          }

          if (i === (length - 1)) {
            if (this.keys[i].key === 13) {
              final_key = "enter";
            }

            if (this.keys[i].ctrl === true && this.keys[i].key === 83) {
              final_key = "searching";
            }
            if (this.keys[i].ctrl === true && this.keys[i].key === 65) {
              final_key = "adding";
            }
            if (this.keys[i].ctrl === true && this.keys[i].key === 69) {
              final_key = "exporting";
            }
            if (this.keys[i].ctrl === true && this.keys[i].key === 78) {
              status = "analysis";
            }
            if (this.keys[i].ctrl === true && this.keys[i].key === 77) {
              status = "metrics";
            }
          }
        }

        if (final_key !== "enter" && (final_key === "searching" || final_key === "adding" || final_key === "exporting" || final_key === "analysis" || final_key === "metrics")) {
          status = final_key;
        }

        if ((status === "searching" || status === "adding" || status === "exporting" || status === "analysis" || status === "metrics") && final_key !== "enter") {
          if (getGlobal('searching_adding').searching_adding === status) {
            getGlobal('searching_adding').searching_adding = "none";
            this.setState({ view_or_add: "view" });
          } else {
            if (status === "analysis" || status === "metrics") {
              getGlobal('searching_adding').searching_adding = "none";
              this.setState({ view_or_add: status });
            } else {
              getGlobal('searching_adding').searching_adding = status;
              this.setState({ view_or_add: "view" });
            }
          }
        }

        this.keys = [];
        this.running = false;
      }.bind(this), 200);
    }

    let callInner = innerFunction.bind(this);
    callInner();
  }


  getEntries(new_file) {

    function returnPromise(app_data) {

      return new Promise(resolve => {

        this.entries_longterm.find({}, function(err, entries) {

          if (Utilities.fileCorruptionCheck(entries) === false) {
            this.entries_shortterm.insert(entries, function(err) {
              app_data_shortterm.findOne({}, function(err, app_data_s) {

                  let all_tags = Utilities.allTags(entries);

                  let result = true;

                  resolve(result);

                  this.setState({entries_inserted: true, all_tags: all_tags, css_template: app_data_s.sel_temp_data}, function() {

                    document.body.style.backgroundColor = this.state.css_template.body_background_color;
                    document.body.style.color = this.state.css_template.body_color;
                  });
              }.bind(this));
            }.bind(this));
          } else {
            this.setState({corrupt: true, corrupt_file: this.filepath});

            this.entries_longterm = new DataStore({ filename: "", autoload: true });
          }
        }.bind(this));
      });
    }

    var theEntries = returnPromise.bind(this);


    if (new_file) {
      theEntries();
    } else {

      app_data_longterm.findOne({}, function(err, app_data) {

        if (app_data) {

          if (app_data.filepath !== "") {

            fs.access(app_data.filepath, fs.F_OK, (err) => {

              if (err) {
                this.filepath = "";
              } else {
                this.filepath = app_data.filepath;

                this.entries_longterm = new DataStore({ filename: this.filepath, autoload: true });

                this.entries_shortterm = new DataStore();

                let path = this.filepath === "" ? "unsaved" : this.filepath;

                ipcRenderer.send('ret_db', path);

                app_data_shortterm.insert(app_data, function(err, app_d_s) {

                  theEntries();
                });

                getGlobal('search').sorted = app_data.sort_by;
                this.setState({width: app_data.width, table_width: "100%"});
              }
            });
          } else {

            this.entries_longterm = new DataStore({ filename: this.filepath, autoload: true });

            this.entries_shortterm = new DataStore();

            ipcRenderer.send('ret_db', "unsaved");

            app_data_shortterm.insert(app_data, function(err, app_d_s) {

              theEntries();
            });

            getGlobal('search').sorted = app_data.sort_by;
            this.setState({width: app_data.width, table_width: "100%"});
          }
        } else {
          app_data_longterm.insert(defaultAppData, function(err, app_d_l) {

            app_data_shortterm.insert(app_d_l, function(err, app_d_s) {

              theEntries();
            });
          });
        }
      }.bind(this));
    }
  }

  saveEntries() {
    return new Promise(resolve => {

      this.entries_shortterm.find({}, function(err, entries) {
        this.entries_longterm.insert(entries, function(err, docs) {
          let result = true;

          resolve(result);

          this.setState({entries_inserted: true, view_or_add: "view"});
        }.bind(this));
      }.bind(this));
    });
  }

  updateAllTags(all_tags) {
    this.setState({all_tags: all_tags});
  }

  updateCSS(css_template) {
    this.setState({css_template: css_template}, function() {

      document.body.style.backgroundColor = this.state.css_template.body_background_color;
      document.body.style.color = this.state.css_template.body_color;
    });
  }

  updateWidth(width) {
    this.setState({width: width, table_width: "100%"});
  }

  render() {
    const { view_or_add, entries_inserted, all_tags, corrupt, corrupt_file, css_template } = this.state;
    const Wrapper = styled.div`
      hr {
        border: ${css_template.hr_color};
      }

      a {
        text-decoration: underline;
        font-size: 18;
        color: ${css_template.a_color};
      }

      a:link {
        text-decoration: yes;
      }

      a:visited {
        text-decoration: underline;
        color: ${css_template.a_visited_color};
        font-weight: normal;
      }

      a:hover {
        color: ${css_template.a_hover_color};
        cursor: pointer;
      }

      input {
      	border: ${css_template.button_border};
      	border-radius: 3px;
      	padding: 3px;
      	background-color: ${css_template.body_background_color};
      }

      input:hover {
      	background-color: ${css_template.entry_background};
      }

      select {
      	border: ${css_template.button_border};
      	border-radius: 3px;
      	background-color: ${css_template.body_background_color};
      	padding: 3px;
      }

      select:hover {
      	border: ${css_template.button_border};
      	border-radius: 3px;
      	background-color: ${css_template.entry_background};
      	padding: 3px;
      	cursor: pointer;
      }

      .button {
        border-radius: 5px;
        font-size: 15px;
        background-color: ${css_template.button_background_color};
        color: ${css_template.button_color};
        border: ${css_template.button_border};
        margin: 5px 5px;
        padding: 0 15px;
        line-height: 1.45;
        width: auto;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
      }

      .button:hover {
        background-color: ${css_template.button_hover_background_color};
        color: ${css_template.button_hover_color};
        border: ${css_template.button_hover_border};
      }

      .button:active {
        background-color: ${css_template.button_active_background_color};
        color: ${css_template.button_active_color};
        border: ${css_template.button_active_border};
      }

      .theader {
        border: ${css_template.theader_border};
        border-radius: 5px;
        width: ${this.state.width};
        padding: 2px;
        background: ${css_template.theader_background};
        margin-bottom: 5px;
      }

      .entry {
        border: ${css_template.entry_border};
        border-radius: 5px;
        width: ${this.state.width};
        background: ${css_template.entry_background};
        margin-bottom: 5px;
        padding: 3px;
      }

      .entry_viewer {
        width: ${this.state.table_width};
      }

      .edit_button {
        float: right;
      }

      .small_text {
        font-size: small;
      }

      .float_right {
        float: right;
      }
    `;
    return (
      <Wrapper>
        <div>
          { corrupt === true && corrupt_file === this.filepath ? <div><b>ERROR:</b> File corrupt or invalid file type. Can not load data. Try loading another file or creating a new file.</div> :
            <div>
              { entries_inserted === false ? <div>Loading...</div> :
                <div>
                  <div>
                    { this.filepath === "" ? <p><b>WARNING:</b> This is an unsaved project. Remember to save your work or it will be lost.</p> : "" }
                  </div>
                  {
                    view_or_add === "view" ? <ViewTimeline entries_longterm={this.entries_longterm} entries_shortterm={this.entries_shortterm} entries_inserted={entries_inserted} app_data_shortterm={app_data_shortterm} all_tags={all_tags} updateAllTags={this.updateAllTags.bind(this)} cssTemplate={css_template} app_path={app_path}></ViewTimeline>
                    : view_or_add === "analysis" ? <Analysis entries_shortterm={this.entries_shortterm} all_tags={all_tags} cssTemplate={css_template}></Analysis>
                    : view_or_add === "metrics" ? <Metrics entries_shortterm={this.entries_shortterm}></Metrics>
                    : view_or_add === "settings" ? <Settings app_data_longterm={app_data_longterm} app_data_shortterm={app_data_shortterm} entries_inserted={entries_inserted} updateCSS={this.updateCSS.bind(this)} updateWidth={this.updateWidth.bind(this)}></Settings>
                    : view_or_add === "help" ? <Help></Help>
                    : ""
                  }
                </div>
              }
            </div>
          }
        </div>
      </Wrapper>
    )
  }
}

export default App;
