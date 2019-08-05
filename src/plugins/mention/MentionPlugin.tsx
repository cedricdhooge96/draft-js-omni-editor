import React, { ReactNode } from 'react';
import MentionSuggestionsDropdown from './MentionSuggestionsDropdown';
import { EditorChangeType, EditorState, Modifier } from 'draft-js';
import { Commands } from '../../OmniEditorKeyCommandMap';
import EditorPlugin from '../EditorPlugin';
import { hasEntityAtSelection } from '../Helpers';

export interface Suggestion {
    name: string;
    active?: boolean;
}

class MentionPlugin implements EditorPlugin {

    // Configuration properties provided by props
    private readonly trigger: string;
    private readonly suggestionView: (suggestions: Suggestion) => ReactNode;
    private readonly suggestionFilter: (suggestion: Suggestion, text: string) => boolean;

    // State Properties set by the plugin
    private text: string | undefined;
    private indexOfSelectedSuggestion: number | undefined;
    private position: { left: number, top: number} | undefined;
    private suggestions: Suggestion[] | undefined;

    constructor(
        trigger: string,
        loadSuggestions: Promise<Suggestion[]>,
        suggestionView: (suggestions: Suggestion) => ReactNode,
        suggestionFilter: (suggestion: Suggestion, text: string) => boolean
    ) {
        this.trigger = trigger;
        this.suggestionView = suggestionView;
        this.suggestionFilter = suggestionFilter;

        loadSuggestions.then(
            (suggestions: Suggestion[]) => {
                this.suggestions =  suggestions
            }
        );
    }

    getTriggerRange = (editorState: EditorState) => {
        const selection = window.getSelection();

        if (!selection) {
            return null;
        }

        if (selection.rangeCount === 0) {
            return null;
        }

        if (hasEntityAtSelection(editorState)) {
            return null;
        }

        const range = selection.getRangeAt(0);
        let text = range.startContainer.textContent;

        if (!text) {
            return null;
        }

        // Remove text that appears after the cursor..
        text = text.substring(0, range.startOffset);

        const index = text.lastIndexOf(this.trigger);
        if (index === -1) {
            return null;
        }

        text = text.substring(index).substring(1, text.length).toLowerCase();

        return {
            selection,
            text,
            start: index,
            end: range.startOffset
        };
    };

    public onChange = (editorState: EditorState): EditorPlugin => {
        const range = this.getTriggerRange(editorState);
        if (!range) {
            this.text = undefined;
            this.indexOfSelectedSuggestion = undefined;
            this.position = undefined;

            return this;
        }

        const tempRange = range.selection.getRangeAt(0).cloneRange();
        tempRange.setStart(tempRange.startContainer, range.start);

        const rangeRect = tempRange.getBoundingClientRect();
        let [left, top] = [rangeRect.left, rangeRect.bottom];

        this.text = range.text;
        this.indexOfSelectedSuggestion = 0;
        this.position = {
            left: left,
            top: top,
        };

        return this;
    };

    public shouldTriggerCustomKeyCommand = () => {
        if (
            this.text === null
            || this.suggestions === undefined
            || this.suggestions.length <= 0
        ) {
            return false;
        }

        const filteredSuggestions = this.suggestions.filter(
            (suggestion) => {
                if (this.text === undefined) {
                    return true;
                }

                return this.suggestionFilter(suggestion, this.text);
            }
        );

        if (filteredSuggestions.length <= 0) {
            return false;
        }

        return true;
    };

    public handleKeyCommand = (command: string, editorState: EditorState): { didPluginHandleCommand: boolean, updatedPlugin: EditorPlugin, updatedEditorState?: EditorState } => {
        if (
            this.text === undefined
            || this.suggestions === undefined
            || this.suggestions.length <= 0
        ) {
            return {
                didPluginHandleCommand: false,
                updatedPlugin: this,
            };
        }

        const filteredSuggestions = this.suggestions.filter(
            (suggestion) => {
                if (this.text === undefined) {
                    return true;
                }

                return this.suggestionFilter(suggestion, this.text);
            }
        );

        if (filteredSuggestions.length <= 0) {
            return {
                didPluginHandleCommand: false,
                updatedPlugin: this,
            };
        }

        if (!this.indexOfSelectedSuggestion) {
            this.indexOfSelectedSuggestion = 0;
        }

        if (command === Commands.ARROW_DOWN) {
            if (this.indexOfSelectedSuggestion === filteredSuggestions.length - 1) {
                this.indexOfSelectedSuggestion = 0;
            } else {
                this.indexOfSelectedSuggestion++;
            }
        } else if (command === Commands.ARROW_UP) {
            if (this.indexOfSelectedSuggestion === 0) {
                this.indexOfSelectedSuggestion = filteredSuggestions.length - 1;
            } else {
                this.indexOfSelectedSuggestion--;
            }
        } else if (command === Commands.SPLIT_BLOCK) {
            const updatedEditorState = this.addMentionToEditorState(
                editorState,
                filteredSuggestions[this.indexOfSelectedSuggestion]
            );

            this.text = undefined;
            this.position = undefined;
            this.indexOfSelectedSuggestion = undefined;

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

    private addMentionToEditorState = (editorState: EditorState, suggestedMention: any) => {
        if (!suggestedMention) {
            return editorState;
        }

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
        const mentionTextSelection: any = selection.merge(
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
            undefined,
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
                'insert-mention' as EditorChangeType
            ),
            contentStateWithMentionEntity.getSelectionAfter()
        );
    };

    public getPortalElement = (editorState: EditorState, setEditorState: (editorState: EditorState) => void) => {
        if (
            this.text === undefined
            || this.position === undefined
            || this.suggestions === undefined
            || this.suggestions.length <= 0
        ) {
            return null;
        }

        const filteredSuggestions = this.suggestions.filter(
            (suggestion) => {
                if (this.text === undefined) {
                    return true;
                }

                return this.suggestionFilter(suggestion, this.text);
            }
        ).map(
            (suggestion, index) => {
                if (this.indexOfSelectedSuggestion === null) {
                    return suggestion;
                }

                suggestion.active = this.indexOfSelectedSuggestion === index;

                return suggestion;
            }
        );

        if (filteredSuggestions.length <= 0) {
            return null;
        }

        const onSuggestion = (suggestion: Suggestion) => {
            setEditorState(this.addMentionToEditorState(editorState, suggestion));

            this.text = undefined;
            this.position = undefined;
            this.indexOfSelectedSuggestion = undefined;
        };

        return (
            <MentionSuggestionsDropdown
                key="mention-suggestions"
                suggestionView={this.suggestionView}
                suggestions={filteredSuggestions}
                position={this.position}
                onSuggestion={onSuggestion}
            />
        );
    }
}

export default MentionPlugin;
