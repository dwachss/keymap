# keymap.js

## Implement "hotkeys" for keyboard events.

Version 1.0 of this was designed for [jQuery](https://jquery.com/); that version is still available as [release 1.0](https://github.com/dwachss/keymap/releases/tage/v1.0). This version is completely different.

[ex](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/ex.html) has a "map" command to map sequences of keystrokes to actions. This does the same thing (but `Map` was [already taken](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) so I went with `keymap`). The `keymap` function adds a [decorator](https://en.wikipedia.org/wiki/Decorator_pattern) to a [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/KeyboardEvent) handler such that the handler is only called if the appropriate keys are pressed.

So instead of 

````js
element.addEventListener('keydown', event => {
  if (event.key == 'A'){
    // do something
  }
});
````
you can do
````js
element.addEventListener('keydown', keymap( 'A', event => {
  // do something
}));
````

and instead of 
````js
element.addEventListener('keydown', event => {
  if (event.key == 'A' && event.altKey){
    // do something
  }
});
````
you can do
````js
element.addEventListener('keydown', keymap( 'alt-A', event => {
  // do something
}));
````

And allowing sequences means that if you want to capture an A then B keypress, instead of something like:
````js
let prefix = '';
element.addEventListener.on('keydown', event => {
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
element.addEventListener('keydown', keymap( 'A B', event => {
  // do something
}));
````

## Usage

````js
const newHandler = keymap ( keyDescriptor, handler [, prefixHandler]);

element.addEventListener('keydown' or 'keyup', newHandler);

element.removeEventListener('keydown' or 'keyup', newHandler);
````

`keyDescriptor` is a space-delimited list of keys, from the [`key` field of the `KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values), with modifier keys prepended, in the order of `(ctrl-)?(alt-)?(shift-)?key`.
The meta key and other modifier keys are not implemented. Printable characters (ones with a single-character `key` value) ignore the `shift`, since that is part of the character generated. So control-lowercase a would be `ctrl-a`; control-uppercase a would be `ctrl-A`; control-1 is `ctrl-1`, with no distinction between main keyboard and numerical keypad. Octothorpe would be `#`, not `shift-3` on a US keyboard. There are two exceptions:

1. Space is `Spacebar`, not `" "`, since I use actual spaces to delimit key descriptors.
2. Keys with ctrl- or alt- use the `code` field, rather than the `key` field. This way `ctrl-z` uses the 'Z' key, even on a Hebrew keyboard where the 'Z' key produces a 'ז'. My fingers want to use the shortcuts they already know. The keys are named according to
their location on the [ANSI 101 keyboard](https://w3c.github.io/uievents-code/#keyboard-101); it's very US-centric. So `'ctrl-#'` is the '3' key with control pressed, no matter what keyboard you are using.

That is the "normalized" form of the keys. The program allows lots of synonyms from [VIM](https://vimhelp.org/intro.txt.html#notation) and John Resig's [hotkeys plugin](https://github.com/jeresig/jquery.hotkeys), and [Microsoft's SendKeys command](https://docs.microsoft.com/en-us/office/vba/language/reference/user-interface-help/sendkeys-statement). So `c+a` becomes `ctrl-a`, `^z` becomes `ctrl-z`, `%+{ESC}` becomes `alt-shift-Escape`. Look at the `normalize` function in the source code.

The `keyDescriptor`can also be a regular expression: `/F\d+/` matches any function key; `/ctrl-[a-zA-Z] (Escape|Enter)/` matches any control-letter followed by the escape key or the enter key. The regular expression has to match the normalized form; it's not smart enough to translate the synonyms. Note the space between keys in the regular expression.

`prefixHandler` is an event handler that handles "prefixes", the key sequence that leads to the final one. If the `keyDescriptor` is `'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight B A'`, then `prefixhandler` will be called with every key press as long as it is still generating a legal sequence. For example, if the user presses `ArrowUp`, `ArrowUp`, `ArrowDown`, `Enter`, then `prefixhandler` will be called three times. The default `prefixHandler` is `event => event.preventDefault()`, so the intermediate keys do not generate characters. To allow the keys to generate their usual characters (as with the [Konami cheat code](https://en.wikipedia.org/wiki/Konami_Code), you want everything to look normal until it is activated), use a no-op function, `event => event`.

`keymap` adds two fields to the handler (not the prefix handler):
1. `newHandler.keymapPrefix`, which is a [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) that is used as the field in each event that holds the prefix for the sequence being built.
2. `newHandler.keymapFilter`, which is the `keyDescriptor` that was passed to `keymap` initially.

### new fields on Event

The event passed to the event handlers will have three fields added:

1. `event.keyDescriptor`, which is a string representing the key with its modifiers.

````js
const event = new KeyboardEvent('keydown', {key: 'A', code: 'KeyA', shiftKey: true, ctrlKey: false, altKey: true})`
````

would have `event.keyDescriptor === 'alt-A'` when passed to the event handers.

2. `event.keymapSequence` that contains the list of keys processed so far. So for a handler like

````js
const handler = keymap (/Escape [a-z]/, evt => console.log(evt.keymapSequence));
element.addEventListener('keydown', handler);
````

Then pressing `Escape` then `q` will log `"Escape q`.

3. `event.keymapFilter` is the `keyDescriptor` that was passed to `keymap` initially (it is just `newHandler.keymapFilter`). In the above example, `event.keymapFilter === /Escape [a-z]/`.

## Other functions

The program exposes three two internal functions: 

`keymap.addKeyDescriptor(event)` adds the `keyDescriptor` field to the event.

`keymap.normalize(keyDescriptor)` returns the normalized form of `keyDescriptor`. For example, `keymap.normalize('^{up}')` returns `'ctrl-ArrowUp'` and `keymap.normalize('{up} {up} {down} {down}')` returns `'ArrowUp ArrowUp ArrowDown ArrowDown'`.



