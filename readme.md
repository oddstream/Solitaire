# Solitaire

For user-oriented information, please see the [FAQ](faq.html).

# Implementation

Written in vanilla Javascript as a small heirachy of classes; a basic Card class,
a basic Card Container class which acts as a parent for more specialized classes for Stock, Waste, Foundation, Tableau &c.

Each variant has it's own html file which contains layout information for each container and
gameplay rules for that variant. The html file consists of boilerplate header and footers,
wrapped at build time around a central guts file.

The graphics are implemented in SVG, so they scale smoothly.
