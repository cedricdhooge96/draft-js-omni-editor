import { EditorState } from 'draft-js';
import { ReactNode } from 'react';

export default interface EditorPlugin {
    onChange: (editorState: EditorState) => EditorPlugin;
    shouldTriggerCustomKeyCommand: () => boolean;
    handleKeyCommand: (command: string, editorState: EditorState) => { didPluginHandleCommand: boolean, updatedPlugin: EditorPlugin, updatedEditorState?: EditorState }
    getPortalElement: (editorState: EditorState, setEditorState: (editorState: EditorState) => void) => ReactNode;
}
