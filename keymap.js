// allows mapping specific key sequences to actions

'use strict';

(()=>{
const canonicalSpellings = 'ArrowDown ArrowLeft ArrowRight ArrowUp Backspace CapsLock Delete End Enter Escape Home Insert NumLock PageDown PageUp Pause ScrollLock Space Tab'.split(' ');
const lowercaseSpellings = canonicalSpellings.map(s => new RegExp(`\\b${s}\\b`, 'gi'));
// Microsoft SendKeys notation, https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/sendkeys-statement
// 'Return' is from VIM, https://vimhelp.org/intro.txt.html#%3CReturn%3E
const alternateSpellings = 'Down Left Right Up BS CapsLock Del End Return Esc Home Ins NumLock PGDN PGUP Break ScrollLock Spacebar Tab'.split(' ').map(s => new RegExp(`\\b${s}\\b`, 'gi'));
// modifier keys. VIM uses '-', jquery.hotkeys uses '+', https://github.com/jresig/jquery.hotkeys
// Not using meta-
const modifiers = [[/s(hift)?[+-]/gi, '+'], [/c(trl)?[+-]/gi, '^'], [/a(lt)?[+-]/gi, '%']];

function normalize (keyDescriptor){
	keyDescriptor = keyDescriptor.trim().replaceAll(/ +/g, ' '); // collapse multiple spaces
	lowercaseSpellings.forEach( (re, i) => { keyDescriptor = keyDescriptor.replaceAll(re, canonicalSpellings[i]) } );
	alternateSpellings.forEach( (re, i) => { keyDescriptor = keyDescriptor.replaceAll(re, canonicalSpellings[i]) } );
	// VIM key descriptors are enclosed in angle brackets; sendkeys are enclosed in braces
	keyDescriptor = keyDescriptor.replaceAll(/(?<= |^)<([^>]+)>(?= |$)/g, '$1');
	keyDescriptor = keyDescriptor.replaceAll(/{([^}]+|})}/g, '$1');
	// uppercase function keys
	keyDescriptor = keyDescriptor.replaceAll(/f(\d+)/g, 'F$1');
	// it's easiest to turn modifiers into single keys, then reorder them and rename them
	modifiers.forEach( pair => { keyDescriptor = keyDescriptor.replaceAll(...pair) } );
	// normalize the order of ctrl-alt-shift
	keyDescriptor = keyDescriptor.replaceAll(
		/[+^%]+(?! |$)/g, // don't match a final [+^%], since that will be an actual character
		match => (/\^/.test(match) ? 'ctrl-' : '') + (/%/.test(match) ? 'alt-' : '') + (/\+/.test(match) ? 'shift-' : '')
	)
	keyDescriptor = keyDescriptor.replaceAll(/shift-([a-zA-Z])\b/g, (match, letter) => letter.toUpperCase() );
	return keyDescriptor;
}

// generates successive prefixes of lists of keyDescriptors
// turns 'alt-f x Enter' into [/^alt-f$/, /^alt-f x$/, /^alt-f x Enter$/]
// and /alt-x f\d+ (Enter|Escape)/i into [/^alt-x$/i, /^alt-x f\d+$/i, /^alt-x f\d+ (Enter|Escape)$/i]
function prefixREs(strOrRE){
	let sources, ignoreCase;
	if (!strOrRE.source){
		// escape RegExp from https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
		sources = strOrRE.toString().trim().split(/\s+/).
			map(normalize).
			map(s => s.replaceAll(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&"));
		ignoreCase = '';
	}else{
		sources = strOrRE.source.trim().split(/\s+/);
		ignoreCase = strOrRE.ignoreCase ? 'i' : '';
	}
	return sources.reduce ( (accumulator, currentValue, i) => {
		if (i == 0) return [RegExp(`^${currentValue}$`, ignoreCase)]; // ^...$ to match the entire key
		const source = accumulator[i-1].source.replaceAll(/^\^|\$$/g,''); // strip off the previous ^...$
		accumulator.push( new RegExp( `^${source} ${currentValue}$`, ignoreCase ) );
		return accumulator;
	}, []);
};

// ANSI keyboard codes
const specialKeys = {
	'Backquote': '`',
	'shift-Backquote': '~',
	'shift-1': '!',
	'shift-2': '@',
	'shift-3': '#',
	'shift-4': '$',
	'shift-5': '%',
	'shift-6': '^',
	'shift-7': '&',
	'shift-8': '*',
	'shift-9': '(',
	'shift-0': ')',
	'Minus': '-',
	'shift-Minus': '_',
	'Equal': '=',
	'shift-Equal': '+',
	'BracketRight': '[',
	'shift-BracketRight': '{',
	'BracketLeft': ']',
	'shift-BracketLeft': '}',
	'Backslash': '\\',
	'shift-Backslash': '|',
	'Semicolon': ';',
	'shift-Semicolon': ':',
	'Quote': "'",
	'shift-Quote': '"',
	'Comma': ',',
	'shift-Comma': '<',
	'Period': '.',
	'shift-Period': '>',
	'Slash': '/',
	'shift-Slash': '?',
};

function addKeyDescriptor(evt){
	// create a "keyDescriptor" field in evt that represents the keystroke as a whole: "ctrl-alt-Delete" for instance.
	const {code, shiftKey, ctrlKey, altKey} = evt;
	let key = evt.key; // needs to be variable
	if (!key || /^(?:shift|control|meta|alt)$/i.test(key)) return evt; // ignore undefined or modifier keys alone
	// we use spaces to delimit keystrokes, so this needs to be changed; use the code
	if (key == ' ') key = 'Space';
	// In general, use the key field. However, modified letters (ctrl- or alt-) use the code field
	// so that ctrl-A is the A key even on non-English keyboards.
	if (ctrlKey || altKey){
		if (/^(Key|Digit)\w$/.test(code)){
			evt.keyDescriptor = code.charAt(code.length-1)[shiftKey ? 'toUpperCase' : 'toLowerCase']();
		}else if (/^Numpad/.test(code)){
			evt.keyDescriptor = key;
		}else{
			evt.keyDescriptor = code;
		}
		if (!/^[a-zA-Z]$/.test(evt.keyDescriptor) && shiftKey) evt.keyDescriptor = 'shift-'+evt.keyDescriptor;
		if (evt.keyDescriptor in specialKeys) evt.keyDescriptor = specialKeys[evt.keyDescriptor];
	}else{
		evt.keyDescriptor = key;
		// printable characters should ignore the shift; that's incorporated into the key generated
		if (key.length !== 1 && shiftKey) evt.keymap = 'shift-'+evt.keymap;
	}
	if (altKey) evt.keyDescriptor = 'alt-'+evt.keyDescriptor;
	if (ctrlKey) evt.keyDescriptor = 'ctrl-'+evt.keyDescriptor;
	return evt;
}

function keymap (keyDescriptorTarget, handler, prefixHandler = ( evt => { evt.preventDefault() } )){
	const prefixes = prefixREs(keyDescriptorTarget);
	const prefixSymbol = Symbol();
	const newHandler = function (evt){
		const keyDescriptorSource = addKeyDescriptor(evt).keyDescriptor;
		if (!keyDescriptorSource) return; // it is a modifier key
		const el = evt.currentTarget;
		let currentSequence = keyDescriptorSource;
		if (el[prefixSymbol]) currentSequence = `${el[prefixSymbol]} ${currentSequence}`;
		while (currentSequence){
			const length = currentSequence.split(' ').length;
			if ( prefixes[length-1].test(currentSequence) ){
				// we have a match
				if (length == prefixes.length){
					// we have a match for the whole thing
					evt.keymapSequence = currentSequence; // handler should have the currentSequence available
					delete el[prefixSymbol];
					return handler.apply(this, arguments);
				}else{
					// it's a match for the start of the sequence of keys
					evt.keymapSequence = el[prefixSymbol] = currentSequence;
					return prefixHandler.apply(this, arguments);
				}
			}
			// if we get here, then we do not have a match. Maybe we started too soon (looking for 'a b c', got 'a a b c' and matched the beginning of the 
			// sequence at the first 'a', but that was wrong, so take off the first 'a' and try again
			currentSequence = currentSequence.replace(/^\S+[ ]?/, '');
		}
		delete el[prefixSymbol]; // no matches at all. 
	};
	newHandler.keymapPrefix = prefixSymbol;
	return newHandler;
}

globalThis.keymap = keymap;
keymap.normalize = normalize;
keymap.addKeyDescriptor = addKeyDescriptor;

})();
