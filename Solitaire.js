//@ts-check
'use strict';
/* jshint esversion:6 */

const Constants = {
  GAME_NAME: 'Solitaire',
  GAME_VERSION: '0.11.9.0',
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',

  MOBILE:     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  CHROME:     navigator.userAgent.indexOf('Chrome/') != -1,   // also Brave, Opera
  EDGE:       navigator.userAgent.indexOf('Edge/') != -1,
  FIREFOX:    navigator.userAgent.indexOf('Firefox/') != -1,

  SPADE: '\u2660',     // ♠ Alt 6
  CLUB: '\u2663',      // ♣ Alt 5
  HEART: '\u2665',     // ♥ Alt 3
  DIAMOND: '\u2666',   // ♦ Alt 4

  REDEALS_SYMBOL: '\u21BA',           // Anticlockwise Open Circle Arrow
  ACCEPT_NOTHING_SYMBOL: '\u00D7',    // &times;
  ACCEPT_MARTHA_SYMBOL: '¹',          // &sup1;
  ACCEPT_INSECT_SYMBOL: '\u2261',     // &equiv;

  // if you edit these, also edit symbols.svg if using symbol card backs
  CARD_WIDTH: 60,
  CARD_WIDTH_STACKED: Math.round(60/2),
  CARD_HEIGHT: 90,
  CARD_RADIUS: 5,
  DEFAULT_STACK_FACTOR_Y: (10.0/3.0),
  DEFAULT_STACK_FACTOR_X: 2.0,
  MAX_STACK_FACTOR: 10,
  FACEDOWN_STACK_WIDTH: Math.round(60/6),
  FACEDOWN_STACK_HEIGHT: Math.round(90/9),

  cardValues: ['Joker','A','2','3','4','5','6','7','8','9','10','J','Q','K'],
  cardValuesEnglish: ['Joker','Ace','2','3','4','5','6','7','8','9','10','Jack','Queen','King'],

  AUTOCOLLECT_OFF: 0,
  AUTOCOLLECT_SOLVEABLE: 1,
  AUTOCOLLECT_ACES: 2,        // retired, keep around for startup legacy check
  AUTOCOLLECT_ANY: 3
};

// if ( !(Constants.CHROME || Constants.EDGE || Constants.FIREFOX) )
//     window.alert(`Browser (${navigator.userAgent}) not supported`);
// else if ( !window.PointerEvent )
//     window.alert('Pointer events not supported');

const Util = {
  /**
   * @param {SVGPoint} pt1 
   * @param {SVGPoint} pt2 
   * @returns {number}
   */
  getDistance: function(pt1, pt2) {
    return Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);     // see 30 seconds of code
  },

  /**
   * @param {number} n 
   * @param {string} word 
   * @returns {string}
   */
  plural: function(n, word) {
    if ( 0 === n ) {
      return `no ${word}s`;
    } else if ( 1 === n ) {
      return `${n} ${word}`;
    } else {
      return `${n} ${word}s`;
    }
  },

  /**
   * @param {(number|SVGPoint)} x
   * @param {number=} y
   * @returns {SVGPoint}
  */
  newPoint: function(x, y=undefined) {
    const /** !SVGPoint */ pt = baize.ele.createSVGPoint();
    if ( typeof x === 'object' ) {
      pt.x = x.x;
      pt.y = x.y;
    } else if ( typeof x === 'number' && typeof y === 'number' ) {
      pt.x = x;
      pt.y = y;
    } else {
      throw new TypeError();
    }
    return pt;
  },

  // samePoint: function(pt1, pt2) {
  //   return ( (pt1.x === pt2.x) && (pt1.y === pt2.y) );
  // },

  /**
   * @param {SVGPoint} pt1
   * @param {SVGPoint} pt2
   * @returns {boolean}
   */
  nearlySamePoint: function(pt1, pt2) {
    const xMin = pt1.x - 4;
    const xMax = pt1.x + 4;
    const yMin = pt1.y - 4;
    const yMax = pt1.y + 4;
    return ( pt2.x > xMin && pt2.x < xMax && pt2.y > yMin && pt2.y < yMax );
  },

  /**
   * @param {number} x 
   * @param {number} y 
   * @returns {SVGPoint}
   */
  DOM2SVG: function(x, y) {
    // https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/
    const pt = Util.newPoint(x,y);
    pt.matrixTransform(baize.ele.getScreenCTM().inverse());
    pt.x = Math.round(pt.x);    // Card.pt should be integers, no decimal fractions
    pt.y = Math.round(pt.y);
    return pt;
  },

  /**
   * @param {string} id 
   * @returns {?Card}
   */
  id2Card: function(id) {
    if ( !id )
      return null;
    let card = null;
    for ( let i=0; i<listOfCardContainers.length; i++ ) {
      card = listOfCardContainers[i].cards.find( c => c.id === id );
      if ( card )
        break;
    }
    if ( !card ) console.warn('couldn\'t id', id);
    return card;
  },

  /**
   * @param {Event} event 
   * @returns {boolean}
   */
  absorbEvent: function(event) {
    var e = event || window.event;
    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
  }
};

/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 *
 * https://gist.github.com/blixt/f17b47c62508be59987b
 */
class Random {
  /**
   * @param {number} seed 
   */
  constructor(seed) {
    this.seed_ = seed % 2147483647;
    if ( this.seed_ <= 0 ) {
      this.seed_ += 2147483646;
    }
  }

  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   * @return {number}
  */
  next() {
    return this.seed_ = this.seed_ * 16807 % 2147483647;
  }

  /**
   * Returns a pseudo-random floating point number in range [0, 1].
   * @return {number}
  */
  nextFloat() {
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return (this.next() - 1) / 2147483646;
  }

  /**
  * Returns a random integer between min (inclusive) and max (inclusive)
  * Using Math.round() will give you a non-uniform distribution!
  * @param {number} min
  * @param {number} max
  * @return {number}
  */
  nextInt(min, max) {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}

class Baize {
  constructor() {
    /** @const {SVGElement} */ this.ele = document.getElementById('baize');
    /** @private @type {number} */ this.borderWidth_ = 0;
    /** @private @type {number} */ this.gutsWidth_ = 0;
    /** @type {number} */ this.width = 0;
    /** @type {number} */ this.height = 0;
    this.ele.querySelectorAll('g>rect').forEach( r => {
      r.setAttributeNS(null, 'height', String(Constants.CARD_HEIGHT));
      r.setAttributeNS(null, 'width', String(Constants.CARD_WIDTH));
      r.setAttributeNS(null, 'rx', String(Constants.CARD_RADIUS));
      r.setAttributeNS(null, 'ry', String(Constants.CARD_RADIUS));

      let x = Number.parseInt(r.getAttribute('x'), 10) || 0;
      if ( x > this.gutsWidth_ ) {
        this.gutsWidth_ = x;
      }
    });
    this.gutsWidth_ += Constants.CARD_WIDTH + 10;
    this.setBox_();
    window.addEventListener('orientationchange', this.onOrientationChange.bind(this));
  }

  /**
   * @private
   * @param {number} b positive or negative border width
   */
  adjustBorder_(b) {
    this.ele.querySelectorAll('g>rect,g>text').forEach( r => {
      if ( r.hasAttribute('x') ) {
        let x = Number.parseInt(r.getAttribute('x'), 10) || 0;
        r.setAttributeNS(null, 'x', String(x + b));
      }
    });
    listOfCardContainers.forEach( cc => {
      cc.pt.x += b;
      cc.cards.forEach( c => {
        c.pt.x += b;
        c.position0();
      });
    });
  }

  /**
   * @private
   */
  setBox_() {
    this.width = this.gutsWidth_;
    this.height = Math.max(1200,window.screen.height);

    if ( window.screen.width > window.screen.height ) {
      // landscape, add a border if guts are narrow
      if ( this.gutsWidth_ < 800 ) {
        this.borderWidth_ = (800 - this.gutsWidth_) / 2;
        this.adjustBorder_(this.borderWidth_);
        this.width = 800;
      }
    }
    // set viewport (visible area of SVG)
    this.ele.setAttributeNS(null, 'width', String(this.width));
    this.ele.setAttributeNS(null, 'height', String(this.height));
    this.ele.setAttributeNS(null, 'viewBox', `0 0 ${this.width} ${this.height}`);
    this.ele.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin slice');
  }

  onOrientationChange() {
    if ( this.borderWidth_ ) {
      this.adjustBorder_(-this.borderWidth_);
      this.borderWidth_ = 0;
    }
    this.setBox_();
    listOfCardContainers.forEach( cc => {
      cc.cards.forEach( c => {
        while ( c.g.hasChildNodes() ) {
          c.g.removeChild(c.g.lastChild);
        }
        c.putRectInG_();
      });
    });
    availableMoves();   // repaint moveable cards
  }
}

const /** Array<CardContainer> */listOfCardContainers = [];

const baize = new Baize;

class Mover {
  constructor() {
    /** @private */ this.zzzz_ = false;
    this.count = 0;
  }

  reset() {
    this.count = 0;
  }

  sleep(f) {
    this.zzzz_ = true;
    f();
    this.zzzz_ = false;
    this.increment();
  }

  increment() {
    if ( !this.zzzz_ ) {
      this.count++;
      window.setTimeout(robot, 500);
    }
  }

  decrement() {
    if ( !this.zzzz_ ) {
      this.count--;
    }
  }
}

const tallyMan = new Mover;

// https://stackoverflow.com/questions/20368071/touch-through-an-element-in-a-browser-like-pointer-events-none/20387287#20387287
function dummyTouchStartHandler(e) {e.preventDefault();}

class Card {
  /**
   * @param {!number} pack
   * @param {!string} suit
   * @param {!number} ordinal
   * @param {!boolean} faceDown
   * @param {!SVGPoint} pt
   */
  constructor(pack, suit, ordinal, faceDown, pt) {
    this.pack = pack;
    this.ordinal = ordinal; // 1 .. 13
    this.suit = suit;
    this.faceDown = faceDown;

    // sort uses the card id as input to locale
    // padStart() ok in Chrome, Edge, Firefox
    if ( this.ordinal < 10 ) {
      this.id = `${pack}${suit}0${String(this.ordinal)}`;
    } else {
      this.id = `${pack}${suit}${String(this.ordinal)}`;
    }
    console.assert(this.id.length===4);
    // this.id = `${pack}${suit}${String(this.ordinal).padStart(2,'0')}`;

    this.color = ( this.suit === Constants.HEART || this.suit === Constants.DIAMOND ) ? 'red' : 'black';
    this.owner = null;
    this.pt = Util.newPoint(pt);
    this.ptOriginal = null;
    this.ptOffset = null;
    this.grabbedTail = null;
    this.ptOriginalPointerDown = null;
    // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
    this.downHandler = this.onpointerdown.bind(this);
    this.moveHandler = this.onpointermove.bind(this);
    // this.moveHandler = debounce(this.onpointermove.bind(this), 10);
    this.upHandler = this.onpointerup.bind(this);
    this.cancelHandler = this.onpointercancel.bind(this);
    this.overHandler = this.onpointerover.bind(this);

    this.inTransit = false;                 // set when moving
    // this.revealed = false;                  // user is holding mouse on a buried non-grabbable card

    this.g = document.createElementNS(Constants.SVG_NAMESPACE, 'g');
    this.putRectInG_();
    this.position0();
    this.addListeners_();
  }

  /**
   * @returns {string}
   */
  faceValue() {
    return Constants.cardValues[this.ordinal];
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.id;
  }

  /**
   * @private
   * @param {string} cl class
   * @returns Element
   */
  createRect_(cl) {
    const r = document.createElementNS(Constants.SVG_NAMESPACE, 'rect');
    r.classList.add(cl);
    r.setAttributeNS(null, 'width', String(Constants.CARD_WIDTH));
    r.setAttributeNS(null, 'height', String(Constants.CARD_HEIGHT));
    r.setAttributeNS(null, 'rx', String(Constants.CARD_RADIUS));
    r.setAttributeNS(null, 'ry', String(Constants.CARD_RADIUS));
    return r;
  }

  /**
   * @private
   */
  putRectInG_() {
    console.assert(!this.g.lastChild);
    if ( this.faceDown ) {
      this.g.appendChild(this.createRect_('spielkarteback'));
    } else {
      this.g.appendChild(this.createRect_('spielkarte'));

      const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
      t.classList.add('spielkartevalue');
      t.setAttributeNS(null, 'x', String(Constants.CARD_WIDTH/4));
      t.setAttributeNS(null, 'y', String(Constants.CARD_HEIGHT/4));
      t.setAttributeNS(null, 'text-anchor', 'middle');
      t.setAttributeNS(null, 'dominant-baseline', 'middle');
      t.setAttributeNS(null, 'fill', this.color);
      t.innerHTML = this.faceValue();
      this.g.appendChild(t);

      if ( Constants.MOBILE ) {   // TODO get rid of magic numbers
        const u = document.createElementNS(Constants.SVG_NAMESPACE, 'use');
        u.setAttributeNS(null, 'href', `#${this.suit}`);
        u.setAttributeNS(null, 'height', '22');
        u.setAttributeNS(null, 'width', '24');
        if ( rules.Cards.suit === 'BottomLeft' ) {
          u.setAttributeNS(null, 'x', '4');
          u.setAttributeNS(null, 'y', String((Constants.CARD_HEIGHT/3)*2));
        } else if ( rules.Cards.suit === 'TopRight' ) {
          u.setAttributeNS(null, 'x', String(Constants.CARD_WIDTH/2));
          u.setAttributeNS(null, 'y', '4');
        } else {
          console.error('Unknown rules.Cards.suit', rules.Cards.suit);
        }
        this.g.appendChild(u);
      } else {
        const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
        t.classList.add('spielkartesuit');
        if ( rules.Cards.suit === 'BottomLeft' ) {
          t.setAttributeNS(null, 'x', String(Constants.CARD_WIDTH/4));
          t.setAttributeNS(null, 'y', String((Constants.CARD_HEIGHT/10)*9)); // 90%
        } else if ( rules.Cards.suit === 'TopRight' ) {
          t.setAttributeNS(null, 'x', String((Constants.CARD_WIDTH/4)*3));  // 75%
          t.setAttributeNS(null, 'y', String(Constants.CARD_HEIGHT/4));
        } else {
          console.error('Unknown rules.Cards.suit', rules.Cards.suit);
        }
        t.setAttributeNS(null, 'text-anchor', 'middle');
        t.setAttributeNS(null, 'dominant-baseline', 'middle');
        t.setAttributeNS(null, 'fill', this.color);
        t.innerHTML = this.suit;
        this.g.appendChild(t);
      }
    }
  }

  /**
   * @private
   */
  addListeners_() {
    // put the event handlers on the g, but the event happens on the rect inside
    // http://www.open.ac.uk/blogs/brasherblog/?p=599
    // the ordinal and suit symbols use css pointer-event: none so the events pass through to their parent (the rect)
    this.g.addEventListener('pointerover', this.overHandler);
    this.g.addEventListener('pointerdown', this.downHandler);
    this.g.addEventListener('touchstart', dummyTouchStartHandler);
  }

  /**
   * @private
   */
  removeListeners_() {
    this.g.removeEventListener('pointerover', this.overHandler);
    this.g.removeEventListener('pointerdown', this.downHandler);
    this.g.removeEventListener('touchstart', dummyTouchStartHandler);
  }

  /**
   * @private
   */
  addDragListeners_() {
    window.addEventListener('pointermove', this.moveHandler);
    window.addEventListener('pointerup', this.upHandler);
    window.addEventListener('pointercancel', this.cancelHandler);
  }

  /**
   * @private
   */
  removeDragListeners_() {
    window.removeEventListener('pointermove', this.moveHandler);
    window.removeEventListener('pointerup', this.upHandler);
    window.removeEventListener('pointercancel', this.cancelHandler);
  }

  /**
   * @param {PointerEvent} event 
   */
  onclick(event) {   // shouldn't ever happen
    console.error('click received directly on a card');
  }

  /**
   * @param {PointerEvent} event 
   */
  onpointerover(event) {
    let cur = 'default';
    if ( this.faceDown && this === this.owner.peek() ) {
      cur = 'pointer';
    } else if ( this.owner.canGrab(this) ) {
      if ( stats.Options.autoPlay )
        cur = 'pointer';
      else
        cur = 'grab';
    }

    for ( let i=0; i<this.g.children.length; i++ )
      this.g.children[i].style.cursor = cur;
  }

  /**
   * Takes the event coords from a DOM event and returns an SVG point
   * The PointerEvent contains several x,y coords; choice of client, offset, (page), (layer), screen, and (x, y)
   * @private
   * @param {PointerEvent} event
   * @returns {SVGPoint}
   */
  getPointerPoint_(event) {
    return Util.DOM2SVG(event.clientX, event.clientY);
  }

  /**
   * @param {PointerEvent} event 
   * @returns {boolean}
   */
  onpointerdown(event) {
    Util.absorbEvent(event);

    /*
        https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent#Event_order

        touchstart
        zero or more touchmove events
        touchend
        mousemove
        mousedown
        mouseup
        click

        ... so Firefox sends a "touch" event followed by a "mouse" event, which we interpret as two separate events
        ... so we need to stifle the second event
        ... event.preventDefault() and/or event.preventDefault(event) don't stop it
        ... Chrome and Edge don't do this
    */
    /*
    if ( this.owner.lastEvent ) { // TODO check if this still needed with dummy touch handler
      if ( event.pointerType !== this.owner.lastEvent.pointerType && event.timeStamp < this.owner.lastEvent.timeStamp + 1000 ) {
        console.log('stifle Firefox event');
        return false;
      }
    }
    this.owner.lastEvent = event;
    */
    if ( event.pointerType === 'mouse' ) {
      if ( !(event.button === 0) ) {
        console.log('don\'t care about mouse button', event.button);
        return false;
      }
    }

    if ( this.grabbedTail ) {
      console.warn('grabbing a grabbed card', this.id);
      return false;
    }

    this.ptOriginalPointerDown = this.getPointerPoint_(event);

    this.grabbedTail = this.owner.canGrab(this);
    if ( !this.grabbedTail ) {
      console.log('cannot grab', this.id);
      // if ( !this.faceDown ) {
      //     this.markGrabbed();
      //     this.bringToTop();
      //     this.revealed = true;
      // }
      // this.addDragListeners_();
      return false;
    }

    this.grabbedTail.forEach( c => {
      c.markGrabbed();
      c.ptOriginal = Util.newPoint(c.pt);
      c.ptOffset = Util.newPoint(
        this.ptOriginalPointerDown.x - c.pt.x,
        this.ptOriginalPointerDown.y - c.pt.y
      );
      c.bringToTop();
    });

    this.addDragListeners_();

    return false;
  }

  /**
   * Scale the SVGPoint (just created from a PointerEvent) into the viewBox
   * There's probably a smarter way of doing this using some obscure API
   * @private
   * @param {SVGPoint} pt
   */
  scalePointer_(pt) {
    const r = baize.ele.getBoundingClientRect();
    const w = r.right - r.left;
    const h = r.bottom - r.top;

    const xFactor = baize.width/w;
    const xMoved = pt.x - this.ptOriginalPointerDown.x;
    const xMovedScaled = Math.round(xMoved * xFactor);

    const yFactor = baize.height/h;
    const yMoved = pt.y - this.ptOriginalPointerDown.y;
    const yMovedScaled = Math.round(yMoved * yFactor);
    // console.log(xFactor, ':', this.ptOriginalPointerDown.x, pt.x, xMoved, xMovedScaled);
    // console.log(yFactor, ':', this.ptOriginalPointerDown.y, pt.y, yMoved, yMovedScaled);
    pt.x = this.ptOriginalPointerDown.x + xMovedScaled;
    pt.y = this.ptOriginalPointerDown.y + yMovedScaled;
  }

  /**
   * @param {PointerEvent} event 
   * @returns {boolean}
   */
  onpointermove(event) {
    Util.absorbEvent(event);

    // if ( this.revealed )
    //     return false;

    const ptNew = this.getPointerPoint_(event);
    this.scalePointer_(ptNew);
    this.grabbedTail.forEach( c => {
      c.position0(ptNew.x - c.ptOffset.x, ptNew.y - c.ptOffset.y);
      // console.assert(c.ptOffset.x===ptNew.x - c.pt.x);
      // console.assert(c.ptOffset.y===ptNew.y - c.pt.y);
    });
    return false;
  }

  /**
   * @param {PointerEvent} event 
   * @returns {boolean}
   */
  onpointerup(event) {
    Util.absorbEvent(event);

    // if ( this.revealed ) {
    // this.unmarkGrabbed();
    // this.owner.cards.forEach( c => c.bringToTop() );
    // this.revealed = false;
    // this.removeDragListeners_();
    //     return false;
    // }

    const ptNew = this.getPointerPoint_(event);
    const ptNewCard = Util.newPoint(
      ptNew.x - this.ptOffset.x,
      ptNew.y - this.ptOffset.y
    );
    if ( Util.nearlySamePoint(ptNewCard, this.ptOriginal) ) {
      // console.log('nearly same point', ptNewCard, this.ptOriginal);
      this.grabbedTail.forEach( c => {
        c.position0(c.ptOriginal.x, c.ptOriginal.y);
      });
      // a click on a card just sends the click to it's owner, so we do that directly
      this.owner.onclick(this);
    } else {
      // console.log('not nearly same point', ptNewCard, this.ptOriginal);
      const cc = this.getNewOwner();
      if ( cc ) {
        this.moveTail(cc);
      } else {
        this.grabbedTail.forEach( c => {
          c.animate(c.ptOriginal);
        });
      }
    }

    this.removeDragListeners_();
    this.grabbedTail.forEach( c => {
      c.unmarkGrabbed();
    });
    this.grabbedTail = null;
    return false;
  }

  /**
   * @param {PointerEvent} event 
   */
  onpointercancel(event) {
    console.warn('pointer cancel', event);
    if ( this.grabbedTail ) {
      this.grabbedTail.forEach( c => c.animate(c.ptOriginal) );
    }
    this.grabbedTail = null;
    this.removeDragListeners_();
  }

  /**
   * Move card to end of baize so it appears on top of other cards
   * Should be using SVG z-index to do this, but it's not implemented
   * @return {void}
   */
  bringToTop() {
    baize.ele.appendChild(this.g);
  }

  /**
   * @param {boolean} undoable
   */
  flipUp(undoable=true) {
    if ( this.faceDown ) {
      this.faceDown = false;
      while ( this.g.hasChildNodes() )
        this.g.removeChild(this.g.lastChild);
      this.putRectInG_();
      if ( undoable )
        undoPushFlip(this, 'up');
    } else {
      console.warn(this.id, 'is already up');
    }
  }

  /**
   * @param {boolean} undoable
   */
  flipDown(undoable=true) {
    if ( !this.faceDown ) {
      this.faceDown = true;
      while ( this.g.hasChildNodes() )
        this.g.removeChild(this.g.lastChild);
      this.putRectInG_();
      if ( undoable )
        undoPushFlip(this, 'down');
    } else {
      console.warn(this.id, 'is already down');
    }
  }

  /**
   * Use SVG transform to position this card on the baize
   * @param {number=} x optional
   * @param {number=} y optional
   */
  position0(x=undefined, y=undefined) {
    if ( x !== undefined && y !== undefined ) {
      this.pt.x = x;
      this.pt.y = y;
    }
    this.g.setAttributeNS(null, 'transform', `translate(${this.pt.x} ${this.pt.y})`);
  }

  /**
   * @param {number} x 
   * @returns {!number}
   */
  smootherstep_(x) {
    return ((x) * (x) * (x) * ((x) * ((x) * 6 - 15) + 10));
  }

  /**
   * Animate this card to a new position
   * @param {SVGPoint} ptTo
   */
  animate(ptTo) {
    // http://sol.gfxile.net/interpolation
    console.assert(ptTo!==this.pt);    // needs a new point
    const speed = [0,50,40,30,20,10];   // index will be 1..5
    const ptFrom = Util.newPoint(this.pt);
    this.pt.x = ptTo.x; // update final pos immediately in case we're interrupted
    this.pt.y = ptTo.y;

    const distance = Util.getDistance(ptFrom, ptTo);
    if ( 0 === distance ) {
      this.inTransit = false;
      return;
    }

    let i = distance;
    const step = (timestamp) => {
      const v = this.smootherstep_(i / distance);
      const pt2 = Util.newPoint(
        Math.round((ptFrom.x * v) + (ptTo.x * (1 - v))),
        Math.round((ptFrom.y * v) + (ptTo.y * (1 - v))) );
      this.g.setAttributeNS(null, 'transform', `translate(${pt2.x} ${pt2.y})`);

      i -= distance/speed[stats.Options.aniSpeed];
      if ( i > 0 ) {
        window.requestAnimationFrame(step);
      } else {
        if ( pt2.x !== this.pt.x || pt2.y !== this.pt.y )
          this.position0();
        this.inTransit = false;
      }
    };

    this.inTransit = true;
    window.requestAnimationFrame(step);
  }

  /**
   * Move top card if this stack to another stack
   * @param {!CardContainer} to
   */
  moveTop(to) {
    const from = this.owner;

    from.pop();
    this.bringToTop();
    to.push(this);

    undoPushMove(from, to, 1);
    tallyMan.increment();
  }

  /**
   * Move a number of cards from this stack to another stack
   * @param {!CardContainer} to 
   * @param {!number} n2move 
   */
  moveSome(to, n2move) {
    const from = this.owner;
    const tmp = [];
    for ( let n=0; n<n2move; n++ ) {
      if ( from.peek() )
        tmp.push(from.pop());
    }
    const nCardsMoved = tmp.length;
    while ( tmp.length ) {
      const c = tmp.pop();
      c.bringToTop();
      to.push(c);
    }
    undoPushMove(from, to, nCardsMoved);
    tallyMan.increment();
  }

  /**
   * Move cards from this card to end of stack (the tail) to another stack
   * @param {!CardContainer} to 
   */
  moveTail(to) {
    const nCard = this.owner.cards.findIndex( e => e === this );
    this.moveSome(to, this.owner.cards.length-nCard);
  }

  /**
   * Calculate the overlap area (intersection) of this card and a card at pt2
   * @param {!SVGPoint} pt2 
   * @returns {number}
   */
  overlapArea_(pt2) {
    const rect1 = {left:this.pt.x, top:this.pt.y, right:this.pt.x + Constants.CARD_WIDTH, bottom:this.pt.y + Constants.CARD_HEIGHT};
    const rect2 = {left:pt2.x, top:pt2.y, right:pt2.x + Constants.CARD_WIDTH, bottom:pt2.y + Constants.CARD_HEIGHT};
    const xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    return xOverlap * yOverlap;
  }

  /**
   * Find an accepting CardContainer that this card overlaps the most
   * @returns {CardContainer|null}
   */
  getNewOwner() {
    let ccMost = null;
    let ovMost = 0;
    for ( let i=0; i<listOfCardContainers.length; i++ ) {
      const dst = listOfCardContainers[i];
      if ( this.owner === dst )
        continue;
      if ( this.owner.canTarget(dst) && dst.canAcceptCard(this) ) {
        const tc = dst.peek();
        let ov = this.overlapArea_(tc ? tc.pt : dst.pt);
        if ( ov > ovMost ) {
          ovMost = ov;
          ccMost = dst;
        }
      }
    }
    return ccMost;
  }

  /**
   * @param {Array<CardContainer>} ccList
   * @returns {CardContainer|null} 
   */
  findFullestAcceptingContainer(ccList) {
    let cc = null;
    for ( let i=0; i<ccList.length; i++ ) {
      const dst = ccList[i];

      if ( this.owner.canTarget(dst) && dst.canAcceptCard(this) ) {
        if ( !cc ) {
          cc = dst;
        } else if ( dst.cards.length > cc.cards.length ) {
          cc = dst;
        }
      }
    }
    return cc;
  }

  /**
   * Get a shallow copy of tail from this card to end of stack
   * @returns {!Array<Card>} 
   */
  getTail() {
    const nCard = this.owner.cards.findIndex( e => e === this );
    return this.owner.cards.slice(nCard);
  }

  /**
   * Mark this card moveable
   * (odd logic because modalSettings may turn flag on/off)
   * @param {boolean} moveable 
   */
  markMoveable(moveable) {
    if ( this.faceDown )
      return;
    if ( this.g.firstChild.localName !== 'rect' )
      return;
    const cl = this.g.firstChild.classList;
    const UN = 'unmoveable';
    if ( stats.Options.sensoryCues ) {
      if ( moveable )
        cl.remove(UN);
      else
        cl.add(UN);     // ignored if class already there
    } else {
      cl.remove(UN);
    }
  }

  markGrabbed() {
    const cl = this.g.firstChild.classList;
    cl.add('grabbed');
  }

  unmarkGrabbed() {
    const cl = this.g.firstChild.classList;
    cl.remove('grabbed');
  }

  /**
   * @returns {!Object}
   */
  getSaveableCard() {
    return {'pack':this.pack, 'suit':this.suit, 'ordinal':this.ordinal, 'faceDown':this.faceDown};
  }

  destructor() {
    this.removeListeners_();
    baize.ele.removeChild(this.g);
  }
}

let undo = [];
let undoing = false;

/**
 * @param {!CardContainer} f
 * @param {!CardContainer} t
 * @param {!number} c
 */
function undoPushMove(f, t, c) {
  if ( !undoing ) {
    undo.push({move:tallyMan.count,
      from:listOfCardContainers.findIndex(e => e === f),
      to:listOfCardContainers.findIndex(e => e === t),
      count:c});
  }
}

/**
 * @param {!Card} c
 * @param {!string} di flip direction - up or down
 */
function undoPushFlip(c, di) {
  if ( !undoing ) {
    undo.push({move:tallyMan.count, flip:c.id, dir:di});
  }
}

function doundo() {
  if ( 0 === undo.length ) {
    displayToast('nothing to undo');
    return;
  }

  undoing = true;

  const m = undo[undo.length-1].move;
  const ua = undo.filter( e => e.move === m );  // not .reverse()

  while ( ua.length ) {
    const u = ua.pop();       // console.log('undo', u);

    if ( u.hasOwnProperty('from') && u.hasOwnProperty('to') ) {
      const src = listOfCardContainers[u.from];
      const dst = listOfCardContainers[u.to];

      let n = 1;
      if ( u.count ) {
        n = u.count;
      }
      let tmp = [];
      while ( n-- ) {
        tmp.push(dst.pop());
      }
      while ( tmp.length ) {
        const c = tmp.pop();
        // console.log(c, 'going from', dst, 'to', src);
        c.bringToTop();
        src.push(c);
      }
    } else if ( (u.hasOwnProperty('turn') || u.hasOwnProperty('flip')) && u.hasOwnProperty('dir') ) {
      const c = Util.id2Card(u.hasOwnProperty('flip') ? u.flip : u.turn);
      if ( u.dir === 'up' ) {
        c.flipDown(false);
      } else if ( u.dir === 'down' ) {
        c.flipUp(false);
      } else {
        debugger;
      }
    } else {
      debugger;
    }
  }
  undo = undo.filter( e => e.move !== m );
  undoing = false;

  // robot will cause an autoMove/autoCollect loop
  tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
  reserves.forEach( res => res.scrunchCards(rules.Reserve) );
  availableMoves();   // repaint moveable cards
}

class CardContainer {
  /**
   * @param {!SVGPoint} pt 
   * @param {!SVGElement} g 
   */
  constructor(pt, g) {
    this.pt = pt;
    this.g = g;
    this.cards = [];
    this.a_deal = this.g.getAttribute('deal');
    this.stackFactor = NaN;

    // accept is either:
    // missing - we accept anything, stored as 0
    // a symbol - special rules
    // a number - card ordinal usually 1=Ace or 13=King
    // if it's missing/0, it can get overriden by rules.Foundation|Tableau.accept
    this.a_accept = g.getAttribute('accept') || 0;
    if ( this.isAcceptSymbol_() ) {
    } else {
      this.a_accept = Number.parseInt(this.a_accept, 10);
      console.assert(!isNaN(this.a_accept));
    }
    if ( this.a_accept )
      this.createAcceptSVG_();
    listOfCardContainers.push(this);
  }

  /**
   * @private
   * @returns {boolean}
   */
  isAcceptSymbol_() {
    return ( Constants.ACCEPT_NOTHING_SYMBOL === this.a_accept
      || Constants.ACCEPT_INSECT_SYMBOL === this.a_accept
      || Constants.ACCEPT_MARTHA_SYMBOL === this.a_accept );
  }

  /**
   * @private
   */
  createAcceptSVG_() {
    // gets updated by Canfield calling dostar()
    // g has .rect and .text children
    console.assert(this.a_accept);

    let oldText = this.g.querySelector('text');
    if ( oldText ) {
      if ( this.isAcceptSymbol_() )
        oldText.innerHTML = this.a_accept;
      else
        oldText.innerHTML = Constants.cardValues[this.a_accept];
    } else {
      const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
      t.classList.add('accepts');
      if ( this.isAcceptSymbol_() ) {
        t.setAttributeNS(null, 'x', String(this.pt.x + 10));
        t.setAttributeNS(null, 'y', String(this.pt.y + 24));
        t.innerHTML = this.a_accept;
      } else {
        t.setAttributeNS(null, 'x', String(this.pt.x + 4));
        t.setAttributeNS(null, 'y', String(this.pt.y + 24));
        t.innerHTML = Constants.cardValues[this.a_accept];
      }
      this.g.appendChild(t);
    }
  }

  /**
   * @param {Array} arr
   */
  load(arr) {
    this.cards.forEach( c => c.destructor() );
    this.cards = [];
    arr.forEach( a => {
      const c = new Card(a.pack, a.suit, a.ordinal, a.faceDown, this.pt);
      this.push(c);
      baize.ele.appendChild(c.g);
    });
  }

  /**
   * @returns {Card} or undefined
   */
  peek() {
    return this.cards[this.cards.length-1];
  }

  /**
   * @returns {Card} or undefined
   */
  pop() {
    const c = this.cards.pop();
    if ( c ) c.owner = null;
    return c;
  }

  /**
   * @param {!Card} c
   */
  push(c) {
    c.owner = this;
    this.cards.push(c);
    c.animate(this.pt);
  }

  /**
   * @param {!Card} c
   */
  onclick(c) {
    console.error('onclick not implemented in base CardContainer', c);
  }

  // dump() {
  //     let str = '';
  //     this.cards.forEach( c => str = str.concat(c.id + ' ') );
  //     console.log(str);
  // }

  /**
   * @param {?number} seed 
   */
  sort(seed=undefined) {
    // seed may be a number, undefined or 0
    if ( seed ) {
      console.log('reusing seed', seed);
    } else if ( stats.Options.dealWinnable && rules.Winnable.length ) {
      seed = rules.Winnable[Math.floor(Math.random()*rules.Winnable.length)];
      console.log('winnable seed', seed);
    } else {
      seed = Math.round(Math.random() * 1000000);
      console.log('new seed', seed);
    }
    const r = new Random(seed);
    // put them in a definite order before applying random seeded sort
    // we rely on card.id being a good sort key
    this.cards.sort(function(a, b) { return a.id.localeCompare(b.id); });
    // Knuth Fisher Yates
    for ( let i = this.cards.length - 1; i > 0; i-- ) {
      const n = r.nextInt(0, i);
      if ( i !== n ) {
        const tmp = this.cards[i];
        this.cards[i] = this.cards[n];
        this.cards[n] = tmp;
      }
    }

    stats[rules.Name].seed = seed;
  }

  /**
   * @param {!Card} c
   * @returns {boolean}
   */
  canAcceptCard(c) {
    console.error('can accept card not implemented', c);
    return false;
  }

  /**
   * @param {!CardContainer} cc
   * @returns {boolean}
   */
  canTarget(cc) {
    console.error('can target container not implemented', cc);
    return false;
  }

  /**
   * @param {!Card} c
   * @returns {?Array<Card>}
   */
  canGrab(c) {
    // only grab top card, we could be fanned
    if ( this.peek() === c )
      return [c];
    else
      return null;
  }

  /**
   * @private
   * @param {Card} c
   * @returns {number}
   */
  availableMovesForThisCard_(c) {
    let count = 0;
    for ( let i=0; i<listOfCardContainers.length; i++ ) {
      let dst = listOfCardContainers[i];
      if ( dst === this )
        continue;
      if ( c.owner.canTarget(dst) && dst.canAcceptCard(c) ) {
        if ( ((dst instanceof Tableau && c.owner instanceof Tableau) || (dst instanceof Cell && c.owner instanceof Cell))
          && 0 === dst.cards.length
          && c === c.owner.cards[0] ) {
          // moving empty cell/tab to empty cell/tab - legal but not useful
        } else {
          count += 1;
          c.markMoveable(true);
        }
      }
    }
    return count;
  }

  /**
   * @private
   * @returns {number}
   */
  availableMovesTopCard_() {
    // used by base CardContainer
    let count = 0;
    const c = this.peek();
    if ( c ) {
      if ( c.faceDown ) {
        count += 1;     // the move is that it can be turned up?
      } else {
        count += this.availableMovesForThisCard_(c);
      }
    }
    return count;
  }

  /**
   * @private
   * @returns {number}
   */
  availableMovesStack_() {
    // used by TableauTail, TableauFreecell
    let count = 0;
    this.cards.forEach( c => {
      if ( c.faceDown ) {
        if ( c === this.peek() ) {
          count += 1;
        }
      } else {
        c.markMoveable(false);
        if ( this.canGrab(c) ) {
          count += this.availableMovesForThisCard_(c);
        }
      }
    });
    return count;
  }

  /**
   * @private
   * @returns {number}
   */
  avilableMovesStackAll_() {
    // used by Stock, Waste
    let count = 0;
    this.cards.forEach( c => {
      c.markMoveable(false);
      listOfCardContainers.forEach( dst => {
        if ( dst !== this ) {
          const oldFaceDown = c.faceDown;
          c.faceDown = false;
          if ( c.owner.canTarget(dst) && dst.canAcceptCard(c) ) {
            c.markMoveable(true);
            count++;
          }
          c.faceDown = oldFaceDown;
        }
      });
    });
    return count;
  }

  /**
   * @returns {number}
   */
  availableMoves() {
    // default just test top card; can be overridden by derived classes
    this.cards.forEach( c => c.markMoveable(false) );
    return this.availableMovesTopCard_();
  }

  /**
   * Bury a card (the King) in Baker's Dozen
   * @private
   */
  bury_() {
    const b = this.cards.filter( c => c.ordinal === rules.Tableau.bury );
    if ( b ) {
      console.log('burying', rules.Tableau.bury);
      const tmp = b.concat(
        this.cards.filter( c => c.ordinal !== rules.Tableau.bury )
      );
      // console.log(this.cards, ':=', tmp);
      this.cards = [];
      tmp.forEach( c => {
        c.bringToTop();
        this.push(c);
      });
    }
  }

  /**
   * 
   */
  deal() {
    if ( !this.a_deal ) {
      //console.warn('no deal specified', this);
      return;
    }
    for ( let i=0; i<this.a_deal.length; i++ ) {
      let c = null;
      const ch = this.a_deal.charAt(i);
      if ( 'dDuU'.includes(ch) ) {
        c = stock.pop();
        if ( !c ) {
          // StockFan will trigger this
          console.warn('out of stock during deal', this);
          return;
        }
      } else if ( 'Pp'.includes(ch) ) {
        /*
            The beak; see http://www.parlettgames.uk/patience/penguin.html
            Move the three other cards of the same ordinal in this Stock to Foundations[0,1,2]
            Then place this card as if it were an 'u'
        */
        c = stock.pop();
        const stock3 = stock.cards.filter( sc => sc.ordinal === c.ordinal );
        console.assert(stock3.length===3);
        stock3.forEach( sc => sc.flipUp(false) );
        stock.cards = stock.cards.filter( sc => sc.ordinal !== c.ordinal );
        for ( let i=0; i<stock3.length; i++ )
          foundations[i].push(stock3[i]);
      } else if ( '♥♦♣♠'.includes(ch) ) {
        // e.g. ♥01
        const suit = ch;
        const ord = Number.parseInt(this.a_deal.slice(1), 10);
        const idx = stock.cards.findIndex( e => e.suit === suit && e.ordinal === ord );
        i = this.a_deal.length;     // to break out of loop
        if ( idx > -1 ) {
          c = stock.cards.splice(idx, 1)[0];  // returns an array of deleted items
          c.flipUp(false);
        } else {
          console.error('cannot find', suit, ord, 'in stock');
          return;
        }
      } else {
        console.error('unexpected character in deal', ch);
      }

      c.bringToTop();
      this.push(c);

      if ( 'd' === ch ) {
        c.flipDown(false);
      // } else if ( 'u' === ch ) {
      //   // popping off stock flips card up automatically
      }
    }

    if ( rules.Tableau.bury ) {
      // pause so user can see what's happening
      window.setTimeout(this.bury_.bind(this), 1000);
    }
  }

  /**
   * @private
   * @param {number} lim
   * @returns {number}
   */
  dynamicX_(lim = this.cards.length) {
    let x = this.pt.x;
    for ( let i=0; i<lim; i++ )
      x += this.cards[i].faceDown
        ? Constants.FACEDOWN_STACK_WIDTH
        : Math.round(Constants.CARD_WIDTH/this.stackFactor);
    return x;
  }

  /**
   * @private
   * @returns {Array<number>}
   */
  dynamicArrayX_() {
    const arr = new Array(this.cards.length);
    arr[0] = this.pt.x;
    for ( let i=1; i<this.cards.length; i++ ) {
      arr[i] = arr[i-1] + (this.cards[i-1].faceDown
        ? Constants.FACEDOWN_STACK_WIDTH
        : Math.round(Constants.CARD_WIDTH/this.stackFactor));
    }
    return arr;
  }

  /**
   * returns the y position of a stacked card
   * @private
   * @param {number} n - the card whose position we want;
   * if not specified, the position of the next card to be pushed is returned
   * @return {number} y
   */
  dynamicY_(n = this.cards.length) {
    let y = this.pt.y;
    for ( let i=0; i<n; i++ )
      y += this.cards[i].faceDown
        ? Constants.FACEDOWN_STACK_HEIGHT
        : Math.round(Constants.CARD_HEIGHT/this.stackFactor);
    return y;
  }

  /**
   * @private
   * @returns {Array<number>}
   */
  dynamicArrayY_() {
    const arr = new Array(this.cards.length);
    arr[0] = this.pt.y;
    for ( let i=1; i<this.cards.length; i++ ) {
      arr[i] = arr[i-1] + (this.cards[i-1].faceDown
        ? Constants.FACEDOWN_STACK_HEIGHT
        : Math.round(Constants.CARD_HEIGHT/this.stackFactor));
    }
    return arr;
  }

  /**
   * @private
   * @param {Object} rules 
   */
  resetStackFactor_(rules) {
    switch ( rules.fan ) {
      case 'Right':
      case 'Left':    this.stackFactor = Constants.DEFAULT_STACK_FACTOR_X;    break;
      case 'Down':    this.stackFactor = Constants.DEFAULT_STACK_FACTOR_Y;    break;
      case 'None':    this.stackFactor = 0;                                   break;
    }
  }

  /**
   * @param {Object} rules 
   */
  scrunchCards(rules) {
    const oldStackFactor = this.stackFactor;

    if ( rules.fan === 'Down' ) {
      this.stackFactor = Constants.DEFAULT_STACK_FACTOR_Y;
      const max = rules.maxfan === 0 ? baize.height - this.pt.y : this.pt.y + rules.maxfan;

      let arr = this.dynamicArrayY_();
      while ( arr[arr.length-1] + Constants.CARD_HEIGHT > max && this.stackFactor < Constants.MAX_STACK_FACTOR ) {
        this.stackFactor += (1.0/3.0);
        arr = this.dynamicArrayY_();
      }
      if ( this.stackFactor !== oldStackFactor ) {
        for ( let i=0; i<this.cards.length; i++ ) {
          const c = this.cards[i];
          c.position0(this.pt.x, arr[i]);
          // const pt = Util.newPoint(this.pt.x, arr[i]);
          // c.animate(pt);
        }
      }
    } else if ( rules.fan === 'Right' ) {
      this.stackFactor = Constants.DEFAULT_STACK_FACTOR_X;
      const max = rules.maxfan === 0 ? baize.width - this.pt.x : this.pt.x + rules.maxfan;

      let arr = this.dynamicArrayX_();
      while ( arr[arr.length-1] + Constants.CARD_WIDTH > max && this.stackFactor < Constants.MAX_STACK_FACTOR ) {
        this.stackFactor += (1.0/3.0);
        arr = this.dynamicArrayX_();
      }
      if ( this.stackFactor !== oldStackFactor ) {
        for ( let i=0; i<this.cards.length; i++ ) {
          const c = this.cards[i];
          c.position0(arr[i], this.pt.y);
        }
      }
    } else if ( rules.fan === 'None' ) {
    } else {
      console.error('Unknown scrunch fan', rules.fan);
    }
  }

  /**
   * @returns {boolean}
   */
  isSolveable() {
    console.error('is solveable not implemented', this);
    return false;
  }

  /**
   * @returns {boolean}
   */
  isComplete() {
    return 0 === this.cards.length;
  }

  /**
   * @returns {Array}
   */
  getSaveableCards() {
    const o = [];
    this.cards.forEach(c => o.push(c.getSaveableCard()));
    return o;
  }

  /**
   * @abstract
   */
  autoMove() {
  }

  /**
   * @returns {string}
   */
  english() {
    return 'There is no explanation for this';
  }
}

class Cell extends CardContainer {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    if ( !stats.Options.autoPlay )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      c.moveTop(cc);
  }

  /**
   * @override
   * @param {Card} c
   * @returns {boolean} 
   */
  canAcceptCard(c) {
    if ( c !== c.owner.peek() )
      return false;   // can't accept a stack of cards
    return 0 === this.cards.length;
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean} 
   */
  canTarget(cc) {
    if ( null === rules.Cell.target )
      return true;
    return ( rules.Cell.target === cc.constructor.name );
  }

  /**
   * @override
   * @returns {boolean} 
   */
  isSolveable() {
    return true;
  }

  /**
   * @override
   */
  english() {
    return `Cell ${countInstances(Cell)}. Can store one card of any type.`;
  }
}

class CellCarpet extends Cell {
  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    // TODO total fudge
    this.cards.forEach( c => c.markMoveable(true) );
    return this.cards.length;
  }

  /**
   * @override
   */
  autoMove() {
    if ( 0 === this.cards.length ) {
      let c = waste.peek();
      if ( !c )
        c = stock.peek();
      if ( c ) {
        tallyMan.decrement();
        c.moveTop(this);
      }
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Spaces are automatically filled with the top card from the waste or stock.';
    return e;
  }
}

class Reserve extends CardContainer {
  /**
   * 
   * @param {SVGPoint} pt 
   * @param {SVGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.resetStackFactor_(rules.Reserve);
  }

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    // DRY same as Tableau.push
    if ( 0 === this.cards.length )
      this.resetStackFactor_(rules.Reserve);

    let pt = null;
    if ( rules.Reserve.fan === 'Down' )
      pt = Util.newPoint(this.pt.x, this.dynamicY_());
    else if ( rules.Reserve.fan === 'Right' )
      pt = Util.newPoint(this.dynamicX_(), this.pt.y);
    else if ( rules.Reserve.fan === 'None' )
      pt = Util.newPoint(this.pt.x, this.pt.y);
    c.owner = this;
    this.cards.push(c);
    c.animate(pt);
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // can be face up or face down
    if ( c.faceDown )
      return;
    if ( c !== this.peek() )
      return;
    if ( !stats.Options.autoPlay )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      c.moveTop(cc);
  }

  /**
   * @override
   * @param {Card} c
   * @returns {boolean}
   */
  canAcceptCard(c) {
    return false;
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean} 
   */
  canTarget(cc) {
    if ( null === rules.Reserve.target )
      return true;
    return ( rules.Reserve.target === cc.constructor.name );
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    return 0 === this.cards.length;
  }

  /**
   * @override
   */
  autoMove() {
    // same as Tableau
    const c = this.peek();
    if ( c && c.faceDown ) {
      tallyMan.decrement();
      c.flipUp();
      tallyMan.increment();
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    return `Reserve ${countInstances(Reserve)}. Stores multiple cards of any type. You cannot move a card to a reserve stack.`;
  }
}

class ReserveFrog extends Reserve {
  // Thirteen cards are dealt face up to become the reserve, also known as the "Frog."
  // Any aces that are about to be dealt are separated and placed in the foundations;
  // they are not counted in the reserve count.
  /**
   * @override
   */
  deal() {
    while ( this.cards.length < 13 ) {
      const c = stock.pop();
      if ( 1 === c.ordinal ) {
        for ( let i=0; i<foundations.length; i++ ) {
          const dst = foundations[i];
          if ( 0 === dst.cards.length ) {  // c will have no owner, so can't use canAcceptCard
            dst.push(c);
            break;
          }
        }
      } else {
        c.bringToTop();
        this.push(c);   // popping off stock flips card up
      }
    }

    // In case there is no ace segregated in making the reserve,
    // an ace is removed from the stock to become the first foundation.
    if ( !foundations.some( f => f.cards.length > 0 ) ) {
      const idx = stock.cards.findIndex( c => 1 === c.ordinal );
      const c = stock.cards.splice(idx, 1)[0];    // returns array of deleted items
      foundations[0].push(c);
      c.flipUp(false);
    }
  }
}

class Stock extends CardContainer {
  /**
   * @param {SVGPoint} pt
   * @param {SVGElement} g
   */
  constructor(pt, g) {
    super(pt, g);

    if ( rules.Stock.hidden ) {
      this.g.style.display = 'none';
    }

    /** number */this.redeals = rules.Stock.redeals;
    // this.updateRedealsSVG_();

    g.onclick = this.clickOnEmpty.bind(this);

    if ( !stats.Options.loadSaved || !stats[rules.Name].saved )
      this.createPacks_();
  }

  /**
   * @private
   */
  createPacks_() {
    for ( let ord=1; ord<Constants.cardValues.length; ord++ ) {
      for ( let p=0; p<rules.Stock.packs; p++ ) {
        for ( let s of rules.Stock.suitfilter ) { // defaults to '♠♥♦♣'
          const c = new Card(p, s, ord, true, this.pt); // created on top of stock container
          c.owner = this;
          this.cards.push(c);
        }
      }
    }
    if ( this.cards.length !== (rules.Stock.packs*52) ) { console.warn(this.cards.length, ' cards in pack'); }
    this.sort();
    this.cards.forEach( c => baize.ele.appendChild(c.g) );
  }

  /**
   * @private
   */
  createRedealsSVG_() {
    // only called by StockCruel, StockKlondike, StockFan
    const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
    t.classList.add('stockredeals');
    t.setAttributeNS(null, 'x', String(this.pt.x + 12));
    t.setAttributeNS(null, 'y', String(this.pt.y + 66));
    t.innerHTML = Constants.REDEALS_SYMBOL;
    this.g.appendChild(t);
  }

  /**
   * @private
   */
  updateRedealsSVG_() {
    // g has rect and text children
    let txt = this.g.querySelector('text');
    if ( txt ) {
      if ( 0 === this.redeals )
      // if ( 0 === this.cards.length && 0 === this.redeals )
      // if ( this.redealsAvailable() )
        txt.innerHTML = '';
      else
        txt.innerHTML = Constants.REDEALS_SYMBOL;
    }
    // else we don't have a redeals indicator
  }

  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();
    if ( c && c.faceDown )
      c.flipUp(false);    // automatic
    if ( 0 === this.cards.length ) {
      this.updateRedealsSVG_();
    }
    return c;
  }

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    super.push(c);
    if ( !c.faceDown )
      c.flipDown(false);  // automatic
  }

  /**
   * @returns {boolean}
   */
  redealsAvailable() {
    // infinite redeals when this.redeals is null
    return ( (null === this.redeals) || (Number.isInteger(this.redeals) && (this.redeals > 0)) );
  }

  /**
   * 
   */
  decreaseRedeals() {
    if ( Number.isInteger(this.redeals) ) {
      this.redeals -= 1;
      this.updateRedealsSVG_();
      undo.length = 0;
    }
  }

  clickOnEmpty() {
    if ( waste && this.redealsAvailable() ) {
      tallyMan.sleep( () => {
        for ( let c=waste.peek(); c; c=waste.peek() ) {
          c.moveTop(stock);
        }
        this.decreaseRedeals();
      });
    }
  }

  /**
   * @override
   * @param {Card} c 
   * @returns {boolean}
   */
  canAcceptCard(c) {
    return false;
  }

  /**
   * @override
   * @param {CardContainer} cc 
   * @returns {boolean}
   */
  canTarget(cc) {
    // override base class to implement
    if ( null === rules.Stock.target )
      return true;
    return ( rules.Stock.target === cc.constructor.name );
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    return 0 === this.cards.length;
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.avilableMovesStackAll_();
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let r = '';
    if ( null === rules.Stock.redeals )
      r = 'The stock can be redealt any number of times';
    else if ( Number.isInteger(rules.Stock.redeals) && rules.Stock.redeals > 0 )
      r = `The stock can be redealt ${Util.plural(rules.Stock.redeals, 'time')}`;
    else
      r = 'The stock cannot be redealt';

    if ( rules.Stock.hidden )
      return `The game uses ${Util.plural(rules.Stock.packs, 'pack')} of cards.`;
    else
      return `Stock ${countInstances(Stock)}. The stock is made from ${Util.plural(rules.Stock.packs, 'pack')} of cards. ${r}.`;
  }
}

class StockKlondike extends Stock {
  // moves cards to Waste when clicked
  /**
   * @param {SVGPoint} pt 
   * @param {SVGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.createRedealsSVG_();
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // override to move 1 or 3 cards at once to waste
    if ( Number.isInteger(rules.Waste.maxcards) && !(waste.cards.length < rules.Waste.maxcards) )
      return;
    c.moveSome(waste, rules.Stock.cards);
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will transfer ${Util.plural(rules.Stock.cards, 'card')} to the waste stack.`;
  }
}

class StockAgnes extends Stock {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    tallyMan.sleep( () => {
      for ( let i=0; i<reserves.length; i++ ) {
        const c = this.peek();
        if ( !c )
          break;
        c.moveTop(reserves[i]);
      }
    });
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will transfer one card to each of the reserve stacks.`;
  }
}

class StockScorpion extends Stock {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    tallyMan.sleep( () => {
      for ( let i=0; i<tableaux.length; i++ ) {
        const c = this.peek();
        if ( !c )
          break;
        c.moveTop(tableaux[i]);
      }
    });
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    return 'Clicking on the stock will transfer one card to each of the tableaux stacks.';
  }
}

class StockSpider extends Stock {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    if ( tableaux.some( t => t.cards.length === 0 ) ) {
      // could use tableaux.reduce, but it's less readable
      let tabCards = 0;
      tableaux.forEach( t => tabCards += t.cards.length );
      if ( tabCards >= tableaux.length ) {
        displayToast('all spaces in the tableau must be filled before a new row is dealt');
        return;
      }
    }
    tallyMan.sleep( () => {
      for ( let i=0; i<tableaux.length; i++ ) {
        const c = this.peek();
        if ( !c )
          break;
        c.moveTop(tableaux[i]);
      }
    });
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    return 'Clicking on the stock will transfer one card to each of the tableaux stacks, if all spaces in the tableaux have been filled.';
  }
}

class StockGolf extends Stock {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    c.moveTop(foundations[0]);
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will transfer one to the foundation stack.`;
  }
}

class StockCruel extends Stock
{
  /**
   * 
   * @param {SVGPoint} pt 
   * @param {SVGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.createRedealsSVG_();
  }

  /**
   * @private
   * @returns {Array}
   */
  part1_()
  {
    const tmpCards = [];
    for ( let i=tableaux.length-1; i>=0; i-- )
    {
      const src = tableaux[i].cards;
      const tmp = [];
      while ( src.length )
        tmp.push(src.pop());
      while ( tmp.length )
        tmpCards.push(tmp.pop());
    }
    /*
    for ( let i=1; i<tableaux.length; i++ )
    {
        const src = tableaux[i].cards;
        console.assert(src.length===0);
    }
    */
    return tmpCards;
  }

  /**
   * @private
   * @param {Array} tmp 
   */
  part2_(tmp) {
    for ( let i=0; i<tableaux.length; i++ ) {
      const dst = tableaux[i].cards;
      const n = tableaux[i].a_deal.length;
      const t = tmp.splice(-n, n);
      if ( 0 === t.length )
        break;

      for ( let n=0; n<t.length; n++ ) {
        dst.push(t[n]);
      }
    }
  }

  /**
   * @private
   */
  part3_() {
    for ( let i=0; i<tableaux.length; i++ ) {
      const tab = tableaux[i];
      for ( let j=0; j<tab.cards.length; j++ ) {
        const c = tab.cards[j];
        c.owner = tab;
        c.bringToTop();
        if ( rules.Tableau.fan === 'Down' )
          c.animate(Util.newPoint(tab.pt.x, tab.dynamicY_(j)));
        else if ( rules.Tableau.fan === 'Right' )
          c.animate(Util.newPoint(tab.dynamicX_(j), tab.pt.y));
      }
    }
  }

  clickOnEmpty() {
    if ( this.redealsAvailable() ) {
      const tmp = this.part1_();
      this.part2_(tmp);
      this.part3_();

      undo.length = 0;

      if ( 1 === availableMoves() )   // repaint moveable cards
        displayToastNoAvailableMoves();
      else
        tallyMan.increment();

      this.decreaseRedeals();
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    if ( this.redealsAvailable() )
      return 1;
    else
      return 0;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will collect and then redeal the tableaux stacks.`;
  }
}

class StockFan extends Stock {
  /**
   * 
   * @param {SVGPoint} pt 
   * @param {SVGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.createRedealsSVG_();
  }

  clickOnEmpty() {
    if ( this.redealsAvailable() ) {
      // move all cards back to stock, can't use pop and push
      // because that will register in undo
      tableaux.forEach( t => {
        stock.cards = stock.cards.concat(t.cards);
        t.cards = [];
      });
      stock.cards.forEach( c => {
        c.owner = stock;
        // all fan games are all face up?
        // if ( !c.faceDown )
        //     c.flipDown();
        c.position0(stock.pt.x, stock.pt.y);
      });

      const oldSeed = stats[rules.Name].seed;
      stock.sort(123456);         // just some made up, reproduceable seed
      stats[rules.Name].seed = oldSeed;   // sort(n) over-writes this
      undo.length = 0;            // can't undo a jumble

      tableaux.forEach( t => {
        window.setTimeout( () => t.deal(), 0 );
      });

      waitForCards().then ( () => {
        if ( 1 === availableMoves() )   // repaint moveable cards
          displayToastNoAvailableMoves();
        else
          tallyMan.increment();

        this.decreaseRedeals();
      });
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    if ( this.redealsAvailable() )
      return 1;
    else
      return 0;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will collect and then redeal the tableaux stacks.`;
  }
}

class Waste extends CardContainer {
  /**
   * @private
   * @returns {number}
   */
  middleX_() { return this.pt.x + Constants.CARD_WIDTH_STACKED; }
  /**
   * @private
   * @returns {number}
   */
  rightX_() { return this.pt.x + Constants.CARD_WIDTH_STACKED * 2; }

  /**
   * @override
   * @param {Card} c 
   */
  push(c) {
    let ptNew = Util.newPoint(this.pt);
    if ( 0 === this.cards.length ) {
      // incoming card will go to left position

    } else if ( 1 === this.cards.length ) {
      // incoming card will go to middle position
      ptNew.x = this.middleX_();
    } else if ( 2 === this.cards.length ) {
      // incoming card will go to right position
      ptNew.x = this.rightX_();
    } else {
      // incoming card will go to right position
      ptNew.x = this.rightX_();
      // card in middle needs to go to left position
      const cMiddle = this.cards[this.cards.length-2];
      const ptLeft = Util.newPoint(this.pt.x, this.pt.y);
      cMiddle.animate(ptLeft);
      // card on right (top card) needs to go to middle position
      const cTop = this.peek();
      const ptMiddle = Util.newPoint(this.middleX_(), this.pt.y);
      cTop.animate(ptMiddle);
    }
    c.owner = this;
    this.cards.push(c);
    if ( c.faceDown )
      c.flipUp(false);
    c.animate(ptNew);
  }

  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();      console.assert(!c.faceDown);

    if ( this.cards.length > 2 ) {
      // top card needs to go to right position
      const cTop = this.cards[this.cards.length-1];
      const ptRight = Util.newPoint(this.rightX_(), this.pt.y);
      cTop.animate(ptRight);

      // top-1 card needs to go to middle position
      const cTop1 = this.cards[this.cards.length-2];
      const ptMiddle = Util.newPoint(this.middleX_(), this.pt.y);
      cTop1.animate(ptMiddle);

      // top-2 card needs to go to left position
      const cTop2 = this.cards[this.cards.length-3];
      const ptLeft = Util.newPoint(this.pt.x, this.pt.y);
      cTop2.animate(ptLeft);
    }

    return c;
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // always face up
    if ( !stats.Options.autoPlay )
      return;

    if ( c !== this.peek() )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(cells);      // Carpet
    if ( cc ) {
      c.moveTop(cc);
    }
  }

  /**
   * @override
   * @param {Card} c 
   */
  canAcceptCard(c) {
    if ( Number.isInteger(rules.Waste.maxcards) && !(this.cards.length < rules.Waste.maxcards) )
      return false;
    return (c.owner instanceof Stock) && (1 === rules.Stock.cards);
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean} 
   */
  canTarget(cc) {
    if ( null === rules.Waste.target )
      return true;
    return ( rules.Waste.target === cc.constructor.name );
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    return 0 === this.cards.length;
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    if ( stock.redeals === null || stock.redeals > 0 )  // TODO type warning; redeals does not exist on CardContainer (but it does in Stock)
      return this.avilableMovesStackAll_();
    else
      return super.availableMoves();   // just the top card
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    return `Waste ${countInstances(Waste)}. Cards can be be moved from here to tableaux or foundations.`;
  }
}

class Foundation extends CardContainer {

  /**
   * @param {SVGPoint} pt
   * @param {SVGElement} g
   */
  constructor(pt, g) {
    super(pt, g);
    this.resetStackFactor_(rules.Foundation);
    this.scattered = false;
    if ( 0 === this.a_accept && rules.Foundation.accept ) {
      // accept not specified in guts, so we use rules
      this.a_accept = rules.Foundation.accept;
      this.createAcceptSVG_();
    }
    this.a_complete = this.g.getAttribute('complete');  // e.g. "♥01"
    if ( this.a_complete ) {
      this.a_completeSuit = this.a_complete.charAt(0);
      this.a_completeOrd = Number.parseInt(this.a_complete.slice(1), 10);
    }
    this.a_reverse = !!(this.g.getAttribute('reverse') || 0);
    if ( this.a_reverse ) {
      // make a copy of the rules before changing them
      this.rules = JSON.parse(JSON.stringify(rules.Foundation));
      if ( 1 === this.rules.rank )  // up
        this.rules.rank = 2;        // down
    } else {
      this.rules = rules.Foundation;
    }
  }

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    // override to fan
    console.assert(!c.faceDown);
    let pt = null;
    if ( rules.Foundation.fan === 'Down' )
      pt = Util.newPoint(this.pt.x, this.dynamicY_());
    else if ( rules.Foundation.fan === 'Right' )
      pt = Util.newPoint(this.dynamicX_(), this.pt.y);
    else if ( rules.Foundation.fan === 'None' )
      pt = Util.newPoint(this.pt.x, this.pt.y);
    c.owner = this;
    this.cards.push(c);
    c.animate(pt);
  }

  /**
   * @override
   * @param {Card} c
   */
  onclick(c) {
    console.assert(!c.faceDown);
    if ( !stats.Options.playFromFoundation )
      return;
    if ( !stats.Options.autoPlay )
      return;
    let cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      c.moveTop(cc);
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    return true;
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    // override - we don't allow play from foundation
    this.cards.forEach( c => c.markMoveable(false) );
    return 0;
  }

  /**
   * @override
   * @param {Card} c
   * @returns {boolean}
   */
  canAcceptCard(c) {
    let accept = true;
    if ( c.owner.peek() !== c ) {
      // Tableau or Reserve, needs to be top card only
      accept = false;
    } else {
      const fc = this.peek();
      if ( !fc ) {
        if ( this.a_accept ) {   // 0 or missing to accept any card
          accept = ( c.ordinal === this.a_accept );
        }
      } else {
        accept = isConformant0(this.rules, fc, c);
      }
    }
    return accept;
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean}
   */
  canTarget(cc) {
    // override base class to implement
    if ( null === rules.Foundation.target )
      return true;
    return ( rules.Foundation.target === cc.constructor.name );
  }

  /**
   * @override
   * @param {Card} c 
   * @returns {Array|null}
   */
  canGrab(c) {
    if ( stats.Options.playFromFoundation )
      return [c];
    return null;
  }

  /**
   * @param {number} ord 
   */
  solve(ord) {
    const _solve = (c) => {
      if ( c && !c.faceDown ) {
        if ( ord === 0 || c.ordinal === ord ) {
          if ( c.owner.canTarget(this) && this.canAcceptCard(c) ) {
            c.moveTop(this);
            cardMoved = true;
          }
        }
      }
    };

    let cardMoved = false;
    cells.forEach( cc => {
      _solve(cc.peek());
    });
    tableaux.forEach( t => {
      _solve(t.peek());
    });
    return cardMoved;
  }

  /**
   * @override
   * @returns {boolean}
   */
  isComplete() {
    if ( this.a_complete ) {
      // Grandfather's Clock
      const c = this.peek();
      return ( !!c && c.ordinal === this.a_completeOrd && c.suit === this.a_completeSuit );
    }
    /*
      Because of the Bisley/reverse foundation problem, a game is complete if
      every container except a foundation is empty, rather than a game being
      complete when every foundation contains (13) cards.
    */
    return true;
  }

  scatter() {
    if ( !this.scattered ) {
      this['scatter'+rules.Foundation.scatter]();
      this.scattered = true;
    }
  }

  scatterNone() {
    function scat() {
      this.markMoveable(true);
    }

    this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
  }

  scatterCircle() {
    function scat() {
      this.markMoveable(true);
      let angle = this.owner.cards.indexOf(this) * (360 / this.owner.cards.length);
      angle = Math.PI * angle / 180;
      const radius = 150;
      const pt = Util.newPoint(
        200 + radius * Math.cos(angle),
        250 + radius * Math.sin(angle));
      this.animate(pt);
    }

    this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
  }

  scatterDown() {
    function scat() {
      this.markMoveable(true);
      const pt = Util.newPoint(
        this.pt.x,
        this.pt.y + ((this.ordinal-1) * Math.round(Constants.CARD_HEIGHT/3)));
      this.animate(pt);
    }

    this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
  }

  scatterLeft() {
    function scat() {
      this.markMoveable(true);
      const pt = Util.newPoint(
        this.pt.x - ((this.ordinal-1) * Math.round(Constants.CARD_WIDTH/2)),
        this.pt.y);
      this.animate(pt);
    }
    for ( let i=this.cards.length-1; i>=0; i-- ) {
      const c = this.cards[i];
      window.setTimeout(scat.bind(c), 500);
    }
  }

  scatterRight() {
    function scat() {
      this.markMoveable(true);
      const pt = Util.newPoint(
        this.pt.x + ((this.ordinal-1) * Math.round(Constants.CARD_WIDTH/2)),
        this.pt.y);
      this.animate(pt);
    }
    for ( let i=this.cards.length-1; i>=0; i-- ) {
      const c = this.cards[i];
      window.setTimeout(scat.bind(c), 500);
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    if ( rules.Foundation.hidden )
      return '';
    else if ( this.a_complete )
      return `Foundation ${countInstances(Foundation)}. Build ${englishRules(rules.Foundation)}. The game is complete when each stack has a certain card on top.`;
    else
      return `Foundation ${countInstances(Foundation)}. Build ${englishRules(rules.Foundation)}. `;
  }
}

class FoundationCanfield extends Foundation {

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    super.push(c);
    // set a_accept after first card is pushed
    if ( this === foundations[0] && 1 === this.cards.length ) {
      // console.log('a_accept will be', c.ordinal);
      foundations.forEach( f => {
        f.a_accept = c.ordinal;
        f.createAcceptSVG_();
      });
    }
  }
}

class FoundationOsmosis extends FoundationCanfield {

  /**
   * @override
   * @param {Card} c
   * @returns {boolean}
   */
  canAcceptCard(c) {
    if ( 0 === this.cards.length )
      return c.ordinal === this.a_accept;
    // A card can be moved to a foundation if a card of the same value has already been placed in the foundation above it.
    if ( c.suit !== this.cards[0].suit )
      return false;
    const fidx = foundations.findIndex( f => f === this );
    if ( 0 === fidx )
      return true;
    return foundations[fidx-1].cards.findIndex( fc => fc.ordinal === c.ordinal ) >= 0;
  }
}

class FoundationPenguin extends Foundation {
// set a_accept on Foundation and Tableau after first card is pushed
/*
    When you empty a column, you may fill the space it leaves with a card one rank lower than the rank of the beak,
    together with any other cards attached to it in descending suit-sequence. For example, since the beak is a Ten,
    you can start a new column only with a Nine, or a suit-sequence headed by a Nine.

    Agnes rules from PGS: "Spaces (in the tableau) are filled by a card or legal
    group of cards headed by a card one rank below the foundation base card."
*/
  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    super.push(c);
    if ( this === foundations[0] && 1 === this.cards.length ) {
      // console.log('a_accept will be', c.ordinal);
      foundations.forEach( f => {
        f.a_accept = c.ordinal;
        f.createAcceptSVG_();
      });
      const o = c.ordinal === 1 ? 13 : c.ordinal - 1;
      tableaux.forEach( t => {
        t.a_accept = o;
        t.createAcceptSVG_();
      });
    }
  }
}

class FoundationGolf extends Foundation {

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    // override to fan card to the right
    console.assert(!c.faceDown);
    const pt = Util.newPoint(
      this.pt.x + (this.cards.length * 4),  // TODO magic number
      this.pt.y);
    c.owner = this;
    this.cards.push(c);
    c.animate(pt);
  }
}

class FoundationSpider extends Foundation {

  /**
   * @override
   * @param {Card} c 
   * @returns {boolean}
   */
  canAcceptCard(c) {
    if ( this.cards.length )
      return false;
    if ( c.ordinal !== 13 )
      return false;
    const tail = c.getTail();
    if ( tail.length !== 13 )
      return false;
    return isConformant(this.rules, tail);
  }

  /**
   * @param {number=} ord 
   * @returns {boolean}
   */
  solve(ord=0) {
    if ( this.cards.length )
      return false;

    let cardMoved = false;
    tableaux.forEach( t => {
      if ( t.cards.length >= 13 ) {
        for ( let i=0; i<t.cards.length; i++ ) {
          const c = t.cards[i];
          if ( c.faceDown )
            continue;
          if ( 13 === c.ordinal ) {
            const tail = c.getTail();
            if ( 13 === tail.length && isConformant(this.rules, tail) ) {
              c.moveTail(this);
              cardMoved = true;
              break;
            }
          }
        }
      }
    });
    return cardMoved;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    return `Foundation ${countInstances(Foundation)}. Completed sequences of cards are automatically moved to the foundation.`;
  }
}

class Tableau extends CardContainer {
  /**
   * @param {SVGPoint} pt
   * @param {SVGElement} g
   */
  constructor(pt, g) {
    super(pt, g);
    this.resetStackFactor_(rules.Tableau);
    if ( 0 === this.a_accept && rules.Tableau.accept )
    {   // accept not specified in guts, so we use rules
      this.a_accept = rules.Tableau.accept;
      this.createAcceptSVG_();
    }
  }

  /**
   * @override
   * @param {Card} c 
   */
  push(c) {   // DRY same as Reserve.push
    if ( 0 === this.cards.length )
      this.resetStackFactor_(rules.Tableau);

    let pt = null;
    if ( rules.Tableau.fan === 'Down' )
      pt = Util.newPoint(this.pt.x, this.dynamicY_());
    else if ( rules.Tableau.fan === 'Right' )
      pt = Util.newPoint(this.dynamicX_(), this.pt.y);
    else if ( rules.Tableau.fan === 'None' )
      pt = Util.newPoint(this.pt.x, this.pt.y);
    c.owner = this;
    this.cards.push(c);
    c.animate(pt);
  }

  /**
   * @override
   * @param {Card} c 
   * @returns {boolean}
   */
  canAcceptCard(c) {
    let accept = true;

    if ( Number.isInteger(rules.Tableau.maxcards) && !(this.cards.length < rules.Tableau.maxcards) ) {
      accept = false;
    } else if ( c.owner === this ) {
      accept = false;
    } else {
      let tc = this.peek();
      if ( !tc ) {
        if ( 0 === this.a_accept ) {
          accept = true;
        } else if ( Constants.ACCEPT_MARTHA_SYMBOL === this.a_accept ) {
          accept = 1 === c.owner.canGrab(c).length;
        } else if ( this.a_accept ) {  // a number or a symbol
          accept = ( c.ordinal === this.a_accept );
        }
      } else {
        accept = isConformant0(rules.Tableau.build, tc, c);
      }
    }
    return accept;
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean}
   */
  canTarget(cc) {
    if ( null === rules.Tableau.target )
      return true;
    return ( rules.Tableau.target === cc.constructor.name );
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    if ( c.faceDown )
      return;

    if ( !stats.Options.autoPlay )
      return;

    if ( !this.canGrab(c) )
      return;

    let cc = null;
    if ( this.peek() === c )
      cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( !cc && this.peek() === c )
      cc = c.findFullestAcceptingContainer(cells);
    if ( cc )
      c.moveTail(cc);
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    if ( this.cards.length )
      return isConformant(rules.Tableau.build, this.cards);
    else
      return true;
  }

  /**
   * @override
   */
  autoMove() {
    // same as Reserve
    const c = this.peek();
    if ( c && c.faceDown ) {
      tallyMan.decrement();
      c.flipUp();
      tallyMan.increment();
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let r = '';
    if ( rules.Tableau.build.suit === rules.Tableau.move.suit
      && rules.Tableau.build.rank === rules.Tableau.move.rank )
      r = `Tableau ${countInstances(Tableau)}. Build ${englishRules(rules.Tableau.build)}.`;
    else
      r = `Tableau ${countInstances(Tableau)}. Build ${englishRules(rules.Tableau.build)}. Move sequences ${englishRules(rules.Tableau.move)}.`;

    if ( rules.Tableau.bury )
      r += ` At the start, ${Constants.cardValuesEnglish[rules.Tableau.bury]}s are moved to the bottom of the tableau.`;

    if ( tableaux[0].a_accept === 13 )
      r += ' Empty tableau may only be filled with a King.';
    else if ( tableaux[0].a_accept === Constants.ACCEPT_NOTHING_SYMBOL )
      r += ' Cards may not be placed in an empty tableau.';
    else if ( tableaux[0].a_accept === Constants.ACCEPT_MARTHA_SYMBOL )
      r += ' Only one card can be placed in an empty tableau.';
    else if ( tableaux[0].a_accept === 0 )
      r += ' Any card may be placed in an empty tableau.';
    else if ( tableaux[0].a_accept >= 1 && tableaux[0].a_accept <= 13 )
      r += ` Only a ${Constants.cardValuesEnglish[tableaux[0].a_accept]} may be placed in an empty tableau.`;
    return r;
  }
}

class TableauTail extends Tableau {
  /**
   * @override
   * @param {Card} c
   * @returns {Array<Card|null>} 
   */
  canGrab(c) {
    const tail = c.getTail();
    if ( isConformant(rules.Tableau.move, tail) )
      return tail;
    return null;
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.availableMovesStack_();
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Sequences of cards may be moved together.';
    return e;
  }
}

class TableauBlockade extends TableauTail {
// "Fill each space at once with the top card from the stock"
  /**
   * @override
   */
  autoMove() {
    if ( 0 === this.cards.length ) {
      const c = stock.peek();
      if ( c ) {
        tallyMan.decrement();
        c.moveTop(this);
      }
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Spaces are automatically filled with the top card from the stock.';
    return e;
  }
}

class TableauFortunesFavor extends Tableau {
/*
    Empty spaces in the tableau are automatically filled with a card from the waste.
    If the waste is empty, then it is filled with a card from the stock.
    If the stock is empty, then empty spaces in the tableau may be filled by any card.

    Only one card may moved at a time, never sequences.
*/
  /**
   * @override
   */
  autoMove() {
    if ( 0 === this.cards.length ) {
      let c = waste.peek();
      if ( !c )
        c = stock.peek();
      if ( c ) {
        tallyMan.decrement();
        c.moveTop(this);
      }
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Spaces are automatically filled with the top card from the waste or stock.';
    return e;
  }
}

class TableauCanfield extends TableauTail {
// "Fill each space at once with the top card from the reserve"
// "The top cards are available for play on foundations, but never into spaces" TODO
// Politaire says empty tableau can accept any card if reserve is empty TODO

  /**
   * @override
   */
  autoMove() {
    if ( 0 === this.cards.length ) {
      const c = reserve.peek();
      if ( c ) {
        tallyMan.decrement();
        c.moveTop(this);
      }
    }
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Spaces are automatically filled with the top card from the reserve.';
    return e;
  }
}

class TableauSpider extends TableauTail {   
  // override to click on a conformant stack to move to foundation
  /**
   * @override
   * @param {Card} c
   */
  onclick(c)
  {
    if ( c.faceDown )
      return;

    if ( !stats.Options.autoPlay )
      return;

    if ( !this.canGrab(c) )
      return;

    let cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      c.moveTail(cc);
  }
}

class TableauFreecell extends Tableau {
  /**
   * @private
   * @param {boolean} moveToEmptyColumn 
   * @returns {number}
   */
  _powerMoves(moveToEmptyColumn=false) {
    // (1 + number of empty freecells) * 2 ^ (number of empty columns)
    // see http://ezinearticles.com/?Freecell-PowerMoves-Explained&id=104608
    // and http://www.solitairecentral.com/articles/FreecellPowerMovesExplained.html
    let nCells = 0;
    cells.forEach( c => {if (c.cards.length === 0) nCells++;} );
    let nCols = moveToEmptyColumn ? -1 : 0;
    tableaux.forEach( c => {if (c.cards.length === 0) nCols++;} );
    return (1 + nCells) * (Math.pow(2, nCols));
  }

  /**
   * @override 
   * @param {Card} c 
   * @returns {Array<Card|null>}
   */
  canGrab(c) {
    const tail = c.getTail();
    if ( !isConformant(rules.Tableau.move, tail) ) {
      // console.warn('tail is not conformant');
      return null;
    }
    const pm = this._powerMoves();
    if ( tail.length > pm ) {
      // console.log(`grab: you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
      return null;
    }
    return tail;
  }

  /**
   * @override
   * @param {Card} c
   * @returns {boolean}
   */
  canAcceptCard(c) {
    // If you are moving into an empty column,
    // then the column you are moving into does not count as empty column
    let accept = super.canAcceptCard(c);
    // if c comes from Stock, Waste, Cell or Reserve it's only going to be one card, so allow it
    if ( accept && c.owner instanceof Tableau ) {
      const tail = c.getTail();
      const pm = this._powerMoves(this.cards.length === 0);
      if ( tail.length > pm ) {
        // console.log(`accept: you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
        accept = false;
      }
    }
    return accept;
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.availableMovesStack_();
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    e += ' Strictly, only the top card of each stack may be moved. However, the games automates moves of several cards, when empty tableau columns and empty cells allow.';
    return e;
  }
}

class TableauGolf extends Tableau {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // only click top card, which can only go to foundation[0]. always face up
    if ( this.peek() === c ) {
      if ( foundations[0].canAcceptCard(c) ) {
        c.moveTop(foundations[0]);
      }
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    this.cards.forEach( c => c.markMoveable(false) );

    const c = this.peek();
    if ( c && foundations[0].canAcceptCard(c) ) {
      c.markMoveable(true);
      return 1;
    }
    return 0;
  }
}

/**
 * @param {Array} src 
 * @returns {Array<CardContainer>}
 */
function linkClasses(src) {
  const /** Array<CardContainer> */dst = [];
  src.forEach ( e => {
    document.querySelectorAll('g.' + e.name).forEach( g => {
      // g contains a rect, the rect contains x,y attributes in SVG coords
      const r = g.querySelector('rect');
      const x = Number.parseInt(r.getAttribute('x'), 10);
      const y = Number.parseInt(r.getAttribute('y'), 10);
      const pt = Util.newPoint(x, y);
      dst.push(new e(pt, g));
    });
  });
  return dst;
}

/**
 * @param {any} typ TODO
 * @returns {string}
 */
function countInstances(typ) {
  let count = 0;
  listOfCardContainers.forEach( cc => {
    if ( cc instanceof typ )
      count++;
  });
  return `(${Util.plural(count, 'stack')})`;
}

/**
 * @param {Object} rules
 * @param {Card} cPrev
 * @param {Card} cThis
 * @returns {boolean}
 */
function isConformant0(rules, cPrev, cThis) {   // TODO clean up this horrible looking code
  if ( cPrev.faceDown || cThis.faceDown )
    return false;

  switch ( rules.suit ) {
    case 0: // may not build/move
      return false;
    case 1: // regardless of suit
      break;
    case 2: // in suit
      if ( cThis.suit !== cPrev.suit )
        return false;
      break;
    case 3: // in colour
      if ( cThis.color !== cPrev.color )
        return false;
      break;
    case 4: // in alternate colors
      if ( cThis.color === cPrev.color )
        return false;
      break;
    case 5: // in any suit but it's own
      if ( cThis.suit === cPrev.suit )
        return false;
      break;
  }
  switch ( rules.rank ) {
    case 0: // may not build/move
      return false;
    case 1: // up, e.g. a 10 goes on a 9
      if ( rules.rankwrap ) {
        if ( cPrev.ordinal === 13 && cThis.ordinal === 1 ) {
          // An Ace on a King
        } else if ( cThis.ordinal !== cPrev.ordinal + 1 )
          return false;
      } else {
        if ( cThis.ordinal !== cPrev.ordinal + 1 )
          return false;
      }
      break;
    case 2: // down, e.g. a 9 goes on a 10
      if ( rules.rankwrap ) {
        if ( cPrev.ordinal === 1 && cThis.ordinal === 13 ) {
          // a King on an Ace
        } else if ( cThis.ordinal !== cPrev.ordinal - 1 )
          return false;
      } else {
        if ( cThis.ordinal !== cPrev.ordinal - 1 )
          return false;
      }
      break;
    case 4: // either up or down
      //if ( !(cThis.ordinal === cPrev.ordinal + 1 || cThis.ordinal === cPrev.ordinal - 1) )
      if ( rules.rankwrap ) {
        if ( cPrev.ordinal === 13 && cThis.ordinal === 1 ) {
        } else if ( cPrev.ordinal === 1 && cThis.ordinal === 13 ) {
        } else if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) )
          return false;
      } else {
        if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) )
          return false;
      }
      break;
    case 5: // regardless
      break;
  }
  return true;
}

/**
 * @param {Object} rules
 * @param {Array<Card>} cards
 * @returns {boolean}
 */
function isConformant(rules, cards) {
  let cPrev = cards[0];
  for ( let nCard=1; nCard<cards.length; nCard++ ) {
    const cThis = cards[nCard];
    if ( !isConformant0(rules, cPrev, cThis) )
      return false;
    cPrev = cThis;
  }
  return true;
}

/**
 * @param {Object} rules
 * @returns {string}
 */
function englishRules(rules) {
  let s = '';
  switch ( rules.suit ) {
    case 0: // may not build/move
      s = 'not allowed';
      break;
    case 1: // regardless of suit
      s = 'regardless of suit';
      break;
    case 2: // in suit
      s = 'in suit';
      break;
    case 3: // in colour
      s = 'in color';
      break;
    case 4: // in alternate colors
      s = 'in alternate colors';
      break;
    case 5: // in any suit but it's own
      s = 'in any other suit';
      break;
  }
  switch ( rules.rank ) {
    case 0: // may not build/move
      break;
    case 1: // up, e.g. a 10 goes on a 9
      s += ' and up, e.g. a 10 goes on a 9';
      if ( rules.rankwrap ) {
        s += ', Aces are allowed on Kings';
      }
      break;
    case 2: // down, e.g. a 9 goes on a 10
      s += ' and down, e.g. a 9 goes on a 10';
      if ( rules.rankwrap ) {
        s += ', Kings are allowed on Aces';
      }
      break;
    case 4: // either up or down
      s += ' and either up or down';
      if ( rules.rankwrap ) {
        s += ', Aces and Kings can go on top of each other';
      }
      break;
    case 5: // regardless
      s += ' regardless of rank';
      break;
  }
  return s;
}

function isComplete() {
  return listOfCardContainers.every( cc => cc.isComplete() );
}

/**
 * @param {number=} ord 
 */
function autoSolve(ord=0) {
  let cardMoved = false;
  foundations.forEach( (f) => {
    waitForCards().then( () => {
      if ( f.solve(ord) )   // TODO type warning solve does not exist in CardContainer (but it does in Foundation)
        cardMoved = true;
    });
  });
  return cardMoved;
}

function autoCollect() {
  if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_OFF ) {
  }
  // else if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_ACES ) {
  //     while ( autoSolve(1) )
  //         ;
  // }
  else if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY ) {
    while ( autoSolve(0) )
      waitForCards();
  }
}

function availableMoves() {
  return listOfCardContainers.reduce( (acc,obj) => {
    return acc + obj.availableMoves();
  }, 0);
}

function dotick() {
  while ( !isComplete() ) {
    waitForCards();
    if ( !autoSolve(0) ) break;
  }
}

function gameOver(won) {
  const st = stats[rules.Name];

  if ( won ) {
    console.log('recording stats for won game', st);

    st.totalGames += 1;
    st.totalMoves += tallyMan.count;

    st.gamesWon += 1;

    if ( st.currStreak < 0 )
      st.currStreak = 1;
    else
      st.currStreak += 1;
    if ( st.currStreak > st.bestStreak )
      st.bestStreak = st.currStreak;

    if ( stats[rules.Name].saved )
      delete stats[rules.Name].saved; // start with a new deal
  } else if ( tallyMan.count > 0 && !isComplete() ) {
    console.log('recording stats for lost game', st);

    st.totalGames += 1;

    if ( st.currStreak > 0 )
      st.currStreak = 0;
    else
      st.currStreak -= 1;
    if ( st.currStreak < st.worstStreak )
      st.worstStreak = st.currStreak;

    if ( stats[rules.Name].saved )
      delete stats[rules.Name].saved; // start with a new deal
  }
}

function restart(seed) {
  gameOver(false);

  // move all cards back to stock, can't use pop and push
  // because Blockade will try to push them back to an empty tab
  listOfCardContainers.forEach( cc => {
    if ( cc !== stock ) {
      stock.cards = stock.cards.concat(cc.cards);
      cc.cards = [];
    }
  });
  stock.cards.forEach( c => {
    c.owner = stock;
    if ( !c.faceDown )
      c.flipDown(false);
    c.position0(stock.pt.x, stock.pt.y);
  });

  stock.sort(seed);
  stock.cards.forEach( c => c.bringToTop() );
  stock.redeals = rules.Stock.redeals;    // could be null  TODO type warning
  undo.length = 0;
  tallyMan.reset();
  foundations.forEach( f => f.scattered = false );  // TODO type warning
  if ( stats[rules.Name].saved )
    delete stats[rules.Name].saved; // .saved will now be 'undefined'
  dealCards();
}

function dostar() {
  restart();
}

function doreplay() {
  restart(stats[rules.Name].seed);
}

class Saved {
  constructor() {
    this.seed = stats[rules.Name].seed;
    this.redeals = stock.redeals;   // TODO type warning
    this.moves = tallyMan.count;
    this.undo = undo;
    this.containers = [];
    for ( let i=0; i<listOfCardContainers.length; i++ ) {
      this.containers[i] = listOfCardContainers[i].getSaveableCards();
    }
  }
}

function dosave() {
  stats[rules.Name].saved = new Saved();
  try {
    localStorage.setItem(Constants.GAME_NAME, JSON.stringify(stats));
    displayToast('position saved');
  } catch(e) {
    console.error(e);
  }
}

function doload() {
  if ( !stats.Options.loadSaved )
    return;

  if ( stats[rules.Name].saved ) {
    // console.log('loading', stats[rules.Name].saved);
    for ( let i=0; i<listOfCardContainers.length; i++ ) {
      listOfCardContainers[i].load(stats[rules.Name].saved.containers[i]);
    }
    stats[rules.Name].seed = stats[rules.Name].saved.seed;
    if ( stats[rules.Name].saved.hasOwnProperty('redeals') ) {
      stock.redeals = stats[rules.Name].saved.redeals;
    } else {
      stock.redeals = null;
    }
    stock.updateRedealsSVG_();
    tallyMan.count = stats[rules.Name].saved.moves;
    undo = stats[rules.Name].saved.undo;

    waitForCards().then( () => {    // TODO DRY
      tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
      reserves.forEach( res => res.scrunchCards(rules.Reserve) );
    });

    delete stats[rules.Name].saved;
  } else {
    displayToast('no saved game');
  }
}

const modalSettings = M.Modal.getInstance(document.getElementById('modalSettings'));
modalSettings.options.onOpenStart = function() {
  document.getElementById('aniSpeed').value = stats.Options.aniSpeed;
  document.getElementById('sensoryCues').checked = stats.Options.sensoryCues;
  document.getElementById('autoPlay').checked = stats.Options.autoPlay;
  // document.getElementById('autoFlip').checked = stats.Options.autoFlip;
  // document.getElementById('playFromFoundation').checked = stats.Options.playFromFoundation;

  document.getElementById('autoOff').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_OFF;
  document.getElementById('autoSolve').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_SOLVEABLE;
  // document.getElementById('autoAces').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_ACES;
  document.getElementById('autoAny').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY;
};

modalSettings.options.onCloseEnd = function() {
  stats.Options.aniSpeed = document.getElementById('aniSpeed').value;
  stats.Options.sensoryCues = document.getElementById('sensoryCues').checked;
  stats.Options.autoPlay = document.getElementById('autoPlay').checked;
  // stats.Options.autoFlip = document.getElementById('autoFlip').checked;
  // stats.Options.playFromFoundation = document.getElementById('playFromFoundation').checked;

  if ( document.getElementById('autoOff').checked )
    stats.Options.autoCollect = Constants.AUTOCOLLECT_OFF;
  else if ( document.getElementById('autoSolve').checked )
    stats.Options.autoCollect = Constants.AUTOCOLLECT_SOLVEABLE;
  // else if ( document.getElementById('autoAces').checked )
  //     stats.Options.autoCollect = Constants.AUTOCOLLECT_ACES;
  else if ( document.getElementById('autoAny').checked )
    stats.Options.autoCollect = Constants.AUTOCOLLECT_ANY;

  availableMoves();   // mark moveable cards
};

const modalStatistics = M.Modal.getInstance(document.getElementById('modalStatistics'));
modalStatistics.options.onOpenStart = function() {
  document.getElementById('gamesPlayedStats').innerHTML = stats[rules.Name].totalGames === 0
    ? `You've not played ${rules.Name} before`
    : `You've played ${rules.Name} ${stats[rules.Name].totalGames} times, and won ${stats[rules.Name].gamesWon} (${Math.round(stats[rules.Name].gamesWon/stats[rules.Name].totalGames*100)}%)`;

  {
    let s = 'In this game you\'ve made ';
    s += Util.plural(tallyMan.count, 'move');
    s += ', there are ';
    s += Util.plural(availableMoves(), 'available move');
    if ( !rules.Stock.hidden ) {
      s += ', ';
      s += Util.plural(stock.cards.length, 'stock card');
    }
    if ( waste ) {
      s += ', ';
      s += Util.plural(waste.cards.length, 'waste card');
    }
    let n = 0, c = 0;
    foundations.forEach( f => {
      n += f.cards.length;
      if ( f instanceof FoundationGolf )
        c += 52;
      else
        c += 13;    // TODO Grandfather's Clock
    });
    s += `, and ${Math.round(n/c*100)}% of the foundation is complete`;
    document.getElementById('thisGameStats').innerHTML = s;
  }

  if ( stats[rules.Name].totalGames > 0 )
    document.getElementById('gamesStreakStats').innerHTML = `Your current streak is ${stats[rules.Name].currStreak}, your best winning streak is ${stats[rules.Name].bestStreak}, your worst is ${stats[rules.Name].worstStreak}`;
  else
    document.getElementById('gamesStreakStats').innerHTML = '';
  let totalPlayed = 0;
  let totalWon = 0;

  Object.keys(stats).forEach( g => {
    if ( stats[g].totalGames )
      totalPlayed += stats[g].totalGames;
    if ( stats[g].gamesWon )
      totalWon += stats[g].gamesWon;
  });

  if ( totalPlayed )
    document.getElementById('gamesTotalStats').innerHTML = `In total, you have played ${Util.plural(totalPlayed, 'game')} and won ${totalWon} of them (${Math.round(totalWon/totalPlayed*100)}%)`;
};

modalStatistics.options.onCloseEnd = function() {
};

const modalGameOver = M.Modal.getInstance(document.getElementById('modalGameOver'));
modalGameOver.options.onOpenStart = function() {
  document.getElementById('movesMade').innerHTML = `Game ${stats[rules.Name].seed} of ${rules.Name} solved in ${tallyMan.count} moves; your average is ${Math.round(stats[rules.Name].totalMoves/stats[rules.Name].gamesWon)}`;
  document.getElementById('gamesPlayed').innerHTML = `You've played ${rules.Name} ${stats[rules.Name].totalGames} times, and won ${stats[rules.Name].gamesWon}`;
  document.getElementById('gamesStreak').innerHTML = `Your current winning streak is ${stats[rules.Name].currStreak}, your best winning streak is ${stats[rules.Name].bestStreak}, your worst is ${stats[rules.Name].worstStreak}`;
};

modalGameOver.options.onCloseEnd = function() {
};

const modalAreYouSure = M.Modal.getInstance(document.getElementById('modalAreYouSure'));

function areYouSure(f) {
  console.assert(typeof f === 'string');
  const ele = document.getElementById('modalAreYouSureYes');
  ele.setAttribute('onclick', `${f}()`);
  modalAreYouSure.open();
}

const modalShowRules = M.Modal.getInstance(document.getElementById('modalShowRules'));
modalShowRules.options.onOpenStart = function() {
  let r = '<p>' + stock.english() + '</p>';
  [waste,foundations[0],tableaux[0],cells[0],reserve].forEach( cc => {
    if ( cc )
      r = r + '<p>' + cc.english() + '</p>';
  });
  document.getElementById('therules').innerHTML = r;

  const ele = document.getElementById('theruleswikipedia');
  if ( rules.hasOwnProperty('Wikipedia') && rules.Wikipedia.length ) {
    ele.hidden = false;
    ele.href = rules.Wikipedia;
  } else {
    ele.hidden = true;
  }
};

function doshowrules() {
  modalShowRules.open();
}

function dostatsreset() {
  stats[rules.Name].totalMoves = 0;
  stats[rules.Name].totalGames = 0;
  stats[rules.Name].gamesWon = 0;

  stats[rules.Name].currStreak = 0;
  stats[rules.Name].bestStreak = 0;
  stats[rules.Name].worstStreak = 0;
}

function displayToast(msg) {
  // M.Toast.dismissAll();
  // console.log(M.Toast._toasts);

  let toastElement = document.querySelector('.toast');
  // if ( toastElement )
  // {
  //     // console.log('found toast');
  //     let toastInstance = M.Toast.getInstance(toastElement);
  //     if ( toastInstance )
  //     {
  //         // console.log('dismissing toast');
  //         toastInstance.dismiss();
  //     }
  // }
  // for (let toastIndex in M.Toast._toasts) {
  //      M.Toast._toasts[toastIndex].dismiss();
  // }

  if ( !toastElement )
    M.toast({html:msg});
}

function displayToastNoAvailableMoves() {
  displayToast('<span>no available moves</span><button class="btn-flat toast-action" onclick="doundo()">Undo</button><button class="btn-flat toast-action" onclick="dostar()">New</button>');
}

function dosettings() {
  modalSettings.open();
}

function dohelp() {
  window.open(rules.Wikipedia);
}

function dealCards() {
  listOfCardContainers.forEach( cc => {
    window.setTimeout( () => cc.deal(), 1 );
  });
  waitForCards().then( () => {
    undo.length = 0;
    tallyMan.reset();
  });
}

const rules = JSON.parse(document.getElementById('rules').innerHTML);
document.title = Constants.GAME_NAME + ' ' + Constants.GAME_VERSION + ' ' + rules.Name;
document.getElementById('nav-title').innerHTML = rules.Name;
document.getElementById('sidenav-title').innerHTML = rules.Name;

['Name','Cards','Stock','Waste','Foundation','Tableau','Cell','Reserve','Winnable','Wikipedia']
  .forEach( ele => { if ( !rules.hasOwnProperty(ele)) rules[ele] = {}; });

if ( !rules.Cards.hasOwnProperty('suit') )          rules.Cards.suit = 'TopRight';  // where to display suit symbol

if ( !rules.Stock.hasOwnProperty('packs') )         rules.Stock.packs = 1;
if ( !rules.Stock.hasOwnProperty('cards') )         rules.Stock.cards = 1;          // move one card to waste per click
if ( !rules.Stock.hasOwnProperty('redeals') )       rules.Stock.redeals = null;     // infinite redeals
if ( !rules.Stock.hasOwnProperty('suitfilter') )    rules.Stock.suitfilter = '♠♥♦♣';// keep this order
if ( !rules.Stock.hasOwnProperty('hidden') )        rules.Stock.hidden = false;
if ( !rules.Stock.hasOwnProperty('target') )        rules.Stock.target = null;

if ( !rules.Waste.hasOwnProperty('maxcards') )      rules.Waste.maxcards = null;    // allow any number of cards
if ( !rules.Waste.hasOwnProperty('target') )        rules.Waste.target = null;
if ( !rules.Waste.hasOwnProperty('fan') )           rules.Waste.fan = 'Right';      // TODO not implemented

if ( !rules.Cell.hasOwnProperty('target') )         rules.Cell.target = null;

if ( !rules.Reserve.hasOwnProperty('fan') )         rules.Reserve.fan = 'Down';
if ( !rules.Reserve.hasOwnProperty('maxfan') )      rules.Reserve.maxfan = 0;       // use baize dimensions
if ( !rules.Reserve.hasOwnProperty('target') )      rules.Reserve.target = null;

if ( !rules.Foundation.hasOwnProperty('fan') )      rules.Foundation.fan = 'None';
if ( !rules.Foundation.hasOwnProperty('scatter') )  rules.Foundation.scatter = 'Down';
if ( !rules.Foundation.hasOwnProperty('hidden') )   rules.Foundation.hidden = false;
if ( !rules.Foundation.hasOwnProperty('target') )   rules.Foundation.target = null;

if ( !rules.Tableau.hasOwnProperty('fan') )         rules.Tableau.fan = 'Down';
if ( !rules.Tableau.hasOwnProperty('maxcards') )    rules.Tableau.maxcards = null;    // allow any number of cards
if ( !rules.Tableau.hasOwnProperty('maxfan') )      rules.Tableau.maxfan = 0;         // use baize dimensions
if ( !rules.Tableau.hasOwnProperty('build') )       rules.Tableau.build = {suit:2, rank:4};
if ( !rules.Tableau.hasOwnProperty('move') )        rules.Tableau.move = {suit:4, rank:2};
if ( !rules.Tableau.hasOwnProperty('target') )      rules.Tableau.target = null;

let stats = null;
try {
  stats = JSON.parse(localStorage.getItem(Constants.GAME_NAME)) || {};
} catch(e) {
  stats = {};
  console.error(e);
}

if ( !stats.Options ) {
  stats.Options = {
    aniSpeed:3,
    autoCollect:Constants.AUTOCOLLECT_SOLVEABLE,
    sensoryCues:false,
    autoFlip:true,              // retired
    playFromFoundation:false,   // retired
    autoPlay:true,
    dealWinnable:false,
    loadSaved:true
  };
}

if ( stats.Options.aniSpeed < 1 || stats.Options.aniSpeed > 5 )
  stats.Options.aniSpeed = 3;
if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_ACES )
  stats.Options.autoCollect = Constants.AUTOCOLLECT_SOLVEABLE;

if ( !stats[rules.Name] )               stats[rules.Name] = {};
if ( !stats[rules.Name].totalMoves )    stats[rules.Name].totalMoves = 0;
if ( !stats[rules.Name].totalGames )    stats[rules.Name].totalGames = 0;
if ( !stats[rules.Name].gamesWon )      stats[rules.Name].gamesWon = 0;

if ( !stats[rules.Name].currStreak )    stats[rules.Name].currStreak = 0;
if ( !stats[rules.Name].bestStreak )    stats[rules.Name].bestStreak = 0;
if ( !stats[rules.Name].worstStreak )   stats[rules.Name].worstStreak = 0;

stats.Options.lastGame = window.location.pathname.split('/').pop();

const /** Array<Stock> */stocks = linkClasses([Stock, StockAgnes, StockCruel, StockFan, StockKlondike, StockGolf, StockScorpion, StockSpider]);
const /** Stock */stock = stocks[0];
const /** Array<Waste> */wastes = linkClasses([Waste]);
const /** Waste */waste = wastes[0];
const /** Array<Foundation> */foundations = linkClasses([Foundation,FoundationCanfield,FoundationGolf,FoundationOsmosis,FoundationPenguin,FoundationSpider]);
const /** Array<Tableau> */tableaux = linkClasses([Tableau,TableauBlockade,TableauCanfield,TableauFortunesFavor,TableauFreecell,TableauGolf,TableauSpider,TableauTail]);
const /** Array<Cell> */cells = linkClasses([Cell,CellCarpet]);
const /** Array<Reserve> */reserves = linkClasses([Reserve,ReserveFrog]);
const /** Reserve */reserve = reserves[0];

document.documentElement.style.setProperty('--bg-color', 'darkgreen');
document.documentElement.style.setProperty('--hi-color', 'lightgreen');
document.documentElement.style.setProperty('--ffont', 'Acme');

// document.addEventListener('contextmenu', event => event.preventDefault());

window.onbeforeunload = function(e) {
  // if scattered, force a new game, otherwise loaded game won't be scattered
  if ( foundations.some( f => f.scattered ) )
    delete stats[rules.Name].saved;
  else
    stats[rules.Name].saved = new Saved();
  try {
    localStorage.setItem(Constants.GAME_NAME, JSON.stringify(stats));
  } catch(err) {
    console.error(err);
  }
// setting e.returnValue makes Chrome display a dialog
//    e.returnValue = stats[rules.Name];
};

const someCardsInTransit = () => {
  listOfCardContainers.forEach( cc => {
    if ( cc.cards.some( c => c.inTransit ) )
      return true;
  });
  return false;
};

const waitForCards = () => new Promise((resolve,reject) => {
  const timeoutStep = 200;
  let timeoutMs = 10000;
  const check = () => {
    if ( !someCardsInTransit() )
      resolve();
    else if ( (timeoutMs -= timeoutStep) < 0 )
      reject('timed out');
    else
      window.setTimeout(check, timeoutStep);
  };
  window.setTimeout(check, 0);
});

function robot() {
  waitForCards().then( () => {
    [tableaux,reserves,cells].forEach( ccl => ccl.forEach(cc => cc.autoMove()) );

    waitForCards().then( () => autoCollect() );

    tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
    reserves.forEach( res => res.scrunchCards(rules.Reserve) );
    
    waitForCards().then( () => {
      if ( (stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY || stats.Options.autoCollect === Constants.AUTOCOLLECT_SOLVEABLE)
        && listOfCardContainers.every( f => f.isSolveable() ) ) {
        dotick();   // TODO could display toast [solve]
      }
      waitForCards().then( () => {
        if ( isComplete() ) {
          if ( foundations.every( f => !f.scattered ) ) {
            foundations.forEach( f => f.scatter() );
            waitForCards().then( () => {
              undo.length = 0;
              gameOver(true);
              modalGameOver.open();
            });
          }
        } else if ( !availableMoves() ) {
          displayToastNoAvailableMoves();
        }
      });
    });
  });
}

/* document.addEventListener('keydown', function(ev) {
    // console.log(ev,ev.keyCode);
});

document.addEventListener('keyup', function(ev) {
    // console.log(ev,ev.keyCode);
});
 */
document.addEventListener('keypress', function(ev) {
  // console.log(ev,ev.keyCode);
  if ( ev.keyCode === 26 && ev.ctrlKey )           // Chrome
    doundo();
  else if ( ev.key === 'a' ) {
    const a = availableMoves();
    if ( 0 === a )
      displayToastNoAvailableMoves();
    else
      displayToast(`<span>${Util.plural(a, 'move')} available</span>`);
  }
  else if ( ev.key === 'r' )
    modalShowRules.open();
  else if ( ev.key === 's' )
    modalStatistics.open();
  else if ( ev.key === 'u' )
    doundo();
  else if ( ev.key === 'z' && ev.ctrlKey )         // Edge, Firefox
    doundo();
});

if ( stats.Options.loadSaved && stats[rules.Name].saved )
  doload();
else
  window.onload = dealCards;

if ( 0 === stats[rules.Name].totalGames )
  doshowrules();
