import React from 'react';
import MentionSuggestionsDropdown from './MentionSuggestionsDropdown';
import { EditorState, Modifier } from 'draft-js';
import { Commands } from '../../OmniEditorKeyCommandMap';

class MentionPlugin {
    trigger;
    suggestions;
    suggestionView;
    suggestionFilter;

    // Our mention plugin's state
    state;

    constructor(trigger, suggestions, suggestionView, suggestionFilter) {
        this.trigger = trigger;
        this.suggestions = suggestions;
        this.suggestionView = suggestionView;
        this.suggestionFilter = suggestionFilter;

        this.state = null;
    }

    hasEntityAtSelection = (editorState) => {
        const selection = editorState.getSelection();
        if (!selection.getHasFocus()) {
            return false;
        }

        const contentState = editorState.getCurrentContent();
        const block = contentState.getBlockForKey(selection.getAnchorKey());

        return !!block.getEntityAt(selection.getAnchorOffset() - 1);
    };

    getTriggerRange = (editorState) => {
        const selection = window.getSelection();

        if (selection.rangeCount === 0) {
            return null;
        }

        if (this.hasEntityAtSelection(editorState)) {
            return null;
        }

        const range = selection.getRangeAt(0);
        let text = range.startContainer.textContent;

        // Remove text that appears after the cursor..
        text = text.substring(0, range.startOffset);

        const index = text.lastIndexOf(this.trigger);
        if (index === -1) {
            return null;
        }

        text = text.substring(index).substring(1, text.length).toLowerCase();

        return {
            text,
            start: index,
            end: range.startOffset
        };
    };

    getSuggestionState = (editorState) => {
        const range = this.getTriggerRange(editorState);
        if (!range) {
            return null;
        }

        const tempRange = window.getSelection().getRangeAt(0).cloneRange();
        tempRange.setStart(tempRange.startContainer, range.start);

        const rangeRect = tempRange.getBoundingClientRect();
        let [left, top] = [rangeRect.left, rangeRect.bottom];

        return {
            text: range.text,
            position: {
                left: left,
                top: top,
            },
            indexOfSelectedSuggestion: 0,
        };
    };

    onChange = (editorState) => {
        this.state = this.getSuggestionState(editorState);

        return this;
    };

    shouldTriggerCustomKeyCommand = () => {
        if (this.state === null) {
            return false;
        }

        return true;
    };

    handleKeyCommand = (command, editorState) => {
        if (this.state === null) {
            return {
                didPluginHandleCommand: false,
                updatedPlugin: this,
            };
        }

        const filteredSuggestions = this.suggestions.filter(
            (suggestion) => {
                return this.suggestionFilter(suggestion, this.state);
            }
        );

        if (command === Commands.ARROW_DOWN) {
            if (this.state.indexOfSelectedSuggestion === filteredSuggestions.length - 1) {
                this.state.indexOfSelectedSuggestion = 0;
            } else {
                this.state.indexOfSelectedSuggestion++;
            }
        } else if (command === Commands.ARROW_UP) {
            if (this.state.indexOfSelectedSuggestion === 0) {
                this.state.indexOfSelectedSuggestion = filteredSuggestions.length - 1;
            } else {
                this.state.indexOfSelectedSuggestion--;
            }
        } else if (command === Commands.SPLIT_BLOCK) {
            const updatedEditorState = this.addMentionToEditorState(
                editorState,
                filteredSuggestions[this.state.indexOfSelectedSuggestion]
            );

            this.state = null;

            return {
                didPluginHandleCommand: true,
                updatedPlugin: this,
                updatedEditorState: updatedEditorState,
            };
        } else {
            return {
                didPluginHandleCommand: false,
                updatedPlugin: this,
            };
        }

        return {
            didPluginHandleCommand: true,
            updatedPlugin: this,
        };
    };

    addMentionToEditorState = (editorState, suggestedMention) => {
        // Get current selection from the editor state.
        const selection = editorState.getSelection();

        // Set all variables required to calculate the start and end position for our mention.
        const anchorKey = selection.getAnchorKey();
        const anchorOffset = selection.getAnchorOffset();
        const currentContent = editorState.getCurrentContent().createEntity('MENTION', 'IMMUTABLE', suggestedMention);
        const currentBlock = currentContent.getBlockForKey(anchorKey);
        const blockText = currentBlock.getText();

        // Based on the trigger position calculate start and end index of our mention.
        const selectionText = blockText.substring(0, anchorOffset);
        const anchorOffsetOfMention = this.trigger.length === 0 ? 0 : selectionText.lastIndexOf(this.trigger);
        const focusOffsetOfMention = selectionText.length;

        // Create our entity key and modify the selection to contain the mention text.
        const entityKey = currentContent.getLastCreatedEntityKey();
        const mentionTextSelection = selection.merge(
            {
                anchorOffset: anchorOffsetOfMention,
                focusOffset: focusOffsetOfMention
            }
        );

        // Replace the current text inside the selection state with the mentioned persons text.
        let contentStateWithMentionEntity = Modifier.replaceText(
            currentContent,
            mentionTextSelection,
            `@${suggestedMention.name}`,
            null,
            entityKey
        );

        // Add a space after the mention entity if it's the last item in the block.
        const blockKey = mentionTextSelection.getAnchorKey();
        const blockSize = currentContent.getBlockForKey(blockKey).getLength();
        if (blockSize === focusOffsetOfMention) {
            contentStateWithMentionEntity = Modifier.insertText(
                contentStateWithMentionEntity,
                contentStateWithMentionEntity.getSelectionAfter(),
                ' '
            );
        }

        // Return the updated editor state containing the new mention entity.
        return EditorState.forceSelection(
            EditorState.push(
                editorState,
                contentStateWithMentionEntity,
                'insert-mention'
            ),
            contentStateWithMentionEntity.getSelectionAfter()
        );
    };

    getPortalElement = (editorState, setEditorState) => {
        if (this.state === null) {
            return null;
        }

        const filteredSuggestions = this.suggestions.filter(
            (suggestion) => {
                return this.suggestionFilter(suggestion, this.state);
            }
        ).map(
            (suggestion, index) => {
                suggestion.active = this.state.indexOfSelectedSuggestion === index;

                return suggestion;
            }
        );

        const onSuggestion = (suggestion) => {
            setEditorState(this.addMentionToEditorState(editorState, suggestion));

            this.state = null;
        };

        return (
            <MentionSuggestionsDropdown
                key="mention-suggestions"
                suggestionView={this.suggestionView}
                suggestions={filteredSuggestions}
                position={this.state.position}
                onSuggestion={onSuggestion}
            />
        );
    }
}

export default MentionPlugin;
