import React, {Component} from 'react';
import CKEditor from 'ckeditor4-react';

class Editor extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <CKEditor
          data={this.props.editorData}
          type="classic"
          config={ {
            toolbar: [
              { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike'] },
              { name: 'document', items: ['Undo', 'Redo', 'Source'] },
              { name: 'styles', items: ['Format'] }
            ],
            tabSpaces: 4,
            format_tags: 'p;h1;h2;h3;h4;h5;h6',
            removeButtons: 'Anchor,About',
            uiColor: this.props.cssTemplate.theader_background
          } }
          onBlur={this.props.handleEditorChange}
          ref={this.props.theRef}
        />
      </div>
    )
  }
}

export default Editor;
