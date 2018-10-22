# Solitaire

For user-oriented information, please see the [FAQ](https://oddstream.droppages.com/faq.html).

# Implementation

Written in [vanilla Javascript](http://vanilla-js.com/) as a small heirarchy of classes; a Card class and
a Card Container class, with derived classes for Stock, Waste, Foundation, Tableau &c.

Each variant has it's own html file which contains layout information for each container and
gameplay rules for that variant. The html file consists of boilerplate header and footers,
wrapped at build time around a central guts file.

The graphics are implemented in SVG, so they scale smoothly.

# Forth

The eventual idea is to implement a small Forth engine, with small scripts for each variant.
Solitaire is all about managing stacks of cards, so the stack-metaphor or Forth ought to
work well.
