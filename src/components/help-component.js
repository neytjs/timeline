import React, {Component} from 'react';

class Help extends Component {
  render() {
    return (
      <div className="entry">
        <h3>FAQ</h3>
        <p>
          <b>What is Timeline?</b>
          <br/>
          Timeline is a special purpose text editor designed to organize events by tags and then analyze the significance of events over time using ranking scores.
        </p>
        <p>
          <b>How do I add an entry?</b>
          <br/>
          Click 'Timeline' and then 'Add Entries'.
        </p>
        <p>
          <b>How do I search for an entry or entries?</b>
          <br/>
          Click 'Timeline' and then 'Search Entries'.
        </p>
        <p>
          <b>How do I edit an entry?</b>
          <br/>
          Click the 'Edit' button on a given entry, then make the desired changes and press the 'Save' button.
        </p>
        <p>
          <b>Do I always have to save my Timeline after making changes?</b>
          <br/>
          No. You only have to click 'Save As...' when saving your project for the first time, which is required for long-term data storage. After that, all entries and edits are automatically saved.
        </p>
        <p>
          <b>How can I change the maximum amount of entries displayed per page?</b>
          <br/>
          Click 'Timeline' and then 'Settings'. Enter a new desired amount of entries per page and then press the 'Save' button.
        </p>
        <p>
          <b>Why should I rank the importance of my entries?</b>
          <br/>
          Ranking your entries in terms of their importance is useful for organizing and searching through them. If you only want to study the most significant events in a certain area you can then choose to only search through and return the entries that you ranked as 'Important' or 'Very Important'. The importance rankings are also used for generating charts using the Analysis feature.
          <br/><br/>
        	Note, each ranking corresponds with a rating number between one and five, with 'Very Important' being five and 'Least Important' being one. The number is used to calculate cumulative ratings. Unranked entries also have a rating number of zero.
       </p>
        <p>
          <b>What is the purpose of the Analysis feature?</b>
          <br/>
          The Analysis feature allows you to display on a line chart the cumulative ratings for entries over a specific time frame. You can also limit the search to a specific tag or tags. This feature is intended to help you visualize your data, allowing you to pinpoint certain time periods when more or less significant events were happening.
        </p>
        <p>
          <b>What is the difference between 'Occurred Date' and 'Entered Date'?</b>
          <br/>
          'Occurred Date' is the date that a specific event happened that you wrote an entry about. You select this date using the calendar feature when adding or editing an entry. The 'Entered Date' is a timestamp from when you first added the entry into your Timeline.
        </p>
        <p>
          <b>I do not like the default Timeline theme, how can I change it?</b>
          <br/>
          Click 'Timeline' and then 'Settings'. Select a different color theme and then press the 'Save' button.
        </p>
        <p>
          <b>Can I view the total word count for all my entries?</b>
          <br/>
          Yes. Click 'Timeline' and then 'Metrics' to view your word count and other entries-related stats (like most common tags, oldest and newest entry dates, etc).
        </p>
        <p>
          <b>Can I convert my Timeline data into other file formats?</b>
          <br/>
          Yes. Click 'Timeline' and then 'Export Data'. You can choose to export and convert your Timeline's data into either TXT or JSON format. The export feature will then give you a file path to where the new .txt or .json file was stored.
        </p>
      </div>
    )
  }
}

export default Help;
