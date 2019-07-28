export const KeyCodes = {
    ARROW_UP: 38,
    ARROW_DOWN: 40,
};

export const Commands = {
    ARROW_UP: 'omni-editor-arrow-up',
    ARROW_DOWN: 'omni-editor-arrow-down',
    SPLIT_BLOCK: 'split-block',
};

const OmniEditorKeyCommandMap = {};
OmniEditorKeyCommandMap[KeyCodes.ARROW_UP] = Commands.ARROW_UP;
OmniEditorKeyCommandMap[KeyCodes.ARROW_DOWN] = Commands.ARROW_DOWN;

export default OmniEditorKeyCommandMap;
