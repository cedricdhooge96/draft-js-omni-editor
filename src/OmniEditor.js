import { Editor, EditorState, getDefaultKeyBinding } from 'draft-js';
import React from 'react';
import * as PropTypes from 'prop-types';
import './OmniEditor.css';
import OmniEditorKeyCommandMap from './OmniEditorKeyCommandMap';

const OmniEditor = (props) => {
    const editor = React.useRef(null);
    const [plugins, setPlugins] = React.useState(props.plugins);

    const onChange = (editorState) => {
        props.onEditorStateChange(editorState);

        // Wait for the DOM to be re-rendered from the editor state change before updating the plugins.
        setTimeout(
            () => {
                setPlugins(
                    plugins.map(
                        (plugin) => {
                            return plugin.onChange(editorState);
                        }
                    )
                );
            },
            0
        )
    };

    React.useEffect(
        () => {
            if (props.shouldFocus) {
                editor.current.focus();
            }
        },
        [
            props.shouldFocus
        ]
    );

    const myKeyBindingFn = (event) => {
        let shouldTriggerCustomKeyCommand = false;

        plugins.forEach(
            (plugin) => {
                const shouldTrigger = plugin.shouldTriggerCustomKeyCommand();

                if (shouldTrigger) {
                    shouldTriggerCustomKeyCommand = true;
                }
            }
        );

        if (!shouldTriggerCustomKeyCommand) {
            return getDefaultKeyBinding(event);
        }

        if (OmniEditorKeyCommandMap[event.keyCode]) {
            return OmniEditorKeyCommandMap[event.keyCode];
        }

        return getDefaultKeyBinding(event);
    };

    const handleKeyCommand = (command, editorState) => {
        let isHandled = false;

        const updatedPlugins = plugins.map(
            (plugin) => {
                const {
                    didPluginHandleCommand,
                    updatedPlugin,
                    updatedEditorState,
                } = plugin.handleKeyCommand(command, editorState);

                if (didPluginHandleCommand) {
                    isHandled = true;
                }

                if (updatedEditorState) {
                    props.onEditorStateChange(updatedEditorState);
                }

                return updatedPlugin;
            }
        );

        if (isHandled) {
            setPlugins(updatedPlugins);
        }

        return isHandled ? 'handled' : 'not-handled';
    };

    return (
        <div className="OmniEditor">
            {
                plugins.map(
                    (plugin) => {
                        return plugin.getPortalElement(props.editorState, props.onEditorStateChange);
                    }
                )
            }
            <Editor
                ref={editor}
                editorState={props.editorState}
                onChange={onChange}
                keyBindingFn={myKeyBindingFn}
                handleKeyCommand={handleKeyCommand}
            />
        </div>
    );
};

OmniEditor.propTypes = {
    // EditorState + handler
    editorState: PropTypes.instanceOf(EditorState).isRequired,
    onEditorStateChange: PropTypes.func.isRequired,

    // Plugins
    plugins: PropTypes.array,

    // Extra editor props
    shouldFocus: PropTypes.bool
};

export default OmniEditor;
