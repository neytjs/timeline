import XRegExp from 'xregexp';

class Utilities {

  static arrayComparer(search_lyrics, songs_lyrics, property_name) {
    let search_lyrics_length = search_lyrics.length;
    let songs_lyrics_length = songs_lyrics.length;

    if (search_lyrics_length > 0) {
      let matches = [];

      for (var j = 0; j < songs_lyrics_length; j++) {

        let song_string = "";

        if (typeof songs_lyrics[j][property_name] !== "string") {
          song_string = songs_lyrics[j][property_name].join(" ");
        } else {
          song_string = songs_lyrics[j][property_name];
        }

        var searched = search_lyrics.join(" ");
        searched = searched.toLowerCase();
        searched = searched.trim();
        song_string = song_string.replace(/(<([^>]+)>)/ig, " ");
        song_string = song_string.replace(/&nbsp;/ig, " ");
        song_string = song_string.replace(/\n/ig, " ");
        song_string = song_string.replace(/&quot;/ig, "");
        song_string = song_string.replace(/&ldquo;/ig, "");
        song_string = song_string.replace(/&rdquo;/ig, "");
        song_string = song_string.replace(/&#39;/ig, "");
        song_string = song_string.replace(/&lsquo;/ig, "");
        song_string = song_string.replace(/&rsquo;/ig, "");
        song_string = this.keepAllLettersNumbersSpacesQuotes(song_string);
        song_string = song_string.toLowerCase();
        song_string = song_string.trim();

        if (property_name === "body" || property_name === "tags") {
          let searchedRegExp = XRegExp(`(^|[^\\pL])(${searched})(?![\\pL])`, 'gi');

          if (searchedRegExp.test(song_string) === true) {

            matches.push(songs_lyrics[j]);
          }
        } else {
          let searchedRegExp = XRegExp(`(^|[^\\pL])(${searched})(?![\\pL])`, 'gi');

          if (searchedRegExp.test(song_string) === true) {

            matches.push(songs_lyrics[j]);
          }
        }
      }

      return matches;
    } else {
      return songs_lyrics;
    }
  }


  static arrayComparerFindAll(search_lyrics, songs_lyrics, property_name) {
    let search_lyrics_length = search_lyrics.length;
    let songs_lyrics_length = songs_lyrics.length;

    if (search_lyrics_length > 0) {
      let matches = [];

        for (var j = 0; j < songs_lyrics_length; j++) {

          let counter = 0;

          for (var i = 0; i < search_lyrics_length; i++) {

            let song_string = "";
            let search_string = "";

            if (typeof songs_lyrics[j][property_name] !== "string") {
              song_string = songs_lyrics[j][property_name].join(" ");
            } else {
              song_string = songs_lyrics[j][property_name];
            }

            var searched = search_lyrics[i];
            searched = searched.toLowerCase();
            searched = searched.trim();
            song_string = song_string.replace(/(<([^>]+)>)/ig, " ");
            song_string = song_string.replace(/&nbsp;/ig, " ");
            song_string = song_string.replace(/\n/ig, " ");
            song_string = song_string.replace(/&quot;/ig, "");
            song_string = song_string.replace(/&ldquo;/ig, "");
            song_string = song_string.replace(/&rdquo;/ig, "");
            song_string = song_string.replace(/&#39;/ig, "");
            song_string = song_string.replace(/&lsquo;/ig, "");
            song_string = song_string.replace(/&rsquo;/ig, "");
            song_string = this.keepAllLettersNumbersSpacesQuotes(song_string);
            song_string = song_string.toLowerCase();
            song_string = song_string.trim();

            let searchedRegExp = XRegExp(`(^|[^\\pL])(${searched})(?![\\pL])`, 'gi');

            if (searchedRegExp.test(song_string) === true) {

              counter = counter + 1;


              if (counter === search_lyrics_length) {

                matches.push(songs_lyrics[j]);
              }
            }
          }
        }

        return matches;
      } else {
        return songs_lyrics;
      }
  }


  static arrayComparerFindAny(search_lyrics, songs_lyrics, property_name) {
    let search_lyrics_length = search_lyrics.length;
    let songs_lyrics_length = songs_lyrics.length;

    if (search_lyrics_length > 0) {
      let matches = [];

        for (var j = 0; j < songs_lyrics_length; j++) {

          for (var i = 0; i < search_lyrics_length; i++) {
            if (songs_lyrics[j][property_name] === search_lyrics[i]) {
              matches.push(songs_lyrics[j]);
            }
          }
        }

        return matches;
      } else {
        return songs_lyrics;
      }
  }


  static customSplit(strng) {
    let test_strng = this.keepAllLettersNumbersQuotes(strng);

    if (test_strng.length > 0) {

      strng = this.keepAllLettersNumbersSpacesQuotes(strng);

      strng = strng.toLowerCase();

      strng = strng.trim();

      let reg_exp = /"(.*?)"/g;

      let quotes = strng.match(reg_exp) ? strng.match(reg_exp) : [];
        quotes = quotes.join();
        quotes = this.keepAllLettersNumbersSpaces(quotes);
        quotes = quotes.trim();
        quotes = quotes.split(" ");

        if (quotes[0] === "") {
          quotes = [];
        }

      let notquotes = strng.replace(/"(.*?)"/g, "");
        notquotes = notquotes.trim();
        notquotes = notquotes.split(" ");

        if (notquotes[0] === "") {
          notquotes = [];
        }

      return { quotes: quotes, notquotes: notquotes };
    } else {
      return { quotes: [], notquotes: [] };
    }
  }


  static datePruning(entries, min, max) {
    let entries_length = entries.length;
    let matches = [];

    if (Number.isInteger(min) === true && Number.isInteger(max) === true) {

      for (var i = 0; i < entries_length; i++) {

        let entry_date = new Date(entries[i].date);
        entry_date = entry_date.getTime();

        if (entry_date >= min && entry_date <= max) {

          matches.push(entries[i]);
        }
      }

      return matches;
    } else {
      return entries;
    }
  }


  static occurrenceCounter(the_array, test_value) {

    if (the_array.length > 0) {

      var occurrences = [];

      var counter = 0;

      var new_array = [];

      for (var i = 0; i < the_array.length; i++) {
        new_array.push( Object.assign({}, the_array[i]) );
      }

      var nwarlen = the_array.length;


      function recursiveCounter() {

        occurrences.push(new_array[0]);

        new_array.splice(0, 1);

        var last_occurrence_element = occurrences.length - 1;

        var last_occurrence_entry = occurrences[last_occurrence_element][test_value];

        occurrences[last_occurrence_element].quantity = 0;

        var occur_counter = 0;

        for (var i = 0; i < occurrences.length; i++) {
          if (occurrences[i][test_value] === last_occurrence_entry) {

            occurrences[i].quantity = occurrences[i].quantity + 1;

            occur_counter = occur_counter + 1;
          }
        }

        if (occur_counter > 1) {
          occurrences.splice(last_occurrence_element, 1);
        }


        counter = counter + 1;


        if (counter < nwarlen) {
          recursiveCounter();
        }
      }


      recursiveCounter();


      return occurrences;
    }
  }


  static arrayShuffler(the_array) {

  	Array.prototype.shuffle = function (old_index, new_index) {
  		this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  		return this[new_index];
  	};


    let shuffled_array = [];

    let array_length = the_array.length;

    let numbers = [];

    for (var i = 0; i < array_length; i++) {
      numbers.push(i);
    }

    let array_counter = array_length;

    let counter = 0;


    function randomize() {

      array_counter = array_counter - 1;

      counter = counter + 1;

      let random = Math.round(array_counter * Math.random());

      let num = numbers.shuffle(random, array_counter);

      shuffled_array.push(the_array[num]);

      if (counter < array_length) {
        randomize();
      }
    }


    randomize();

    return shuffled_array;
  }


  static doubleShuffler(first_array, second_array) {
  	Array.prototype.shuffle = function (old_index, new_index) {
  		this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  		return this[new_index];
  	};


    let first_shuffled_array = [];
    let second_shuffled_array = [];

    let array_length = first_array.length;

    let numbers = [];

    for (var i = 0; i < array_length; i++) {
      numbers.push(i);
    }

    let array_counter = array_length;

    let counter = 0;


    function randomize() {

      array_counter = array_counter - 1;

      counter = counter + 1;

      let random = Math.round(array_counter * Math.random());

      let num = numbers.shuffle(random, array_counter);

      first_shuffled_array.push(first_array[num]);

      second_shuffled_array.push(second_array[num])

      if (counter < array_length) {
        randomize();
      }
    }


    randomize();

    return { first_array: first_shuffled_array, second_array: second_shuffled_array };
  }


  static allTags(entries) {
    let tags = {};
    let all_tags = [];
    for (var i = 0, length = entries.length; i < length; i++) {
      for (var j = 0, jlength = entries[i].tags.length; j < jlength; j++) {
        tags[entries[i].tags[j].toLowerCase()] = entries[i].tags[j];
      }
    }
    for (var tag in tags) {
      all_tags.push(tags[tag]);
    }
    all_tags.sort(function(a, b) {

      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }
      if (b.toLowerCase() > a.toLowerCase()) {
        return -1;
      }
    });
    return all_tags;
  }

  static createTagOptions(all_tags) {
    let tag_options = [];
    for (var i = 0, length = all_tags.length; i < length; i++) {
      tag_options.push({ value: all_tags[i], label: all_tags[i] });
    }
    return tag_options;
  }

  static keepAllLettersNumbers(string) {
    if (typeof string !== 'string') {
      string = "";
    }
    return XRegExp.replace(string, XRegExp('[^\\s"\\p{N}\\p{L}-]', 'gi'), "");
  }

  static keepAllLettersNumbersQuotes(string) {
    if (typeof string !== 'string') {
      string = "";
    }
    return XRegExp.replace(string, XRegExp('[^\\"\\p{N}\\p{L}-]', 'gi'), "");
  }

  static keepAllLettersNumbersSpaces(string) {
    if (typeof string !== 'string') {
      string = "";
    }
    return XRegExp.replace(string, XRegExp('[^\\s\\p{N}\\p{L}-]', 'gi'), "");
  }

  static keepAllLettersNumbersSpacesDashes(string) {
    if (typeof string !== 'string') {
      string = "";
    }
    return XRegExp.replace(string, XRegExp('[^\\s\\-\\p{N}\\p{L}-]', 'gi'), "");
  }

  static keepAllLettersNumbersSpacesQuotes(string) {
    if (typeof string !== 'string') {
      string = "";
    }
    return XRegExp.replace(string, XRegExp('[^\\s"\\p{N}\\p{L}-]', 'gi'), "");
  }

  static fileCorruptionCheck(entries) {
    let corrupt = false;
    let counter = [];

    for (var i = 0, length = entries.length; i < length; i++) {
      if (!entries[i].hasOwnProperty("body") === true || !entries[i].hasOwnProperty("date") === true || !entries[i].hasOwnProperty("display_date") === true || !entries[i].hasOwnProperty("tags") === true || !entries[i].hasOwnProperty("rank") === true || !entries[i].hasOwnProperty("entered") === true || !entries[i].hasOwnProperty("_id") === true) {
        counter.push(1);
      }
    }

    if (counter.length > 0) {
      corrupt = true;
    }

    return corrupt;
  }

  static reactSelectStyles(cssTemplate) {
    return {
      control: (provided, state) => ({
        ...provided,
        width: 300,
        background: cssTemplate.body_background_color,
        borderRadius: "3px",
        borderColor: cssTemplate.body_color,
        '&:hover': {
          borderColor: cssTemplate.body_color,
          background: cssTemplate.entry_background
        },
        boxShadow: state.isFocused ? `0 0 0 1px ${cssTemplate.a_color}` : null,
        cursor: "pointer"
      }),
      menu: (provided) => ({
        ...provided,
        width: 300,
        marginTop: 0,
        background: cssTemplate.body_background_color
      }),
      input: (provided) => ({
        ...provided,
        color: cssTemplate.body_color
      }),
      noOptionsMessage: (provided) => ({
        ...provided,
        width: 300,
        color: cssTemplate.body_color
      }),
      placeholder: (provided) => ({
        ...provided,
        color: cssTemplate.body_color
      }),
      clearIndicator: (provided, state) => ({
        ...provided,
        color: state.isFocused ? cssTemplate.body_color : cssTemplate.body_color,
        '&:hover': {
          color: state.isFocused ? cssTemplate.a_color : cssTemplate.a_color,
        }
      }),
      dropdownIndicator: (provided, state) => ({
        ...provided,
        color: state.isFocused ? cssTemplate.body_color : cssTemplate.body_color,
        '&:hover': {
          color: state.isFocused ? cssTemplate.a_color : cssTemplate.a_color,
        }
      }),
      indicatorSeparator: (provided) => ({
        ...provided,
        background: cssTemplate.body_color
      }),
      loadingIndicator: (provided) => ({
        ...provided,
        background: cssTemplate.body_color
      }),
      multiValue: (provided) => ({
        ...provided,
        background: cssTemplate.body_color
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: cssTemplate.entry_background
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: cssTemplate.entry_background,
        '&:hover': {
          color: cssTemplate.body_color,
          background: cssTemplate.a_color
        }
      }),
      option: (provided, state) => ({
        ...provided,
        width: 300,
        cursor: "pointer",
        background: state.isFocused ? cssTemplate.entry_background : 'transparent',
        '&:hover': {
          background: cssTemplate.entry_background
        },
        '&:active': {
          background: cssTemplate.theader_background
        }
      }),
      valueContainer: (provided) => ({
        ...provided,
        width: 300
      })
    }
  }
}

export default Utilities;
