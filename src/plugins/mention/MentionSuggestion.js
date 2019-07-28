import React from 'react';
import * as PropTypes from 'prop-types';

const MentionSuggestion = (props) => {
    let suggestionClassName = [];

    if (props.suggestion.active) {
        suggestionClassName.push('active')
    }

    const onMouseDown = (event) => {
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

MentionSuggestion.propTypes = {
    suggestion: PropTypes.object.isRequired,
    suggestionView: PropTypes.func.isRequired,
    onSuggestion: PropTypes.func.isRequired,
};

export default MentionSuggestion;
