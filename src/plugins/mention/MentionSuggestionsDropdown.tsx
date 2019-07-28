import React, { useEffect, FunctionComponent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import * as PropTypes from 'prop-types';
import MentionSuggestion from './MentionSuggestion';
import { Suggestion } from 'plugins/mention/MentionPlugin';

interface MentionSuggestionsDropdownProps {
    position: {
        left: number;
        top: number;
    },
    suggestions: Suggestion[];
    suggestionView: (suggestions: Suggestion) => ReactNode;
    onSuggestion: (suggestion: Suggestion) => void;
}

const MentionSuggestionsDropdown: FunctionComponent<MentionSuggestionsDropdownProps> = (props) => {
    const element = React.useRef(document.createElement('div'));

    useEffect(
        () => {
            const currentElement = element.current;

            document.body.appendChild(currentElement);

            return function removeElement() {
                currentElement.remove();
            }
        },
        [
            element
        ]
    );

    const dropdownPosition = {
        top: props.position.top,
        left: props.position.left,
    };

    const mentionSuggestionsDropdown = (
        <ul className="MentionSuggestionsDropdown" style={dropdownPosition}>
            {
                props.suggestions.map(
                    (suggestion, index) => {
                        return (
                            <MentionSuggestion
                                key={index}
                                suggestion={suggestion}
                                suggestionView={props.suggestionView}
                                onSuggestion={props.onSuggestion}
                            />
                        );
                    }
                )
            }
        </ul>
    );

    return createPortal(
        mentionSuggestionsDropdown,
        element.current
    );
};

MentionSuggestionsDropdown.propTypes = {
    suggestions: PropTypes.array.isRequired,
    suggestionView: PropTypes.func.isRequired,
    onSuggestion: PropTypes.func.isRequired,
    position: PropTypes.shape(
        {
            left: PropTypes.number.isRequired,
            top: PropTypes.number.isRequired,
        }
    ).isRequired
};

export default MentionSuggestionsDropdown;
