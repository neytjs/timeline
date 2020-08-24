import React, {Component} from 'react';
import ReactHtmlParser from 'react-html-parser';
import cloneDeep from 'lodash.clonedeep';
import Search from './search-component';
import Add from './add-component';
import Export from './export-component';
import Editor from './editor-component';
import Utilities from './js/utilities.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const remote = window.require('electron').remote;

class ViewTimeline extends Component {
  constructor(props) {
    super(props);
    this.viewAll = this.viewAll.bind(this);
    this.mapEntries = this.mapEntries.bind(this);
    this.searchTimeline = this.searchTimeline.bind(this);
    this.searchString = this.searchString.bind(this);
    this.tag = React.createRef();
    this.rank = React.createRef();
    this.CKEditor = React.createRef();
    this.enterPress = this.enterPress.bind(this);

    this.state = {
      entries: [],
      editing: -1,
      unsaved: false,
      cancel: false,
      loading: true,
      entries_inserted: this.props.entries_inserted,
      tags: remote.getGlobal('editing').tags,
      searching_adding: remote.getGlobal('searching_adding').searching_adding,
      search_message: "",
      temp: remote.getGlobal('editing').temp,
      counter: 0,
      editor: remote.getGlobal('editing').editing_entry.body,
      sorted: remote.getGlobal('search').sorted,
      ascdesc: remote.getGlobal('search').ascdesc,
      total: 0,
      page: remote.getGlobal('search').page,
      per_page: 30,
      start: 0,
      all_tags: this.props.all_tags,
      id: remote.getGlobal('editing').id,
      _id: remote.getGlobal('editing')._id
    }
  }


  async componentDidMount() {

    if (this.state.entries_inserted === true) {

      let loading = await this.viewAll();
      this.setState({ loading: loading }, function() {
        if (remote.getGlobal('editing').loc !== 0 && remote.getGlobal('search').view_all !== false) {
          setTimeout(function() {
            window.scrollTo(0, remote.getGlobal('editing').loc);
            remote.getGlobal('editing').loc = 0;
          }, 300);
        }
      });
    }
  }

  componentWillUnmount() {

    if (this.state.editing !== -1) {
      remote.getGlobal('editing').tags = this.tag.value;
      remote.getGlobal('editing').editing_entry.body = this.CKEditor.editor.getData();

      if (this.state.entries[this.state.id].body !== this.CKEditor.editor.getData() || this.state.tags !== this.tag.value) {
        remote.getGlobal('editing').unsaved = true;
      }
    }
  }

  enterPress(event) {
    if (event.keyCode === 13 && remote.getGlobal('enterTracker').tag_insert_tracker === false && remote.getGlobal('enterTracker').component_tracker === "edit") {
      this.saveEntry();
    } else if (event.keyCode === 13 && remote.getGlobal('enterTracker').tag_insert_tracker === true && remote.getGlobal('enterTracker').component_tracker === "edit") {
      this.addTag();
    }
  }


  viewAll(display_all, add_call, page) {
    return new Promise(resolve => {

      if (display_all === true) {
        this.setState({loading: true, page: 1}, function() {
          remote.getGlobal('search').page = this.state.page;
        });
      }


      this.props.entries_shortterm.find({}, function(err, docs) {
        this.props.app_data_shortterm.findOne({}, function(err, app_data) {

          this.setState({per_page: parseInt(app_data.per_page)});
          let entries = docs;
          let total = entries.length;
          let counter =  entries.length;


          entries = this.entriesSorter(entries, this.state.ascdesc, this.state.sorted);
          let paginate_data = {};
          if (page) {

            paginate_data = this.paginateEntries(entries, page);
            this.setState({page: page}, function() {

              remote.getGlobal('search').page = page;
            });
          } else {
            paginate_data = this.paginateEntries(entries);
          }

          entries = paginate_data.viewable_entries;

          this.setState({
            entries: entries,
            start: paginate_data.start,
            counter: counter,
            total: total,
            search_message: "",
            searching_adding: remote.getGlobal('searching_adding').searching_adding
          }, function() {

            if (remote.getGlobal('editing').id !== "") {
              let state = Object.assign({}, this.state);
              state.entries[remote.getGlobal('editing').id] = remote.getGlobal('editing').editing_entry;
              state.editing = remote.getGlobal('editing').id;
              state.temp = remote.getGlobal('editing').temp;
              this.setState(state, function() {

                this.editEntry(remote.getGlobal('editing').id, remote.getGlobal('editing')._id, true);

                this.setState({ unsaved: remote.getGlobal('editing').unsaved });
              });
            }

            if (entries.length === 0 && remote.getGlobal('searching_adding').searching_adding === "none") {
              remote.getGlobal('searching_adding').searching_adding = "adding";
              this.setState({searching_adding: "adding"});
            }


            if (display_all === true) {

              remote.getGlobal('search').view_all = true;
              remote.getGlobal('search').search_arguments.tag.searched = null;
              remote.getGlobal('search').search_arguments.date_start.searched = "";
              remote.getGlobal('search').search_arguments.date_end.searched = "";
              remote.getGlobal('search').search_arguments.description.searched = "";
              remote.getGlobal('search').search_arguments.rank.searched = null;
              remote.getGlobal('search').search_arguments.searchbydate.searched = false;

              this.setState({loading: false});
            } else if (remote.getGlobal('search').view_all === false) {

              this.confirmTimelineSearch({
                tag: remote.getGlobal('search').search_arguments.tag.searched,
                date_start: remote.getGlobal('search').search_arguments.date_start.searched,
                date_end: remote.getGlobal('search').search_arguments.date_end.searched,
                description: remote.getGlobal('search').search_arguments.description.searched,
                rank: remote.getGlobal('search').search_arguments.rank.searched,
                searchbydate: remote.getGlobal('search').search_arguments.searchbydate.searched
              });
              this.setState({ search_hidden: remote.getGlobal('search').search_hidden });
            } else {

              if (add_call === true) {
                this.setState({loading: false});
              }

              resolve(false);
            }
          });
        }.bind(this));
      }.bind(this));
    });
  }


  conditionTest() {
    if (this.state.editing !== -1) {

      if (this.state.unsaved === true || this.state.entries[this.state.id].body !== this.CKEditor.editor.getData() || this.state.tags !== this.tag.value) {
        return true;
      } else {
        return false;
      }
    }
  }

  viewAllEntries() {
    if (this.conditionTest() === true) {
      var confirm_search = confirm("Do you want to lose all unsaved changes?");
      if (confirm_search === true) {

        this.cancelEdit();

        this.viewAll(true);
      }
    } else {
      if (this.state.editing !== -1) {

        this.cancelEdit();
      }

      this.viewAll(true);
    }
  }

  addEntry(entry) {

    this.props.entries_longterm.insert(entry, function(err, docs) {
    });

    this.props.entries_shortterm.insert(entry, function(err, docs) {
      this.props.entries_shortterm.find({}, function(err, entries) {

        this.setState({loading: true});

        remote.getGlobal('searching_adding').searching_adding = "adding";

        this.viewAll(false, true);

        let all_tags = Utilities.allTags(entries);
        this.setState({all_tags: all_tags}, function() {

          this.props.updateAllTags(all_tags);
        });
      }.bind(this));
    }.bind(this));
  }


  editEntry(id, _id, global_restore) {

    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "edit";
    document.addEventListener("keydown", this.enterPress, false);

    let state = Object.assign({}, this.state);
    state.id = id;
    state._id = _id;

    if (this.state.unsaved === false) {

      if (global_restore === false) {
        this.cancelEdit();
        remote.getGlobal('editing').id = id;
        remote.getGlobal('editing')._id = _id;
        remote.getGlobal('editing').editing_entry = state.entries[id];
        state.temp = cloneDeep(state.entries[id]);
        remote.getGlobal('editing').temp = state.temp;
      }

      state.editing = id;

      state.tags = remote.getGlobal('editing').tags;

      state.editor = state.entries[id].body;

      this.setState(state);
    } else {

      var confirm_delete = confirm("Warning, any unsaved changes will be lost if confirmed.");

      if (confirm_delete === true) {

        if (global_restore === false) {
          this.cancelEdit();
          remote.getGlobal('editing').id = id;
          remote.getGlobal('editing')._id = _id;
          remote.getGlobal('editing').editing_entry = state.entries[id];





          state.temp = cloneDeep(state.entries[id]);
          remote.getGlobal('editing').temp = state.temp;
        }

        state.editing = id;

        state.tags = remote.getGlobal('editing').tags;

        state.unsaved = false;

        state.editor = state.entries[id].body;

        this.setState(state);
      }
    }
    
    let element = document.getElementById("entry" + id);
    element.scrollIntoView();
  }


  cancelEdit(clicked) {

    let state = Object.assign({}, this.state);

    state.entries[state.editing] = state.temp;

    state.temp = {};

    state.editing = -1;

    state.id = "";
    state._id = "";

    state.tags = "";

    state.unsaved = false;

    this.setState(state);

    remote.getGlobal('editing').id = "";
    remote.getGlobal('editing')._id = "";
    remote.getGlobal('editing').tags = "";
    remote.getGlobal('editing').unsaved = false;
    remote.getGlobal('editing').editing_entry = {};

    if (clicked === true) {
      remote.getGlobal('enterTracker').tag_insert_tracker = false;
      remote.getGlobal('enterTracker').component_tracker = "";
      document.removeEventListener("keydown", this.enterPress, false);
    }
  }


  deleteEdit(id) {

    var confirm_delete = confirm("Do you really want to permanently delete this entry?");

    if (confirm_delete === true) {

      remote.getGlobal('editing').loc = window.pageYOffset;
      let entered = this.state.entries[id].entered;

      this.props.entries_longterm.remove({ entered: entered }, {}, function (err, numRemoved) {
      });

      this.props.entries_shortterm.remove({ entered: entered }, {}, function (err, numRemoved) {
        this.props.entries_shortterm.find({}, function(err, entries) {

          let all_tags = Utilities.allTags(entries);
          this.setState({all_tags: all_tags}, function() {

            this.props.updateAllTags(all_tags);
          });
        }.bind(this));
      }.bind(this));


      let state = Object.assign({}, this.state);

      state.entries.splice(state.editing, 1);

      state.editing = -1;

      state.unsaved = false;

      state.counter = state.counter - 1;

      this.setState(state);

      remote.getGlobal('editing').id = "";
      remote.getGlobal('editing')._id = "";
      remote.getGlobal('editing').unsaved = false;
      remote.getGlobal('editing').editing_entry = {};
      remote.getGlobal('enterTracker').tag_insert_tracker = false;
      remote.getGlobal('enterTracker').component_tracker = "";
      document.removeEventListener("keydown", this.enterPress, false);
    }
  }


  saveEntry() {

    remote.getGlobal('editing').loc = window.pageYOffset;
    let id = this.state.id;
    let _id = this.state._id;

    let html_body = this.CKEditor.editor.getData();

    let trimmed_body = html_body.replace(/(<([^>]+)>)/ig, "");
    trimmed_body = trimmed_body.replace(/&nbsp;/ig, "");
    trimmed_body = trimmed_body.replace(/\n/ig, "");

    if (trimmed_body === "" || this.state.entries[id].display_date === "" || this.state.entries[id].tags.length === 0) {
      alert("You must enter text into the body along with a date and at least one tag for this entry.");
    } else {

      let date = this.state.entries[id].display_date;
      let entered = this.state.entries[id].entered;
      let date_check = new Date(date);
      date_check.setHours(0, 0, 0, 0);
      let date_in_ms = date_check.getTime();

      this.props.entries_shortterm.update({entered: entered}, {$set:{body: html_body, date: date_in_ms, display_date: date, tags: this.state.entries[id].tags, rank: this.rank.value}}, function(err, entries) {
        this.props.entries_shortterm.find({}, function(err, entries) {

          let all_tags = Utilities.allTags(entries);
          this.setState({all_tags: all_tags}, function() {

            this.props.updateAllTags(all_tags);
          });
        }.bind(this));
      }.bind(this));

      this.props.entries_longterm.update({entered: entered}, {$set:{body: html_body, date: date_in_ms, display_date: date, tags: this.state.entries[id].tags, rank: this.rank.value}}, function(err, entries) {
      });

      let state = Object.assign({}, this.state);

      state.entries[state.editing].date = date_in_ms;
      state.entries[state.editing].body = html_body;
      state.unsaved = false;
      state.editing = -1;

      this.setState(state);

      remote.getGlobal('editing').id = "";
      remote.getGlobal('editing')._id = "";
      remote.getGlobal('editing').unsaved = false;
      remote.getGlobal('editing').editing_entry = {};
      remote.getGlobal('enterTracker').tag_insert_tracker = false;
      remote.getGlobal('enterTracker').component_tracker = "";
      document.removeEventListener("keydown", this.enterPress, false);
    }
  }


  viewSearchAdd(status) {
    this.setState({ searching_adding: status, cancel: true });

    remote.getGlobal('searching_adding').searching_adding = status;
  }


  confirmTimelineSearch(searchArgs, tag_search, searchPress) {
    let tag = searchArgs.tag;
    let date_start = searchArgs.date_start;
    let date_end = searchArgs.date_end;
    let description = searchArgs.description;
    let rank = searchArgs.rank;

    if (tag !== null || description !== "" || rank !== null || (date_start !== "" && date_end !== "")) {

      this.setState({loading: true});

      if (searchPress === true) {

        this.setState({page: 1});

        remote.getGlobal('search').page = 1;
      }

      if (tag_search === true) {
        this.setState({searching_adding: "searching"}, function() {
          remote.getGlobal('searching_adding').searching_adding = "searching";
        });
      }

      remote.getGlobal('search').view_all = false;

      remote.getGlobal('search').search_arguments.tag.searched = tag;
      remote.getGlobal('search').search_arguments.date_start.searched = date_start;
      remote.getGlobal('search').search_arguments.date_end.searched = date_end;
      remote.getGlobal('search').search_arguments.description.searched = description;
      remote.getGlobal('search').search_arguments.rank.searched = rank;
      remote.getGlobal('search').search_arguments.searchbydate.searched = searchArgs.searchbydate;

      remote.getGlobal('search').search_arguments.tag.field = tag;

      if (this.conditionTest() === true) {
        var confirm_search = confirm("Do you want to lose all unsaved changes?");
        if (confirm_search === true) {

          this.cancelEdit();

          this.searchTimeline(tag, date_start, date_end, description, rank);
        } else {
          this.setState({loading: false});
        }
      } else if (this.state.unsaved === false) {
        if (this.state.editing !== -1) {

          this.cancelEdit();
        }

        this.searchTimeline(tag, date_start, date_end, description, rank);
      }
    } else {
      this.setState({loading: false});
    }
  }

  searchTimeline(tag, date_start, date_end, description, rank) {

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

      this.setState({entries: entries});

      this.setState({counter: entries.length});

      entries = this.entriesSorter(entries, this.state.ascdesc, this.state.sorted);

      let paginate_data = this.paginateEntries(entries);

      entries = paginate_data.viewable_entries;

      this.setState({entries: entries, start: paginate_data.start});

      this.searchString(tags, date_start, date_end, description, ranks);

      if (remote.getGlobal('editing').loc !== 0) {
        setTimeout(function() {
          window.scrollTo(0, remote.getGlobal('editing').loc);
          remote.getGlobal('editing').loc = 0;
        }, 300);
      } else {
        window.scrollTo(0, 0);
      }
    }.bind(this));
  }

  searchString(tags, date_start, date_end, description, ranks) {
    let search_string = "Searching for entries ";
    let search_array = [];
    let rank = "";
    let tag = "";

    if (tags.length > 0) {
      search_array.push("tag");

      if (tags.length === 1) {
        tag = tags[0];
      } else {
        tag += "[";
        for (var i = 0, length = tags.length; i < length; i++) {
          if (i !== (length - 1)) {
            tag += tags[i] + ", ";
          } else {
            tag += tags[i];
          }
        }
        tag += "]";
      }
    }

    if (date_start !== "" && date_end !== "") {
      search_array.push("date");

      date_start = this.displayDate(date_start, "searching");
      date_end = this.displayDate(date_end, "searching");
    }

    if (description !== "") {
      search_array.push("description");
    }

    if (ranks.length > 0) {
      search_array.push("rank");

      if (ranks.length === 1) {
        rank = this.displayRank(ranks[0]);
      } else {
        rank += "[";
        for (var i = 0, length = ranks.length; i < length; i++) {
          if (i !== (length - 1)) {
            rank += this.displayRank(ranks[i]) + ", ";
          } else {
            rank += this.displayRank(ranks[i]);
          }
        }
        rank += "]";
      }
    }


    let counter = 0;

    let recursions = search_array.length;


    function innerRecursiveFunction() {

      if (search_array[counter] === "tag") {
        search_string += " tagged " + ((tags.length === 1) ? "\"" : "") + tag + ((tags.length === 1) ? "\"" : "");
      }

      if (search_array[counter] === "date") {
        search_string += " between the dates of " + date_start + " and " + date_end;
      }

      if (search_array[counter] === "description") {
        search_string += " with the words \"" + description + "\"";
      }

      if (search_array[counter] === "rank") {
        search_string += " ranked " + ((ranks.length === 1) ? "\"" : "") + rank + ((ranks.length === 1) ? "\"" : "");
      }

      if (counter < (recursions - 2)) {
        search_string += ", ";
      }

      if (counter === (recursions - 2)) {
        if (recursions === 2) {
          search_string += " and ";
        } else {
          search_string += ", and ";
        }
      }

      if (counter === (recursions - 1)) {
        search_string += ".";
      }


      counter = counter + 1;


      if (counter < recursions) {
        innerRecursiveFunction();
      }
    }


    innerRecursiveFunction();

    this.setState({search_message: search_string, loading: false});
  }



  handle_body_Changes(event) {

    this.setState({unsaved: true, editor: event.editor.getData() });

    remote.getGlobal('editing').editing_entry.body = event.editor.getData();
    remote.getGlobal('editing').unsaved = true;
    remote.getGlobal('enterTracker').component_tracker = "edit";
  }


  handle_date_Change(date) {

    let state = Object.assign({}, this.state);

    state.entries[state.editing].display_date = date;

    state.unsaved = true;

    this.setState(state);

    remote.getGlobal('editing').editing_entry.display_date = date;
    remote.getGlobal('editing').unsaved = true;
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "edit";
  }

  handle_rank_Change(event) {

    let state = Object.assign({}, this.state);

    state.entries[state.editing].rank = event.target.value;

    state.unsaved = true;

    this.setState(state);

    remote.getGlobal('editing').editing_entry.rank = event.target.value;
    remote.getGlobal('editing').unsaved = true;
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "edit";
  }

  handle_tags_Change() {

    this.setState({tags: this.tag.value, unsaved: true});
    remote.getGlobal('editing').unsaved = true;
    remote.getGlobal('editing').tags = this.tag.value;
  }

  handle_tracker_tags_onClick() {
    remote.getGlobal('enterTracker').tag_insert_tracker = true;
    remote.getGlobal('enterTracker').component_tracker = "edit";
  }


  displayingEditableTags(id) {

    let ran_num = new Date().getTime();

    return this.state.entries[id].tags.map((entry, i) => {
      return (
        <span key={"tag_span" + ran_num + i}>
          {this.state.entries[id].tags[i]} <button className="button" onClick={this.deleteTag.bind(this, id, i)}>X</button> {" "}
        </span>
      )
    });
  }


  deleteTag(id, i) {

    let state = Object.assign({}, this.state);

    state.entries[id].tags.splice(i, 1);

    state.unsaved = true;

    this.setState(state);

    remote.getGlobal('editing').editing_entry.tags = state.entries[id].tags;
    remote.getGlobal('editing').unsaved = true;
    remote.getGlobal('enterTracker').tag_insert_tracker = false;
    remote.getGlobal('enterTracker').component_tracker = "edit";
  }


  addTag() {

    let state = Object.assign({}, this.state);
    let id = state.id;

    let new_tag = this.tag.value;

    new_tag = Utilities.keepAllLettersNumbersSpacesDashes(new_tag);

    new_tag = new_tag.trim();

    if (new_tag !== "") {

      let tags = state.entries[id].tags;

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

        this.tag.value = "";

        this.tag.blur();

        remote.getGlobal('editing').editing_entry.tags = tags;
        remote.getGlobal('editing').unsaved = true;
        remote.getGlobal('editing').tags = "";
        remote.getGlobal('enterTracker').tag_insert_tracker = false;
        remote.getGlobal('enterTracker').component_tracker = "edit";
      } else {
        alert("You have already entered that tag for this entry.");
      }
    } else {
      remote.getGlobal('enterTracker').component_tracker = "edit";
      this.saveEntry();
    }
  }

  entriesSorter(entries, ascdesc, sort_symbol, theader_call) {
    let sortEntries = () => {

      if (theader_call === true) {
        this.setState({ ascdesc: ascdesc, sorted: sort_symbol }, function() {
          this.viewAll();
        });
      } else {
        if (sort_symbol === "" || sort_symbol === "be_d") {
          entries.sort(function(a, b) {
            if (ascdesc === "ASC") {

              if (a.entered > b.entered) {
                return -1;
              }
              if (b.entered > a.entered) {
                return 1;
              }

              return 0;
            } else {

              if (a.entered > b.entered) {
                return 1;
              }
              if (b.entered > a.entered) {
                return -1;
              }

              return 0;
            }
          });
        } else if (sort_symbol === "bd_a" || sort_symbol === "bd_d") {
          entries.sort(function(a, b) {
            if (ascdesc === "ASC") {

              if (a.date > b.date) {
                return -1;
              }
              if (b.date > a.date) {
                return 1;
              }

              if (a.rank > b.rank) {
                return -1;
              }
              if (b.rank > a.rank) {
                return 1;
              }

              return 0;
            } else {

              if (a.date > b.date) {
                return 1;
              }
              if (b.date > a.date) {
                return -1;
              }

              if (a.rank > b.rank) {
                return -1;
              }
              if (b.rank > a.rank) {
                return 1;
              }

              return 0;
            }
          });
        } else if (sort_symbol === "br_a" || sort_symbol === "br_d") {
          entries.sort(function(a, b) {
            if (ascdesc === "ASC") {

              if (a.rank > b.rank) {
                return -1;
              }
              if (b.rank > a.rank) {
                return 1;
              }

              if (a.date > b.date) {
                return -1;
              }
              if (b.date > a.date) {
                return 1;
              }

              return 0;
            } else {

              if (a.rank < b.rank) {
                return -1;
              }
              if (b.rank < a.rank) {
                return 1;
              }

              if (a.date > b.date) {
                return -1;
              }
              if (b.date > a.date) {
                return 1;
              }

              return 0;
            }
          });
        }

        return entries;
      }

      remote.getGlobal('search').ascdesc = ascdesc;
      remote.getGlobal('search').sorted = sort_symbol;
    }

    if (this.conditionTest() === true) {
      let confirm_search = confirm("Do you want to lose all unsaved changes?");
      if (confirm_search === true) {

        this.cancelEdit();

        return sortEntries();
      }
    } else {
      if (this.state.editing !== -1) {

        this.cancelEdit();
      }

      return sortEntries();
    }
  }


  displayingTags(tags) {

    let ran_num = new Date().getTime();

    return tags.map((tag, i) => {
      return (
        <span key={"tag_span" + ran_num + i}>
          <a onClick={this.confirmTimelineSearch.bind(this, {tag: [{value: tag, label: tag}], date_start: "", date_end: "", description: "", rank: null, searchbydate: false}, true, true)}>{tag}</a> {" "}
        </span>
      )
    });
  }

  displayDate(date, ent_occ) {
    let the_date = new Date(date);
    let options = {};
    if (ent_occ === "entered") {
      options = { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
    } else if (ent_occ === "occurred") {
      options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    } else if (ent_occ === "searching") {
      options = { year: "numeric", month: "long", day: "numeric" };
    } else if (ent_occ === "editing") {
      options = {};
    }

    return the_date.toLocaleDateString("en-US", options);
  }

  displayRank(rank) {
    if (rank === "5") {
      return "Very Important";
    }
    if (rank === "4") {
      return "Important";
    }
    if (rank === "3") {
      return "Average";
    }
    if (rank === "2") {
      return "Less Important";
    }
    if (rank === "1") {
      return "Least Important";
    }
  }

  scrollTop() {
    window.scrollTo(0, 0);
  }

  handlePageChange(page) {
    if (this.conditionTest() === true) {
      var confirm_search = confirm("Do you want to lose all unsaved changes?");
      if (confirm_search === true) {

        this.cancelEdit();

        this.viewAll(false, false, page);
      }
    } else {
      if (this.state.editing !== -1) {

        this.cancelEdit();
      }

      this.viewAll(false, false, page);
    }
  }

  createPageNumbers() {
    const { counter, page, per_page, entries } = this.state;
    let entries_length = entries.length;
    let pages = [];
    for (var i = 1, length = Math.ceil(counter / per_page); i <= length; i++) {
      pages.push(i);
    }
    let pages_length = pages.length;
    let pagination = [];

    if ((entries_length >= per_page && page === 1) || (counter > per_page && page > 1)) {

    	if (page > 2) {
        pagination.push({ page: 1, status: "First", style: "default" });
    	}

    	for (var i = 1; i <= (page + 1) && i <= pages_length; i++) {
    		if ((page - 1) <= i) {
          if (page === i) {
            pagination.push({ page: i, status: "normal", style: "selected" });
          } else {
            pagination.push({ page: i, status: "normal", style: "default" });
          }
    		}
    	}


    	if (page < (pages_length - 1)) {
    		for (var i = pages_length; i <= pages_length; i++) {
          pagination.push({ page: i, status: "Last", style: "default" });
    		}
    	}
    }

    return pagination.map((pg, i) => {
      return (
        <span key={"pagination" + i}>
          { pg.status === "Last" ? "... " : "" }
          { pg.style === "default" ? <a onClick={this.handlePageChange.bind(this, pg.page)}>{ pg.status === "normal" ? pg.page : pg.status }</a>
            : <b>{ pg.page }</b> }
          {' '}
          { pg.status === "First" ? "... " : "" }
        </span>
      )
    });
  }

  paginateEntries(entries, page) {


    if (isNaN(page) === true)  {
      page = this.state.page;
    }

    let per_page = this.state.per_page;

    let start = (page > 1) ? (page * per_page) - per_page : 0;

    let viewable_entries = [];
    for (var i = 0, length = entries.length; i < length; i++) {
      if (i < (start + per_page) && i >= start) {
        viewable_entries.push(entries[i]);
      }
    }

    return { viewable_entries: viewable_entries, start: start }
  }

  mapEntries() {
    const { editor } = this.state;
    return this.state.entries.map((entry, i) => {
      return (
        <tr key={"entry" + i} id={"entry" + i}>
          { this.state.editing == i ?
            <td>
              <table className="entry">
                <tbody>
                  <tr>
                    <td>
                      EDITING:
                      <Editor editorData={editor} handleEditorChange={this.handle_body_Changes.bind(this)} theRef={CKEditor => this.CKEditor = CKEditor} cssTemplate={this.props.cssTemplate}></Editor>
                      <br/>
                    </td>
                  </tr>
                  <tr>
                    <td>EDITING: {this.displayingEditableTags(this.state.editing)} <input ref={tag => this.tag = tag} onBlur={this.handle_tags_Change.bind(this)} defaultValue={this.state.tags} onClick={this.handle_tracker_tags_onClick.bind(this)} /> <button className="button" onClick={this.addTag.bind(this)}>Add Tag</button></td>
                  </tr>
                  <tr>
                    <td>
                      EDITING:{' '}
                      <select ref={rank => this.rank = rank} onBlur={this.handle_rank_Change.bind(this)} defaultValue={this.state.entries[i].rank}>
                        <option value="0"></option>
                        <option value="5">Very Important</option>
                        <option value="4">Important</option>
                        <option value="3">Average</option>
                        <option value="2">Less Important</option>
                        <option value="1">Least Important</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>EDITING: <DatePicker selected={this.state.entries[i].display_date} onChange={this.handle_date_Change.bind(this)} /></td>
                  </tr>
                  <tr>
                    <td>
                      <button className="button" onClick={this.saveEntry.bind(this)}>Save</button> <button className="button" onClick={this.cancelEdit.bind(this, true)}>Cancel</button> <button className="button" onClick={this.deleteEdit.bind(this, i)}>Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          :
            <td>
              <table className="entry">
                <tbody>
                  <tr>
                    <td>{this.displayingTags(entry.tags)}</td>
                  </tr>
                  <tr>
                    <td>{this.displayDate(entry.date, "occurred")}</td>
                  </tr>
                  <tr>
                    <td>{ entry.rank !== "0" ? this.displayRank(entry.rank) : ""}</td>
                  </tr>
                  <tr>
                    <td>
                      <hr/>
                        <div>{ReactHtmlParser(entry.body)}</div>
                      <hr/>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="small_text"><b>Entered:</b> {this.displayDate(entry.entered, "entered")}</span> <div className="edit_button"><button className="button" onClick={this.editEntry.bind(this, i, entry._id, false)}>Edit</button></div></td>
                  </tr>
                </tbody>
              </table>
            </td>
          }
        </tr>
      )
    });
  }


    tableHead() {
      return (
        <tr>
          <th>
            By Occurred Date: <button className="button" onClick={this.entriesSorter.bind(this, [], "ASC", "bd_a", true)}>↑</button> <button className="button" onClick={this.entriesSorter.bind(this, [], "DESC", "bd_d", true)}>↓</button>
          </th>
          <th>
            By Entered Date: <button className="button" onClick={this.entriesSorter.bind(this, [], "ASC", "", true)}>↑</button> <button className="button" onClick={this.entriesSorter.bind(this, [], "DESC", "be_d", true)}>↓</button>
          </th>
          <th>
            By Ranking: <button className="button" onClick={this.entriesSorter.bind(this, [], "ASC", "br_a", true)}>↑</button> <button className="button" onClick={this.entriesSorter.bind(this, [], "DESC", "br_d", true)}>↓</button>
          </th>
        </tr>
      )
    }

  render() {
    const { searching_adding, counter, search_message, loading, cancel, entries,
      page, per_page, total, start, all_tags } = this.state;

    if (loading === true) {
      return (
        <div>Loading...</div>
      )
    } else if (loading === false) {
      return (
        <div>
          {
            searching_adding === "searching" && total > 0 ?
            <Search entries_shortterm={this.props.entries_shortterm} viewSearch={this.viewSearchAdd.bind(this, "none")} confirmTimelineSearch={this.confirmTimelineSearch.bind(this)} displayDate={this.displayDate} searchMessage={search_message} all_tags={all_tags} cssTemplate={this.props.cssTemplate}></Search>
            : <div>
                {
                  total === 0 && searching_adding === "searching" ? <div>You must first add some entries before conducting a search.</div> : ""
                }
              </div>
          }
          {
            searching_adding === "exporting" && total > 0 ?
            <Export entries_shortterm={this.props.entries_shortterm} viewExport={this.viewSearchAdd.bind(this, "none")} entriesSorter={this.entriesSorter.bind(this)} displayRank={this.displayRank} app_path={this.props.app_path}></Export>
            : <div>
                {
                  total === 0 && searching_adding === "exporting" ? <div>You must first add some entries before exporting their data.</div> : ""
                }
              </div>
          }
          {
            searching_adding === "adding" || (total === 0 && cancel === false) ?
            <Add addEntry={this.addEntry.bind(this)} viewAdd={this.viewSearchAdd.bind(this, "none")} cssTemplate={this.props.cssTemplate}></Add>
            : ""
          }
          { total > 0 ?
          <div>
            <b>{ counter.toLocaleString('en-US', {minimumFractionDigits: 0}) } entries{counter > 0 ? <span> (viewing {start + 1} - {start + per_page < counter ? start + per_page : counter}):</span> : ":"}</b> { ' ' }
            { counter < total ? <button className="button" onClick={this.viewAllEntries.bind(this)}>View All Entries</button> : "" }
            <br/>
            { this.createPageNumbers() }
            { counter > 0 ?
            <table className="theader">
              <thead>
                {this.tableHead()}
              </thead>
            </table>
              : "" }
            <table className="entry_viewer">
              <tbody>
                {this.mapEntries()}
              </tbody>
            </table>
            { this.createPageNumbers() }
            <br/>
            { counter > 3 || (searching_adding === "searching" && counter > 0 || searching_adding === "adding" && counter > 0 || searching_adding === "exporting" && counter > 1) ? <button className="button" onClick={this.scrollTop}>Top</button> : "" }
          </div>
          : <p>
              You have not added any entries to your Timeline. Add some.
            </p>
          }
        </div>
      )
    }
  }
}

export default ViewTimeline;
