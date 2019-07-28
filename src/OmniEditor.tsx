import { Editor, EditorState, getDefaultKeyBinding } from 'draft-js';
import React, { Component, KeyboardEvent } from 'react';
import * as PropTypes from 'prop-types';
import OmniEditorKeyCommandMap from './OmniEditorKeyCommandMap';
import EditorPlugin from 'plugins/EditorPlugin';

interface OmniEditorProps {
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
    plugins: EditorPlugin[];
    shouldFocus: boolean;
}

interface OmniEditorState {
    plugins: EditorPlugin[]
}

class OmniEditor extends Component<OmniEditorProps, OmniEditorState> {
    private editor: any;

    constructor(props: OmniEditorProps) {
        super(props);

        this.state = {
            plugins: props.plugins,
        };
    }

    static propTypes = {
        editorState: PropTypes.instanceOf(EditorState).isRequired,
        onChange: PropTypes.func.isRequired,
        plugins: PropTypes.array,
        shouldFocus: PropTypes.bool
    };

    componentDidMount = () => {
        if (this.props.shouldFocus) {
            this.editor.focus();
        }
    };

    onChange = (editorState: EditorState) => {
        this.props.onChange(editorState);

        // Wait for the DOM to be re-rendered from the editor state change before updating the plugins.
        setTimeout(
            () => {
                this.setState(
                    {
                        plugins: this.state.plugins.map(
                            (plugin) => {
                                return plugin.onChange(editorState);
                            }
                        )
                    }
                );
            },
            0
        )
    };

    myKeyBindingFn = (event: KeyboardEvent) => {
        let shouldTriggerCustomKeyCommand = false;

        this.state.plugins.forEach(
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

    handleKeyCommand = (command: string, editorState: EditorState) => {
        let isHandled = false;

        const updatedPlugins = this.state.plugins.map(
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
                    this.props.onChange(updatedEditorState);
                }

                return updatedPlugin;
            }
        );

        if (isHandled) {
            this.setState(
                {
                    plugins: updatedPlugins,
                }
            );
        }

        return isHandled ? 'handled' : 'not-handled';
    };

    render = () => {
        return (
            <div className="OmniEditor">
                {
                    this.state.plugins.map(
                        (plugin) => {
                            return plugin.getPortalElement(this.props.editorState, this.props.onChange);
                        }
                    )
                }
                <Editor
                    ref={
                        (node) => this.editor = node
                    }
                    editorState={this.props.editorState}
                    onChange={this.onChange}
                    keyBindingFn={this.myKeyBindingFn}
                    handleKeyCommand={this.handleKeyCommand}
                />
            </div>
        );
    };
}

export default OmniEditor;
