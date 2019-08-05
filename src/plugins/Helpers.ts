import { EditorState } from 'draft-js';

export const hasEntityAtSelection = (editorState: EditorState): boolean => {
    const selection = editorState.getSelection();
    if (!selection.getHasFocus()) {
        return false;
    }

    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getAnchorKey());

    return !!block.getEntityAt(selection.getAnchorOffset() - 1);
};
