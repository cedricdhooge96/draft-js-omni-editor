import React, { FunctionComponent, ReactNode, MouseEvent } from 'react';
import { Suggestion } from 'plugins/mention/MentionPlugin';

interface MentionSuggestionProps {
    suggestion: Suggestion;
    onSuggestion: (suggestion: Suggestion) => void;
    suggestionView: (suggestions: Suggestion) => ReactNode;
}

const MentionSuggestion: FunctionComponent<MentionSuggestionProps> = (props) => {
    let suggestionClassName = [];

    if (props.suggestion.active) {
        suggestionClassName.push('active')
    }

    const onMouseDown = (event: MouseEvent<HTMLLIElement>) => {
        event.preventDefault();
    };

    const onMouseUp = () => {
        props.onSuggestion(props.suggestion);
    };

    return (
        <li className={suggestionClassName.join(' ')} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
            {props.suggestionView(props.suggestion)}
        </li>
    );
};

export default MentionSuggestion;
