# jquery.keymap.js

Implement "hotkeys" for keyboard events.

Tested on Chrome, Firefox and Edge (chromium) as of 2020-07-03. Edge Legacy and Internet Explorer do not implement the `code` field, and so fail with modified letters (like control-Z).

Uses [jQuery event extensions](https://learn.jquery.com/events/event-extensions/) (note that the linked article is for jQuery 1.7; the details for extending events has [changed a little for jQuery 3](https://jquery.com/upgrade-guide/3.0/#breaking-change-jquery-event-props-and-jquery-event-fixhooks-removed) but you have to read the source to figure out what to do) to change the `keyup` and `keydown` event handlers to allow for filtering for specific sequences of keys.

So instead of 

````js
$(element).on('keydown', event => {
  if (event.key == 'A'){
    // do something
  }
});
````
you can do
````js
$(element).on('keydown', {keys: 'A'}, event => {
  // do something
});
````

and instead of 
````js
$(element).on('keydown', event => {
  if (event.key == 'A' && event.altKey){
    // do something
  }
});
````
you can do
````js
$(element).on('keydown', {keys: 'alt-a'}, event => {
  // do something
});
````

And allowing sequences means that if you want to capture an A then B keypress, instead of something like:
````js
let prefix = '';
$(element).on('keydown', event => {
  if (event.key == 'B' && prefix == 'A'){
    // do something
  }else if (event.key == 'A'){
    prefix = 'A';
  }else{
    prefix = '';
  }
});
````
you can do
````js
$(element).on('keydown', {keys: 'A B'}, event => {
  // do something
});
````

## Usage

The jquery.keymap.js file patches the jQuery `keydown` and `keyup` events to accept event handlers like:
````js
$(element).on('keydown', {keys: keyDescriptorList: string [, allowDefault: boolean = false]}, handlerFunction);
````

and allow removing handlers (in addition to all the other ways to remove handlers) with:

````js
$(element).off('keydown', {keys: keyDescriptorList}); // removes all handlers that had that keyDescriptorString
````

`keyDescriptorList` is a space-delimited list of `keyDescriptor`s, each of which is the value of the [`key` field of the KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values), with modifier keys prepended, in the order of `(ctrl-)?(alt-)?(meta-)?(shift-)?key`. Printable characters (ones with a single-character `key` value) ignore the `shift`, since that is part of the character generated. So control-lowercase a would be `ctrl-a`; control-uppercase a would be `ctrl-A`; control-1 is `ctrl-1`, with no distinction between main keyboard and numerical keypad. Alt-octothorpe would be `alt-#`, not `alt-shift-3` on a US keyboard. There are two exceptions:
1. Space is `Space`, not `" "`, since I use actual spaces to delimit key descriptors.
2. Letters (a-z and A-Z) with modifiers use the `code` field, rather than the `key` field. This way `ctrl-z` uses the 'Z' key, even on a Hebrew keyboard where the 'Z' key produces a 'ז'. My fingers want to use the shortcuts they already know.

That is the "normalized" form of the keys. The program allows lots of synonyms from VIM and John Resig's [hotkeys plugin](https://github.com/jeresig/jquery.hotkeys), and [Microsoft's SendKeys command](https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/sendkeys-statement).So `c+a` becomes `ctrl-a`, `^z` becomes `ctrl-z`, `%+{ESC}` becomes `alt-shift-Escape`. Look at the `aliasgenerator` list in the source code.

The `keyDescriptorString`can also be a regular expression: `keys: /F\d+/` matches any function key; `keys: /ctrl-[a-zA-z] (Escape|Enter)/` matches any control-letter followed by the escape key or the enter key. The regular expression has to match the normalized form; it's not smart enough to translate the synonyms. Note the space between keys in the regular expression.

The `allowDefault` option addresses the problem of keys that match the 'prefix' of the `keyDescriptorString`. The handler is only called after all the keys match, so `event.preventDefault()` will only prevent the default on that last key. `$(element).on('keydown', {keys: 'ArrowUp ArrowUp ArrowDown ArrowDown'}, handler)` will still propagate the first three keys (`ArrowUp ArrowUp ArrowDown`) even if `handler` calls `preventDefault`. The program assumes that's *not* what you want and calls `preventDefault` on every key event, unlee `allowDefault` is true.

## Event handling

Every `keyup` or `keydown` event has a new field added: `keymap`, that is set to the normalized form of the key event. So an event with `key: 'a', ctrlKey: true, altKey: true` will get a field `keymap: 'ctrl-alt-a'`. That is what is compared to the key descriptor in the event handler.

If the event matches the prefix of a key descriptor (in the example above,  `$(element).on('keydown', {keys: 'ArrowUp ArrowUp ArrowDown ArrowDown'}, handler)`, after a single `ArrowUp` or after two `ArrowUp`s and an `ArrowDown`, meaning that it is still possible to match this descriptor), then a custom event `keymapprefix` is triggered with: `$(element).trigger('keymapprefix', [currentSequenceOfKeyDescriptors]);`. When the entire sequence is matched, in addition to running `handler`, a custom event `keymapcomplete` is similarly triggered. 

## Other functions

The program exposes three internal functions: 

`jQuery.keymap(event)` adds the `keymap` field to the event if it is has the appropriate `KeyboardEvent` fields set (`key` and `code`).

`jQuery.keymap.normalizeString(keyDescriptor)` returns the normalized form of `keyDescriptor`. For example, `$.keymap.normalizeString('^{up}')` returns `'ctrl-ArrowUp'`.

`jQuery.keymap.normalizeList(keyDescriptor)` does the same for a space-delimited list of descriptors. For example, `$.keymap.normalizeList('{up} {up} {down} {down}')` returns `'ArrowUp ArrowUp ArrowDown ArrowDown'`.



