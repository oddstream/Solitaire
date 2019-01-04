# Solitaire

To play the games, visit the live version at [droppages](https://oddstream.droppages.com/).

For user-oriented information, please see the [FAQ](https://oddstream.droppages.com/faq.html).

# Implementation

Written in [vanilla ES2017 Javascript](http://vanilla-js.com/),
formatted as per the [Google style rules](https://google.github.io/styleguide/jsguide.html)
with [JSDoc](http://usejsdoc.org/) annotations to try to keep the Visual Studio Code type checker quiet.
 
Implemented as a small hierarchy of classes;
a Card class and a Card Container class, with classes derived from that for Stock, Waste, Foundation, Tableau &c.
Some specialized containers, for example a Freecell tableau, get derived

Each variant has it's own html file which contains layout information for each container and
gameplay rules for that variant. The html file consists of boilerplate header and footers,
wrapped at build time around a central guts file and some SVG symbols. The build script (bake.tcl)
requires Tcl to be installed and is hardwired to my folder configuration.

At run time, the layout information in the html is linked to the Javascript card container classes.

The graphics are implemented in SVG, so they scale smoothly.

Time has been spent making it compatible with both mobile and desktop versions of Chrome, Firefox and Edge.
I think it runs *The Best* on a touchscreen Chromebook.

# Philosophy

Keep it simple and facilitate the player's flow. 
So: no distracting graphics or animations, make the cards easy to scan visually, and no unnecessary features.

Also, make the games authentic, by taking the rules from reputable sources
and implementing them exactly.

# Freecell or Yukon solver

# Forth

An idea I keep kicking around is to implement a small Forth engine, with small scripts for each variant.
Solitaire is all about managing stacks of cards, so the stack-metaphor or Forth ought to
work well.
