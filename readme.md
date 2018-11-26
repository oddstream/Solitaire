# Solitaire

To play the games, visit the live version at [droppages](https://oddstream.droppages.com/).

For user-oriented information, please see the [FAQ](https://oddstream.droppages.com/faq.html).

# Implementation

Written in [vanilla ES2017 Javascript](http://vanilla-js.com/),
formatted as per the [Google style rules](https://google.github.io/styleguide/jsguide.html)
with [JSDoc](http://usejsdoc.org/) annotations to try to keep the Visual Studio Code type checker quiet.
 
Implemented as a small heirarchy of classes;
a Card class and a Card Container class, with derived classes for Stock, Waste, Foundation, Tableau &c.

Each variant has it's own html file which contains layout information for each container and
gameplay rules for that variant. The html file consists of boilerplate header and footers,
wrapped at build time around a central guts file.

At run time, the layout information in the html is linked to the Javascript card container classes.

The graphics are implemented in SVG, so they scale smoothly.

# Philosophy

Keep it simple, and focus on not interupting the player's flow. 
So, no distracting graphics or animations, make the cards easy to scan visually,
and no unnecessary features.

Also, make the games authentic, by taking the rules from reputable sources
and implementing them exactly.

# What's being worked on next

Refactoring

At the moment, the game state is saved to the user agent localStorage object when 
a game is won or lost, or when the page unloads. It would be nice if the game state 
gets saved into the cloud somewhere, so you can start a game on one computer/browser,
and continue it on another computer/browser. Inspired by StackEdit, I'm working
at saving the game state to Google Drive and/or Dropbox.

# Forth

The eventual idea is to implement a small Forth engine, with small scripts for each variant.
Solitaire is all about managing stacks of cards, so the stack-metaphor or Forth ought to
work well.
