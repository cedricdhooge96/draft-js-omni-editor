import 'react-app-polyfill/ie11';
import React, { Fragment } from 'react';
import * as ReactDOM from 'react-dom';
import { CompositeDecorator, EditorState } from 'draft-js';
import MentionPlugin, { Suggestion } from '../src/plugins/mention/MentionPlugin';
import { OmniEditor } from '../src';

function App() {
    const HANDLE_REGEX = /@[\w]+/g;

    const handleStrategy = (contentBlock, callback, contentState) => {
        findWithRegex(HANDLE_REGEX, contentBlock, callback);
    };

    const findWithRegex = (regex, contentBlock, callback) => {
        const text = contentBlock.getText();
        let matchArr, start;
        while ((matchArr = regex.exec(text)) !== null) {
            start = matchArr.index;
            callback(start, start + matchArr[0].length);
        }
    };

    const HandleSpan = (props) => {
        return (
            <span
                style={styles.handle}
                data-offset-key={props.offsetKey}
            >
                {props.children}
            </span>
        );
    };

    const compositeDecorator = new CompositeDecorator(
        [
            {
                strategy: handleStrategy,
                component: HandleSpan,
            }
        ]
    );

    const styles = {
        handle: {
            color: 'rgba(98, 177, 254, 1.0)',
            direction: 'ltr',
            unicodeBidi: 'bidi-override',
        },
    };

    const [editorState, setEditorState] = React.useState(EditorState.createEmpty(compositeDecorator));

    const suggestionView = (suggestion) => {
        return (
            <Fragment>
                {suggestion.name}
            </Fragment>
        )
    };

    const suggestions = [
        { name: 'Cedric' },
        { name: 'Thomas' },
        { name: 'Toon' },
        { name: 'Jurriaan' },
    ];

    const suggestionFilter = (suggestion, text) => {
        return suggestion.name.toLowerCase().indexOf(text.toLowerCase()) !== -1;
    };

    const loadSuggestions = new Promise<Suggestion[]>(
        (resolve) => {
            setTimeout(
                () => {
                    resolve(suggestions);
                },
                1000
            );
        }
    );

    const mentionPlugin = new MentionPlugin(
        '@',
        loadSuggestions,
        suggestionView,
        suggestionFilter
    );

    return (
        <div className="App">
            <div className="EditorWrapper">
                <OmniEditor
                    editorState={editorState}
                    onChange={setEditorState}

                    // Plugins
                    plugins={
                        [
                            mentionPlugin
                        ]
                    }

                    shouldFocus={true}
                />
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
