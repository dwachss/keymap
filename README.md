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
