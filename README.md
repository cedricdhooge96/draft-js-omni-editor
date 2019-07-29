# Draft JS Omni Editor

An editor created following a plugin pattern for easy customization.

## Current Plugins

A list of all the plugins created for the Omni Editor

### Mentions

A plugin created to mention certain users using a dropdown with render customizations.

```
    const suggestions = [
        { name: 'Foo' },
        { name: 'Bar' },
    ];
    
    const suggestionView = (suggestion) => {
        return (
            <li>{suggestion.name}</li>
        );
    };

    const mentionPlugin = new MentionPlugin(
        '@', // The trigger that will open the dropdown
        suggestions, // The list items that will be used in the dropdown
        suggestionView // The function that will render the HTML representation of your suggestion
    );
```
