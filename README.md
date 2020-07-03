# jquery.keymap.js

Implement "hotkeys" for keyboard events.

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
$(element).on('keydown', {keys: keyDescriptorString: string [, allowDefault: boolean]}, handlerFunction);
````

and allow removing handlers (in addition to all the other ways to remove handlers) with:

````js
$(element).off('keydown', {keys: keyDescriptorString}); // removes all handlers that had that keyDescriptorString
````

`keyDescriptorString` is a space-delimited list of `keyDescriptor`s, each of which is the value of the [`key` field of the KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values), with modifier keys prepended, in the order of `(ctrl-)?(alt-)?(meta-)?(shift-)?key`. Printable characters (ones with a single-character `key` value) ignore the `shift`, since that is part of the character generated. So control-lowercase a would be `ctrl-a`; control-uppercase a would be `ctrl-A`; control-1 is `ctrl-1`, with no distinction between main keyboard and numerical keypad. Alt-octothorpe would be `alt-#`, not `alt-shift-3` on a US keyboard. There are two exceptions:
1. Space is `Space`, not `" "`, since I use actual spaces to delimit key descriptors.
2. Letters (a-z and A-Z) with modifiers use the `code` field, rather than the `key` field.
