//@ts-check
'use strict';
/* jshint esversion:6 */

import Random from './Random.js';
import {Util} from './Util.js';

const Constants = {
  GAME_NAME: 'Oddstream Solitaire',
  GAME_VERSION: '20.1.30.2',
  SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
  LOCALSTORAGE_SETTINGS: 'Oddstream Solitaire Settings',
  LOCALSTORAGE_GAMES: 'Oddstream Solitaire Games',

  MOBILE:     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  CHROME:     navigator.userAgent.indexOf('Chrome/') !== -1,   // also Brave, Opera
  EDGE:       navigator.userAgent.indexOf('Edge/') !== -1,
  FIREFOX:    navigator.userAgent.indexOf('Firefox/') !== -1,

  CIRCLE: '\u25CF',
  STAR: '\u2605',
  SPADE: '\u2660',     // ♠ Alt 6
  CLUB: '\u2663',      // ♣ Alt 5
  HEART: '\u2665',     // ♥ Alt 3
  DIAMOND: '\u2666',   // ♦ Alt 4

  REDEALS_SYMBOL: '\u21BA',           // Anticlockwise Open Circle Arrow
  ACCEPT_NOTHING_SYMBOL: '\u00D7',    // &times;
  ACCEPT_MARTHA_SYMBOL: '¹',          // &sup1;
  ACCEPT_INSECT_SYMBOL: '\u2263',     // was 2261

  // if you edit these, also edit symbols.svg if using symbol card suits
  CARD_WIDTH: 60,
  CARD_WIDTH_STACKED: Math.round(60/2),
  CARD_HEIGHT: 90,
  CARD_RADIUS: 4,
  DEFAULT_STACK_FACTOR_Y: (10.0/3.0),
  DEFAULT_STACK_FACTOR_X: 2.0,
  MAX_STACK_FACTOR: 10,
  FACEDOWN_STACK_WIDTH: Math.round(60/6),
  FACEDOWN_STACK_HEIGHT: Math.round(90/9),

  cardValues: 'Joker A 2 3 4 5 6 7 8 9 10 J Q K'.split(' '),
  cardValuesEnglish: 'Joker Ace 2 3 4 5 6 7 8 9 10 Jack Queen King'.split(' '),
};

const suitColors = new Map([
  [Constants.CIRCLE, 'purple'],
  [Constants.STAR, 'purple'],
  [Constants.SPADE, 'black'],
  [Constants.CLUB, 'black'],
  [Constants.HEART, 'red'],
  [Constants.DIAMOND, 'red']
]);

// if ( !(Constants.CHROME || Constants.EDGE || Constants.FIREFOX) )
//   window.alert(`Browser (${navigator.userAgent}) not supported`);
// else if ( !window.PointerEvent )
//   window.alert('Pointer events not supported');

class Baize {
  constructor() {
    this.ele = /** @type {unknown} */(document.getElementById('baize'));
    this.ele = /** @type {SVGSVGElement} */(this.ele);
    /** @private @type {number} */ this.borderWidth_ = 0;
    /** @private @type {number} */ this.gutsWidth_ = 0;
    /** @type {number} */ this.width = 0;
    /** @type {number} */ this.height = 0;
    
    this.ele.querySelectorAll('g>rect').forEach( r => {
//      let x = Number.parseFloat(r.getAttribute('x'));
      let x = Number(r.getAttribute('x'))
      x = 10 + (x * 67);
//      let y = Number.parseFloat(r.getAttribute('y'));
      let y = Number(r.getAttribute('y'))
      y = 10 + (y * 100);    
      Util.setAttributesNS(r, {
        x: x,
        y: y,
        width: String(Constants.CARD_WIDTH),
        height: String(Constants.CARD_HEIGHT),
        rx: String(Constants.CARD_RADIUS),
        ry: String(Constants.CARD_RADIUS)
      });
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
    cardContainers.forEach( cc => {
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
    // console.warn(window.screen.orientation, window.screen.width, window.screen.height);
    this.width = this.gutsWidth_;
    this.height = Math.max(1200,window.screen.height);

    if ( window.screen.width > window.screen.height ) {
      // landscape, add a border if guts are narrow
      const thresholdWidth = 1000;
      if ( this.gutsWidth_ < thresholdWidth ) {
        this.borderWidth_ = (thresholdWidth - this.gutsWidth_) / 2;
        this.adjustBorder_(this.borderWidth_);
        this.width = thresholdWidth;
      }
    }
    // set viewport (visible area of SVG)
    Util.setAttributesNS(this.ele, {
      width: String(this.width),
      height: String(this.height),
      viewBox: `0 0 ${this.width} ${this.height}`,
      preserveAspectRatio: 'xMinYMin slice'
    });
  }

  onOrientationChange() {
    if ( this.borderWidth_ ) {
      this.adjustBorder_(-this.borderWidth_);
      this.borderWidth_ = 0;
    }
    this.setBox_();
    cardContainers.forEach( cc => {
      cc.cards.forEach( c => {
        c.buildCard_();
      });
    });
    allAvailableMoves();   // repaint moveable cards
  }

  /**
   * Move card to end of baize so it appears on top of other cards
   * Should be using SVG z-index to do this, but it's not implemented
   * @param {Card} c
   */
  elevateCard(c) {
    if ( c.g !== this.ele.lastChild )
      this.ele.appendChild(c.g);
  }
}

const /** Array<CardContainer> */cardContainers = [];
let /** @type {KeyFocus} */keyFocus = null;
const baize = new Baize;

let undoStack = []  // can't be a const because we load game

/**
 * Move a number of cards from this stack to another stack
 * @param {!CardContainer} from 
 * @param {!CardContainer} to 
 * @param {!number} n
 */
function moveCards(from, to, n) {
  undoPush()
  if ( 0 == n ) {
    console.error('moveCards(0)');
  } else if ( 1 == n && from.cards.length > 0 ) {
    const c = from.pop();
    to.push(c);
  } else {
    const tmp = [];
    while ( n > 0 ) {
      if ( from.peek() ) {
        tmp.push(from.pop());
      }
      n = n - 1;
    }
    while ( tmp.length ) {
      to.push(tmp.pop());
    }
  }
  robot();
}

function undoCounter() {
  let ele = document.getElementById('moveCounter');
  if ( ele ) {
    ele.innerHTML = String(undoStack.length);
  }
}

function undoPush() {
  const sv = new Saved();
  undoStack.push(sv);
  undoCounter();
}

function undoPop() {
  const sv = undoStack.pop();
  undoCounter();
  return sv;
}

function undoReset() {
  undoStack.length = 0;
  undoCounter();
}

window.doundo = function() {
  if ( undoStack.length == 0 ) {
    displayToast('nothing to undo');
    return;
  }
  const saved = undoPop();

  // make a cache of all the cards to avoid destroying/creating them
  const cache = /** @type {Card[]} */([]);
  for ( const cc of cardContainers ) {
    for ( const c of cc.cards ) {
      cache.push(c)
    }
  }

  for ( let i=0; i<cardContainers.length; i++ ) {
    cardContainers[i].load2(cache, saved.containers[i]);  // calls Card.destructor
  }
  if ( saved.hasOwnProperty('redeals') ) {
    stock.redeals = saved.redeals;
  } else {
    stock.redeals = null;
  }
  stock.updateRedealsSVG_();
  allAvailableMoves(); // repaint moveable cards
  scrunchContainers();
  checkIfGameOver();
}

// https://stackoverflow.com/questions/20368071/touch-through-an-element-in-a-browser-like-pointer-events-none/20387287#20387287
function dummyTouchStartHandler(e) {/*console.log('dummy touch start');*/e.preventDefault();}
function dummyTouchMoveHandler(e) {/*console.log('dummy touch move');*/e.preventDefault();}
function dummyTouchEndHandler(e) {/*console.log('dummy touch end');*/e.preventDefault();}

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
    // console.assert(this.id.length===4);
    // this.id = `${pack}${suit}${String(this.ordinal).padStart(2,'0')}`;

    this.color = suitColors.get(this.suit);
    this.owner = null;
    this.pt = Util.newPoint(pt);
    this.ptOriginal = null;
    this.ptOffset = null;
    this.grabbedTail = /** @type {Card[]} */(null);
    this.ptOriginalPointerDown = null;
    // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
    this.downHandler = this.onpointerdown.bind(this);
    this.moveHandler = this.onpointermove.bind(this);
    // this.moveHandler = debounce(this.onpointermove.bind(this), 10);
    this.upHandler = this.onpointerup.bind(this);
    this.cancelHandler = this.onpointercancel.bind(this);
    this.overHandler = this.onpointerover.bind(this);

    this.animationIds = /** @type {Number[]} */([]);

    this.g = /** @type {SVGGElement} */(document.createElementNS(Constants.SVG_NAMESPACE, 'g'));
    this.buildCard_();
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
   */
  buildCard_() {
    // flipping or orientation change: clear out any old child nodes
    while ( this.g.hasChildNodes() )
      this.g.removeChild(this.g.lastChild);

    const r = document.createElementNS(Constants.SVG_NAMESPACE, 'rect');
    Util.setAttributesNS(r, {
      width: String(Constants.CARD_WIDTH),
      height: String(Constants.CARD_HEIGHT),
      rx: String(Constants.CARD_RADIUS),
      ry: String(Constants.CARD_RADIUS)
    });
    this.g.appendChild(r);

    if ( this.faceDown ) {
      r.classList.add('spielkarteback');
    } else {
      r.classList.add('spielkarte');

      const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
      t.classList.add('spielkartevalue');
      Util.setAttributesNS(t, {
        'x': this.ordinal === 10 ? String(Constants.CARD_WIDTH/4 + 4) : String(Constants.CARD_WIDTH/4),
        'y': String(Constants.CARD_HEIGHT/4),
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'fill': this.color
      });
      t.innerHTML = this.faceValue();
      this.g.appendChild(t);

      if ( Constants.MOBILE ) {   // TODO get rid of magic numbers
        const u = document.createElementNS(Constants.SVG_NAMESPACE, 'use');
        const u_attribs = {
          href: `#${this.suit}`,
          height: '24',
          width: '24',
          fill: this.color
        };
        if ( rules.Cards.suit === 'BottomLeft' ) {
          u_attribs.x = '4';
          u_attribs.y = String((Constants.CARD_HEIGHT/3)*2);
        } else if ( rules.Cards.suit === 'TopRight' ) {
          u_attribs.x = String(Constants.CARD_WIDTH*0.6);
          u_attribs.y = String(Constants.CARD_HEIGHT/20);
        } else {
          console.error('Unknown rules.Cards.suit', rules.Cards.suit);
        }
        Util.setAttributesNS(u, u_attribs);
        this.g.appendChild(u);
      } else {
        const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
        t.classList.add('spielkartesuit');
        const t_attribs = {
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'fill': this.color
        };
        if ( rules.Cards.suit === 'BottomLeft' ) {
          t_attribs['x'] = String(Constants.CARD_WIDTH/4);
          t_attribs['y'] = String((Constants.CARD_HEIGHT/10)*9); // 90%
          // t_attribs['transform'] = `rotate(180,${Constants.CARD_WIDTH/4},${(Constants.CARD_HEIGHT/10)*8})`;
        } else if ( rules.Cards.suit === 'TopRight' ) {
          t_attribs['x'] = String((Constants.CARD_WIDTH/4)*3);  // 75%
          t_attribs['y'] = String(Constants.CARD_HEIGHT/4);
        } else {
          console.error('Unknown rules.Cards.suit', rules.Cards.suit);
        }
        Util.setAttributesNS(t, t_attribs);
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
    this.g.addEventListener('touchmove', dummyTouchMoveHandler);
    this.g.addEventListener('touchend', dummyTouchEndHandler);
  }

  /**
   * @private
   */
  removeListeners_() {
    this.g.removeEventListener('pointerover', this.overHandler);
    this.g.removeEventListener('pointerdown', this.downHandler);
    this.g.removeEventListener('touchstart', dummyTouchStartHandler);
    this.g.removeEventListener('touchmove', dummyTouchMoveHandler);
    this.g.removeEventListener('touchend', dummyTouchEndHandler);
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
      if ( settings.autoPlay )
        cur = 'pointer';
      else
        cur = 'grab';
    }

    // .children is an HTMLCollection
    // const coll = this.g.children;
    // for ( const ch of this.g.children ) {  Symbol.Iterator not supported in Edge
    // for ( let i=0; i<coll.length; i++ ) {
      // const ch = coll.item(i);
      // const ch = coll[i]; // HTMLCollection can be treated as an array
      // ch.style.cursor = cur;
    // }
    for ( let ch=this.g.firstChild; ch; ch=ch.nextSibling ) {
      ch.style.cursor = cur;
    }
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
    if ( keyFocus ) {
      keyFocus.mark(false);
      keyFocus = null;
    }
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

    if ( Constants.FIREFOX ) {
      if ( this.owner.lastEvent ) {
        if ( event.pointerType !== this.owner.lastEvent.pointerType && event.timeStamp < this.owner.lastEvent.timeStamp + 1000 ) {
          console.log('stifle Firefox event');
          return false;
        }
      }
      this.owner.lastEvent = event;
    }

    if ( event.pointerType === 'mouse' ) {
      if ( !(event.button === 0) ) {
        console.log('don\'t care about mouse button', event.button);
        return false;
      }
    }

    if ( this.animationIds.length ) {
      console.warn('clicking on a moving card', this.id);
      return false;
    }

    if ( this.grabbedTail ) {
      console.warn('grabbing a grabbed card', this.id);
      return false;
    }
// this.g.setPointerCapture(event.pointerId);
    this.ptOriginalPointerDown = this.getPointerPoint_(event);

    this.grabbedTail = this.owner.canGrab(this);
    if ( !this.grabbedTail ) {
      this.shake();
      return false;
    }

    this.grabbedTail.forEach( c => {
      c.markGrabbed();
      c.ptOriginal = Util.newPoint(c.pt);
      c.ptOffset = Util.newPoint(
        this.ptOriginalPointerDown.x - c.pt.x,
        this.ptOriginalPointerDown.y - c.pt.y
      );
      baize.elevateCard(c);
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

    const ptNew = this.getPointerPoint_(event);
    this.scalePointer_(ptNew);
    this.grabbedTail.forEach( c => {
      c.position1(ptNew.x - c.ptOffset.x, ptNew.y - c.ptOffset.y);
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
// this.g.releasePointerCapture(event.pointerId);
    const ptNew = this.getPointerPoint_(event);
    const ptNewCard = Util.newPoint(
      ptNew.x - this.ptOffset.x,
      ptNew.y - this.ptOffset.y
    );
    if ( Util.nearlySamePoint(ptNewCard, this.ptOriginal) ) {
      // console.log('nearly same point', ptNewCard, this.ptOriginal);
      this.grabbedTail.forEach( c => {
        c.position1(c.ptOriginal.x, c.ptOriginal.y);
      });
      // a click on a card just sends the click to it's owner, so we do that directly
      // console.log('simulate a click');
      this.owner.onclick(this);
    } else {
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
   */
  flipUp() {
    if ( this.faceDown ) {
      this.faceDown = false;
      this.buildCard_();
    } else {
      console.warn(this.id, 'is already up');
    }
  }

  /**
   */
  flipDown() {
    if ( !this.faceDown ) {
      this.faceDown = true;
      this.buildCard_();
    } else {
      console.warn(this.id, 'is already down');
    }
  }

  /**
   * Use SVG transform to position this card on the baize
   */
  position0() {
    // console.assert(this.pt.x !== undefined);
    // console.assert(this.pt.y !== undefined);
    this.g.setAttributeNS(null, 'transform', `translate(${this.pt.x} ${this.pt.y})`);
  }

  /**
   * Use SVG transform to position this card on the baize
   * @param {number=} x
   * @param {number=} y
   */
  position1(x, y) {
    this.pt.x = x;
    this.pt.y = y;
    this.position0();
  }

  /**
   * @param {number} x 
   * @returns {!number}
   * @private
   */
  smootherstep_(x) {
    return ((x) * (x) * (x) * ((x) * ((x) * 6 - 15) + 10));
  }

  /**
   * Animate this card to a new position
   * Designed to be invoked when card is already mid-animation;
   * the card will swerve to a new destination
   * 
   * @param {SVGPoint} ptTo
   */
  animate(ptTo) {
    // http://sol.gfxile.net/interpolation
    /*
      for (i = 0; i < N; i++)
      {
        v = i / N;
        v = SMOOTHSTEP(v);
        X = (A * v) + (B * (1 - v));
      }
      N.B. this will animate cards backwards
    */
    const steps = [0,50,40,30,20,10];   // index will be 1..5

    /**
     * @param {number} timestamp 
     */
    const step_ = (timestamp) => {
      const v = this.smootherstep_(i / N);
      const x = Math.round((ptFrom.x * v) + (ptTo.x * (1 - v)));
      const y = Math.round((ptFrom.y * v) + (ptTo.y * (1 - v)));
      this.g.setAttributeNS(null, 'transform', `translate(${x} ${y})`);

      /*
        Tried using smaller number of steps for short distances,
        to pep up the waste pile animation
        but it doesn't look right
      */
      i -= N/steps[settings.aniSpeed];
      if ( i > 0 ) {
        this.animationIds.push(window.requestAnimationFrame(step_));
      } else {
        if ( x !== this.pt.x || y !== this.pt.y ) {
          this.position0();
        }
        this.animationIds.length = 0;
      }
    };

    const ptFrom = Util.newPoint(this.pt);
    Util.copyPoint(this.pt, ptTo); // update final pos immediately in case we're interrupted

    const N = Util.getDistance(ptFrom, ptTo);
    let i = N;

    if ( this.animationIds.length ) {
      waitForCard(this)
      // .then( (value) => console.log(`waited ${Math.round(value)} for ${this.id}`) )
      .catch( (reason) => console.error('animate() did not wait for card', reason) );
    }
    if ( 0 === N ) {
      // console.log('no need to animate', this.id);
    } else {
      this.animationIds.push(window.requestAnimationFrame(step_));
    }
  }

  /**
   * 
   */
  shake() {
    const shake_ = (timestamp) => {
      if ( --shakes > 0 ) {
        let x = (shakes % 2) ? this.pt.x + shakes : this.pt.x - shakes;
        this.g.setAttributeNS(null, 'transform', `translate(${x} ${this.pt.y})`);
        this.animationIds.push(window.requestAnimationFrame(shake_));
      } else {
        this.position0();
        this.animationIds.length = 0;
      }
    };

    if ( this.animationIds.length ) {
      waitForCard(this)
      // .then( (value) => console.log(`waited ${Math.round(value)} for ${this.id}`) )
      .catch( (reason) => console.log('shake', reason) );
    }
    let shakes = 6;
    this.animationIds.push(window.requestAnimationFrame(shake_));
  }

  /**
   * Move cards from this card to end of stack (the tail) to another stack
   * @param {!CardContainer} to 
   */
  moveTail(to) {
    const nCard = this.owner.cards.findIndex( e => e === this );
    moveCards(this.owner, to, this.owner.cards.length-nCard);
    // this.moveSome(to, this.owner.cards.length-nCard);
  }

  /**
   * Calculate the overlap area (intersection) of this card and a card at pt2
   * @param {!SVGPoint} pt2 
   * @returns {number}
   * @private
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
    for ( const dst of cardContainers ) {
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
    /**
     * @param {CardContainer} dst 
     * @returns {number}
     */
    const calcWeight = (dst) => {
      const dstc = dst.peek();
      if ( dstc && dstc.suit === this.suit ) {
        return dst.cards.length + 10;
      } else {
        return dst.cards.length;
      }
    };

    let cc = null;
    let max = -1;
    for ( const dst of ccList ) {
      if ( dst === this.owner )
        continue;
      if ( this.owner.canTarget(dst) && dst.canAcceptCard(this) ) {
        const max0 = calcWeight(dst);
        if ( max0 > max ) {
          max = max0;
          cc = dst;
        }
      }
    }

    return cc;
  }

  /**
   * Take Freecell for example, with four empty cells; if a tab card can
   * be moved to one cell, it's the same as moving it to any other cell, so this would
   * count as one potential move, not four.
   * 
   * @returns {Number}
   */
  potentialMovesToContainers() {
    /**
     * @param {CardContainer} a 
     * @param {CardContainer} b 
     */
    const sameContainer = (a,b) => (a.constructor.name === b.constructor.name);

    console.assert(!(this.owner instanceof Foundation));
    let count = 0;
    [foundations,tableaux,cells].forEach( ccList => {
      const dst = this.findFullestAcceptingContainer(ccList);
      if ( dst ) {
        // moving a bottom card to an empty container of the same type is futile
        if ( 0 === dst.cards.length && this.owner.cards[0] === this && sameContainer(dst, this.owner) ) {
            ;
        } else {
          count++;
          if ( !(dst instanceof Cell) ) // kludge for Freecell
            this.markMoveable(dst);
        }
      }
    });
    return count;
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
   * @returns {boolean}
   */
  isTopCard() {
    return this.owner.peek() === this;
  }

  /**
   * Mark this card moveable/unmoveable
   * (odd logic because modalSettings may turn sensory cues flag on/off)
   * @param {CardContainer} ccDst 
   */
  markMoveable(ccDst=null) {
    if ( this.faceDown )
      return;
    if ( this.g.firstChild.localName !== 'rect' )
      return;
    const cl = this.g.firstChild.classList;
    const UN = 'unmoveable';
    if ( settings.sensoryCues ) {
      if ( ccDst ) {
        cl.remove(UN);
      } else {
        cl.add(UN); // ignored if class already there
      }
    } else {
      cl.remove(UN);
    }
  }

  markGrabbed() {
    this.g.firstChild.classList.add('grabbed');
  }

  unmarkGrabbed() {
    this.g.firstChild.classList.remove('grabbed');
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

class CardContainer {
  /**
   * @param {!SVGPoint} pt 
   * @param {!SVGGElement} g 
   */
  constructor(pt, g) {
    this.pt = pt;
    this.g = g;
    this.cards = /** @type {Card[]} */([]);
    this.a_deal = this.g.getAttribute('deal');
    this.stackFactor = NaN;

    // accept is either:
    // missing - we accept anything, stored as 0
    // a symbol - special rules
    // a number - card ordinal usually 1=Ace or 13=King
    // if it's missing/0, it can get overriden by rules.Foundation|Tableau.accept
    this.a_accept = g.getAttribute('accept') || 0;
    if ( !this.isAcceptSymbol_() ) {
      this.a_accept = Number.parseInt(this.a_accept, 10);
      console.assert(!isNaN(this.a_accept));
    }
    if ( this.a_accept )
      this.createAcceptSVG_();
    cardContainers.push(this);
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
    if ( arr ) {
      this.cards.forEach( c => c.destructor() );
      this.cards = /** @type {Card[]} */([]);
      arr.forEach( a => {
        const c = new Card(a.pack, a.suit, a.ordinal, a.faceDown, this.pt);
        baize.ele.appendChild(c.g);
        this.push(c);
      });
    }
  }

  /**
   * @param {Card[]} cache
   * @param {Array} arr
   */
  load2(cache, arr) {
    
    function findCardInCache(a) {
      for ( let i=0; i<cache.length; i++ ) {
        const c = cache[i];
        if ( a.pack === c.pack && a.suit == c.suit && a.ordinal == c.ordinal ) {
          return c;
        }
      }
    }
  
    this.cards = /** @type {Card[]} */([]);
    arr.forEach( a => {
      const c = findCardInCache(a);
      if ( a.faceDown && !c.faceDown ) {
        c.flipDown();
      } else if ( !a.faceDown && c.faceDown ) {
        c.flipUp();
      }
      this.push(c);
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
   * @param {SVGPoint=} pt
   */
  push(c, pt = undefined) {
    c.owner = this;
    this.cards.push(c);
    baize.elevateCard(c);
    c.animate(pt ? pt : this.pt);
  }

  /**
   * @param {!Card} c
   */
  onclick(c) {
    console.error('onclick not implemented in base CardContainer', c);
  }

  /**
   * @param {?number} seed 
   */
  sort(seed=undefined) {
    // seed may be a number, undefined or 0
    if ( seed ) {
      console.log('reusing seed', seed);
    } else if ( settings.dealWinnable && rules.Winnable.length ) {
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

    gameState[rules.Name].seed = seed;
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
    if ( c.isTopCard() )
      return [c];
    else
      return null;
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
        console.assert(this instanceof Stock);
        count++;  // stock, clicking will flip and move it to waste
      } else {
        count += c.potentialMovesToContainers();
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
      c.markMoveable();
      if ( !c.faceDown && this.canGrab(c) ) {
        count += c.potentialMovesToContainers();
      }
    });
    return count;
  }

  /**
   * @returns {number}
   */
  availableMoves() {
    // default just test top card; can be overridden by derived classes
    this.cards.forEach( c => c.markMoveable() );
    return this.availableMovesTopCard_();
  }

  /**
   * Bury a card (e.g. the King in Baker's Dozen)
   * @private
   */
  bury_() {
    const b = this.cards.filter( c => c.ordinal === rules.Tableau.bury );
    if ( b ) {
      const tmp = b.concat(
        this.cards.filter( c => c.ordinal !== rules.Tableau.bury )
      );
      this.cards = /** @type {Card[]} */([]);
      for ( const c of tmp ) {
        this.push(c);
      }
    }
  }

  /**
   * Disinter a card (e.g. an Ace in Freecell Easy)
   * @private
   */
  disinter_() {
    const d = this.cards.filter( c => c.ordinal === rules.Tableau.disinter );
    if ( d ) {
      const cards = this.cards.filter( c => c.ordinal !== rules.Tableau.disinter );
      this.cards = /** @type {Card[]} */([]);
      for ( const c of cards ) {
        this.push(c);
      }
      for ( const c of d ) {
        this.push(c);
      }
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
    for ( let ch of this.a_deal ) {
      let c = null;

      if ( 'uU'.includes(ch) ) {
        if ( c = stock.pop() ) { // StockFan
          this.push(c);
        }
      } else if ( 'dD'.includes(ch) ) {
        if ( c = stock.pop() ) { // StockFan
          this.push(c);
          c.flipDown();
        }
      } else if ( 'pP'.includes(ch) ) {
        /*
            The beak; see http://www.parlettgames.uk/patience/penguin.html
            Move the three other cards of the same ordinal in this Stock to Foundations[0,1,2]
            Then place this card as if it were an 'u'
        */
        if ( c = stock.pop() ) {
          const stock3 = stock.cards.filter( sc => sc.ordinal === c.ordinal );
          console.assert(stock3.length===3);
          stock3.forEach( sc => sc.flipUp() );
          stock.cards = stock.cards.filter( sc => sc.ordinal !== c.ordinal );
          for ( let i=0; i<stock3.length; i++ )
            foundations[i].push(stock3[i]);
          this.push(c);
        }
      } else if ( '♥♦♣♠'.includes(ch) ) {
        // e.g. ♥01
        const suit = ch;
        const ord = Number.parseInt(this.a_deal.slice(1), 10);
        const idx = stock.cards.findIndex( e => e.suit === suit && e.ordinal === ord );
        // i = this.a_deal.length;     // to break out of loop
        if ( idx > -1 ) {
          c = stock.cards.splice(idx, 1)[0];  // returns an array of deleted items
          c.flipUp();
        } else {
          console.error('cannot find', suit, ord, 'in stock');
          return;
        }
        this.push(c);
        break; // this will be the only thing in this.a_deal
      } else {
        console.error('unexpected character in deal', ch);
      }
    }

    if ( rules.Tableau.bury ) {
      // pause so user can see what's happening
      window.setTimeout(this.bury_.bind(this), 1000);
    }
    if ( rules.Tableau.disinter ) {
      // pause so user can see what's happening
      window.setTimeout(this.disinter_.bind(this), 1000);
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
      const max = rules.maxfan === 0 ? baize.height - this.pt.y : this.pt.y + (rules.maxfan * 100);

      let arr = this.dynamicArrayY_();
      while ( arr[arr.length-1] + Constants.CARD_HEIGHT > max && this.stackFactor < Constants.MAX_STACK_FACTOR ) {
        this.stackFactor += (1.0/4.0);
        arr = this.dynamicArrayY_();
      }
      if ( this.stackFactor !== oldStackFactor ) {
        for ( let i=0; i<this.cards.length; i++ ) {
          const c = this.cards[i];
          c.animate(Util.newPoint(this.pt.x, arr[i]));
        }
      }
    } else if ( rules.fan === 'Right' ) {
      this.stackFactor = Constants.DEFAULT_STACK_FACTOR_X;
      const max = rules.maxfan === 0 ? baize.width - this.pt.x : this.pt.x + (rules.maxfan * 67);

      let arr = this.dynamicArrayX_();
      while ( arr[arr.length-1] + Constants.CARD_WIDTH > max && this.stackFactor < Constants.MAX_STACK_FACTOR ) {
        this.stackFactor += (1.0/4.0);
        arr = this.dynamicArrayX_();
      }
      if ( this.stackFactor !== oldStackFactor ) {
        for ( let i=0; i<this.cards.length; i++ ) {
          const c = this.cards[i];
          c.animate(Util.newPoint(arr[i], this.pt.y));
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
   * @param {SVGPoint} pt
   * @param {SVGGElement} g
   */
  constructor(pt, g) {
    super(pt, g);
    this.rules = rules.Cell;
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    if ( !settings.autoPlay )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      moveCards(this, cc, 1);
    else
      c.shake();
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
    if ( null === this.rules.target )
      return true;
    return ( this.rules.target === cc.constructor.name );
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
   */
  autoMove() {
    if ( 0 === this.cards.length ) {
      if ( waste.cards.length > 0 ) {
        moveCards(waste, this, 1);
      } else if ( stock.cards.length > 0 ) {
        moveCards(stock, this, 1);
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
   * @param {SVGGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.rules = rules.Reserve;
    this.resetStackFactor_(this.rules);
  }

  /**
   * @override
   * @param {Card} c
   */
  push(c) {
    // DRY same as Tableau.push
    if ( 0 === this.cards.length )
      this.resetStackFactor_(this.rules);

    const ptNew = Util.newPoint(this.pt);
    if ( this.rules.fan === 'Down' )
      ptNew.y = this.dynamicY_();
    else if ( this.rules.fan === 'Right' )
      ptNew.x = this.dynamicX_();

    super.push(c, ptNew);
  }

  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();
    const cExposed = this.peek();
    if ( cExposed && cExposed.faceDown ) {
      cExposed.flipUp();  // TODO defer this flip until after any move
    }
    return c;
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // can be face up or face down
    if ( c.faceDown )
      return;
    if ( !c.isTopCard() )
      return;
    if ( !settings.autoPlay )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      moveCards(this, cc, 1);
    else
      c.shake();
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
    if ( null === this.rules.target )
      return true;
    return ( this.rules.target === cc.constructor.name );
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
        for ( const dst of foundations ) {
          if ( 0 === dst.cards.length ) {  // c will have no owner, so can't use canAcceptCard
            dst.push(c);
            break;
          }
        }
      } else {
        this.push(c);   // popping off stock flips card up
      }
    }

    // In case there is no ace segregated in making the reserve,
    // an ace is removed from the stock to become the first foundation.
    if ( !foundations.some( f => f.cards.length > 0 ) ) {
      const idx = stock.cards.findIndex( c => 1 === c.ordinal );
      const c = stock.cards.splice(idx, 1)[0];    // returns array of deleted items
      foundations[0].push(c);
      c.flipUp();
    }
  }
}

class Stock extends CardContainer {
  /**
   * @param {SVGPoint} pt
   * @param {SVGGElement} g
   */
  constructor(pt, g) {
    super(pt, g);

    this.rules = rules.Stock;
    if ( this.rules.hidden ) {
      this.g.style.display = 'none';
    }

    this.redeals = this.rules.redeals;
    // this.updateRedealsSVG_();

    g.onclick = this.clickOnEmpty.bind(this);
  }

  /**
   * @return {Number}
   */
  expectedNumberOfCards() {
    return this.rules.packs * 13 * this.rules.suitfilter.length;
  }

  createPacks() {
    this.cards = /** @type {Card[]} */([]);
    for ( let p=0; p<this.rules.packs; p++ ) { // default to 1
      for ( let s of this.rules.suitfilter ) { // defaults to '♠♥♦♣'
        for ( let o=1; o<Constants.cardValues.length; o++ ) {
          // create and assign new cards low-level because they're not ready to be moved yet
          const c = new Card(p, s, o, true, this.pt);
          c.owner = this;
          this.cards.push(c);
        }
      }
    }
    console.log(`${stock.cards.length} cards created`);
    if ( this.cards.length !== this.expectedNumberOfCards() ) { 
      displayToast(`created ${this.canAcceptCard.length} cards, expected ${stock.expectedNumberOfCards()}`);
    }
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
    const txt = this.g.querySelector('text');
    if ( txt ) {
      txt.innerHTML = this.redealsAvailable() ? Constants.REDEALS_SYMBOL : '';
    }
  }

  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();
    if ( c && c.faceDown )
      c.flipUp(); // automatic
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
      c.flipDown(); // automatic
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
    }
  }

  clickOnEmpty() {
    if ( waste && this.redealsAvailable() ) {
      undoPush();
      while ( waste.cards.length ) {
        const c = waste.cards.pop(); // low level pop to bypass 3-card shuffle
        stock.push(c);
        undoPop();
      }
      this.decreaseRedeals();
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
    if ( null === this.rules.target )
      return true;
    return ( this.rules.target === cc.constructor.name );
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
    let count = 0;
    if ( !this.rules.hidden ) {
      if ( 0 === this.cards.length ) {
        if ( this.redealsAvailable() ) {
          count = 1;
        }
      } else {
        count = super.availableMoves();
      }
    }
    return count;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let r = `The game uses ${Util.plural(this.rules.packs, 'pack')} of cards.`;
    if ( !this.rules.hidden ) {
      if ( null === this.rules.redeals )
        r += ' The stock can be redealt any number of times.';
      else if ( Number.isInteger(this.rules.redeals) && this.rules.redeals > 0 )
        r += ` The stock can be redealt ${Util.plural(this.rules.redeals, 'time')}.`;
      else
        r += ' The stock cannot be redealt.';
    }
    return r;
  }
}

class StockKlondike extends Stock {
  // moves cards to Waste when clicked
  /**
   * @param {SVGPoint} pt 
   * @param {SVGGElement} g 
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
    // override to move 1 or 3 cards at once to waste; kludge (rule peeking)
    if ( Number.isInteger(rules.Waste.maxcards) && !(waste.cards.length < rules.Waste.maxcards) )
      return;
    moveCards(this, waste, this.rules.cards);
    // c.moveSome(waste, this.rules.cards);
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let e = super.english();
    return `${e} Clicking on the stock will transfer ${Util.plural(this.rules.cards, 'card')} to the waste stack.`;
  }
}

class StockAgnes extends Stock {
  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    undoPush();
    for ( const r of reserves ) {
      if ( r.cards.length > 0 ) {
        moveCards(this, r, 1);
        undoPop();
      }
    }
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
    undoPush();
    for ( const t of tableaux ) {
      if ( this.cards.length > 0 ) {
        moveCards(this, t, 1);  // this pushes an entry onto undoStack, so ...
        undoPop();  // ... take it off so all moves count as one
      }
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length ? 1 : 0;
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
    undoPush();
    for ( const t of tableaux ) {
      if ( this.cards.length > 0 ) {
        moveCards(this, t, 1);
        undoPop();
      }
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length ? 1 : 0;
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
    moveCards(this, foundations[0], 1);
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.cards.length ? 1 : 0;
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
   * @param {SVGGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.createRedealsSVG_();
  }

  /**
   * @private
   * @returns {Array}
   */
  part1_() {
    const tmpCards = [];
    for ( let i=tableaux.length-1; i>=0; i-- ) {
      const src = tableaux[i].cards;
      const tmp = [];
      while ( src.length )
        tmp.push(src.pop());
      while ( tmp.length )
        tmpCards.push(tmp.pop());
    }
    /*
    for ( let i=1; i<tableaux.length; i++ ) {
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
        baize.elevateCard(c);
        if ( rules.Tableau.fan === 'Down' )
          c.animate(Util.newPoint(tab.pt.x, tab.dynamicY_(j)));
        else if ( rules.Tableau.fan === 'Right' )
          c.animate(Util.newPoint(tab.dynamicX_(j), tab.pt.y));
      }
    }
  }

  clickOnEmpty() {
    if ( this.redealsAvailable() ) {
      undoPush();
      const tmp = this.part1_();
      this.part2_(tmp);
      this.part3_();

      if ( 1 === allAvailableMoves() ) {  // repaint moveable cards
        displayToastNoAvailableMoves();
      }

      this.decreaseRedeals();
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.redealsAvailable() ? 1 : 0;
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
   * @param {SVGPoint} pt 
   * @param {SVGGElement} g 
   */
  constructor(pt, g) {
    super(pt, g);
    this.createRedealsSVG_();
  }

  clickOnEmpty() {
    if ( this.redealsAvailable() ) {
      undoPush();
      // move all cards back to stock, can't use pop and push
      // because that will register in undo
      tableaux.forEach( t => {
        stock.cards = stock.cards.concat(t.cards);
        t.cards = /** @type {Card[]} */([]);
      });
      stock.cards.forEach( c => {
        c.owner = stock;
        // all fan games are all face up?
        // if ( !c.faceDown )
        //     c.flipDown();
        c.position1(stock.pt.x, stock.pt.y);
      });

      const oldSeed = gameState[rules.Name].seed;
      stock.sort(123456);         // just some made up, reproduceable seed
      gameState[rules.Name].seed = oldSeed;   // sort(n) over-writes this

      tableaux.forEach( t => {
        window.setTimeout( () => t.deal(), 0 );
      });

      waitForCards().then ( () => {
        if ( 1 === allAvailableMoves() ) {  // repaint moveable cards
          displayToastNoAvailableMoves();
        }
        this.decreaseRedeals();
      });
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    return this.redealsAvailable() ? 1 : 0;
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
   * @param {SVGPoint} pt
   * @param {SVGGElement} g
   */
  constructor(pt, g) {
    super(pt, g);
    this.rules = rules.Waste;
  }
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
    const ptNew = Util.newPoint(this.pt);
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
    super.push(c, ptNew);
    if ( c.faceDown )
      c.flipUp();     // automatic
    c.markMoveable(); // experimental, cosmetic
  }

  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();  // console.assert(!c.faceDown);

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
    if ( !c.isTopCard() )
      return;
    if ( !settings.autoPlay )
      return;

    let cc = null;
    cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(cells);      // Carpet
    if ( cc )
      moveCards(this, cc, 1);
    else
      c.shake();
  }

  /**
   * @override
   * @param {Card} c 
   */
  canAcceptCard(c) {
    if ( Number.isInteger(this.rules.maxcards) && !(this.cards.length < this.rules.maxcards) )
      return false;
    // waste can accept a dragged card only from stock
    return (c.owner instanceof Stock) && (1 === rules.Stock.cards); // TODO kludge (rule peeking)
  }

  /**
   * @override
   * @param {CardContainer} cc
   * @returns {boolean} 
   */
  canTarget(cc) {
    if ( null === this.rules.target )
      return true;
    return ( this.rules.target === cc.constructor.name );
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    return 0 === this.cards.length;
  }

  // uses default availableMoves() - just top card

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
   * @param {SVGGElement} g
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
    // console.assert(!c.faceDown);
    const ptNew = Util.newPoint(this.pt);
    if ( rules.Foundation.fan === 'Down' )
      ptNew.y = this.dynamicY_();
    else if ( rules.Foundation.fan === 'Right' )
      ptNew.x = this.dynamicX_();
    super.push(c, ptNew);
    updatePercent();
  }

  /**
   * @override
   * @param {Card} c
   */
  onclick(c) {
    // TODO why even have this? we never allow play from a foundation
    // console.assert(!c.faceDown);
    if ( !settings.playFromFoundation )
      return;
    if ( !settings.autoPlay )
      return;
    const cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      moveCards(this, cc, 1);
    else
      c.shake();
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
    this.cards.forEach( c => c.markMoveable() );
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
          // if a_accept is a special symbol, it won't match with card's ordinal
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
    if ( settings.playFromFoundation )
      return [c];
    return null;
  }

  /**
   * @returns {boolean}
   * 
   * Don't need to wait here or slow down animation, as each card
   * will only be moving once
   */

  /**
   * "Microsoft FreeCell or FreeCell Pro only plays an available card to its 
   * homecell automatically when all of the lower-ranked cards of the opposite color 
   * are already on the homecells (except that a two is played if the corresponding 
   * ace is on its homecell); aces are always played when available. This is one 
   * version of what can be called safe autoplay"
   */
  collector() {
    /**
     * only autocollect to a foundation if it is one of the smallest
     * 
     * @return {Boolean}
     */
    const safeCheck_ = () => {
      if ( settings.autoKollect === 'safe' ) {
        let fmin = foundations[0].cards.length;
        for ( let i=1; i<foundations.length; i++ ) {
          fmin = Math.min(fmin, foundations[i].cards.length);
        }
        return ( this.cards.length === fmin );
      } else {
        return true;
      }
    };

    /**
     * @param {Card} c
     */
    const collect_ = (c) => {
      if ( c && !c.faceDown ) {
        if ( c.owner.canTarget(this) && this.canAcceptCard(c) && safeCheck_() ) {
          moveCards(c.owner, this, 1);
          cardsMoved++;
        }
      }
    }

    let cardsMoved = 0;
    cells.forEach( cc => collect_(cc.peek()) );
    tableaux.forEach( t => collect_(t.peek()) );
    return cardsMoved > 0;
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
      this.cards.forEach( c => c.markMoveable(this) );
      this['scatter'+rules.Foundation.scatter]();
      this.scattered = true;
    }
  }

  scatterNone() {
  }

  scatterCircle() {
    function scat() {
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
      const pt = Util.newPoint(
        this.pt.x,
        this.pt.y + ((this.ordinal-1) * Math.round(Constants.CARD_HEIGHT/3)));
      this.animate(pt);
    }

    this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
  }

  scatterLeft() {
    function scat() {
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
   * @override
   * @returns {boolean}
   */
  collector() {
    if ( this.cards.length ) return false;

    let cardMoved = false;
    tableaux.forEach( t => {
      if ( t.cards.length >= 13 ) {
        for ( const c of t.cards ) {
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
    return `Foundation ${countInstances(Foundation)}. Single cards cannot be moved to the foundation. Only when you have constructed a complete sequence on the tableau, 13 cards in sequence from King to Ace, may you move it to the foundation.`;
  }
}

class Tableau extends CardContainer {
  /**
   * @param {SVGPoint} pt
   * @param {SVGGElement} g
   */
  constructor(pt, g) {
    super(pt, g);
    this.rules = rules.Tableau;
    this.resetStackFactor_(this.rules);
    if ( 0 === this.a_accept && this.rules.accept ) {
      // accept not specified in guts, so we use rules
      this.a_accept = this.rules.accept;
      this.createAcceptSVG_();
    }
  }

  /**
   * @override
   * @param {Card} c 
   */
  push(c) {   // DRY same as Reserve.push
    if ( 0 === this.cards.length )
      this.resetStackFactor_(this.rules);

    const ptNew = Util.newPoint(this.pt);
    if ( this.rules.fan === 'Down' )
      ptNew.y = this.dynamicY_();
    else if ( this.rules.fan === 'Right' )
      ptNew.x = this.dynamicX_();
    super.push(c, ptNew);
  }
  /**
   * @override
   * @returns {Card}
   */
  pop() {
    const c = super.pop();
    const cExposed = this.peek();
    if ( cExposed && cExposed.faceDown ) {
      cExposed.flipUp(); // TODO defer this flip until after any move
    }
    return c;
  }

  /**
   * @override
   * @param {Card} c 
   * @returns {boolean}
   */
  canAcceptCard(c) {
    let accept = true;

    if ( Number.isInteger(this.rules.maxcards) && !(this.cards.length < this.rules.maxcards) ) {
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
        accept = isConformant0(this.rules.build, tc, c);
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
    if ( null === this.rules.target )
      return true;
    return ( this.rules.target === cc.constructor.name );
  }

  /**
   * @override
   * @param {Card} c 
   */
  onclick(c) {
    // although card flipping is automatic, there may be a face down card in the original
    // deal. So, we manually check for face down just in case
    // if ( c.faceDown && c.isTopCard() ) {
    //   c.flipUp();
    //   return;
    // }

    if ( c.faceDown )
      return;

    if ( !settings.autoPlay )
      return;

    if ( !this.canGrab(c) )
      return;

    let cc = null;
    if ( c.isTopCard() )
      cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( !cc && c.isTopCard() )
      cc = c.findFullestAcceptingContainer(cells);
    if ( cc )
      c.moveTail(cc);
    else
      c.shake();
  }

  /**
   * @override
   * @returns {boolean}
   */
  isSolveable() {
    if ( this.cards.length )
      return isConformant(this.rules.build, this.cards);
    else
      return true;
  }

  /**
   * @override
   * @returns {string}
   */
  english() {
    let r = '';
    if ( this.rules.build.suit === this.rules.move.suit
      && this.rules.build.rank === this.rules.move.rank )
      r = `Tableau ${countInstances(Tableau)}. Build ${englishRules(this.rules.build)}.`;
    else
      r = `Tableau ${countInstances(Tableau)}. Build ${englishRules(this.rules.build)}. Move sequences ${englishRules(this.rules.move)}.`;

    if ( this.rules.bury )
      r += ` At the start, ${Constants.cardValuesEnglish[this.rules.bury]}s are moved to the bottom of the tableau.`;
    if ( this.rules.disinter )
      r += ` At the start, ${Constants.cardValuesEnglish[this.rules.disinter]}s are moved to the top of the tableau.`;

    if ( tableaux[0].a_accept === Constants.ACCEPT_NOTHING_SYMBOL )
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
   * @returns {Array<Card>|null} 
   */
  canGrab(c) {
    const tail = c.getTail();
    if ( isConformant(this.rules.move, tail) )
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
    e += ' Completed sequences of cards may be moved together.';
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
      if ( stock.cards.length > 0 ) {
        moveCards(stock, this, 1);
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
      if ( waste.cards.length > 0 ) {
        moveCards(waste, this, 1);
      } else if ( stock.cards.length > 0 ) {
        moveCards(stock, this, 1);
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
      if ( reserves[0].cards.length > 0 ) {
        moveCards(reserves[0], this, 1);
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
  onclick(c) {
    if ( c.faceDown )
      return;

    if ( !settings.autoPlay )
      return;

    if ( !this.canGrab(c) )
      return;

    let cc = c.findFullestAcceptingContainer(foundations);
    if ( !cc )
      cc = c.findFullestAcceptingContainer(tableaux);
    if ( cc )
      c.moveTail(cc);
    else
      c.shake();
  }
}

class TableauFreecell extends Tableau {
  /**
   * @private
   * @param {boolean} moveToEmptyColumn 
   * @returns {number}
   */
  powerMoves_(moveToEmptyColumn=false) {
    // (1 + number of empty freecells) * 2 ^ (number of empty columns)
    // see http://ezinearticles.com/?Freecell-PowerMoves-Explained&id=104608
    // and http://www.solitairecentral.com/articles/FreecellPowerMovesExplained.html
    // Could use Array.reduce to count empty containers, but it's less readable
    let emptyCells = 0;
    cells.forEach( c => {
      if ( 0 === c.cards.length ) emptyCells++;
    } );
    let emptyCols = 0;
    tableaux.forEach( c => {
      if ( 0 === c.cards.length ) emptyCols++;
    } );
    if ( moveToEmptyColumn && emptyCols > 0 ) {
      emptyCols -= 1;
    }
    // 2^1 == 2, 2^0 == 1, 2^-1 == 0.5
    return (1 + emptyCells) * (Math.pow(2, emptyCols));
  }

  /**
   * @override 
   * @param {Card} c 
   * @returns {Array<Card>|null}
   */
  canGrab(c) {
    const tail = c.getTail();
    if ( !isConformant(this.rules.move, tail) ) {
      // console.warn('tail is not conformant');
      return null;
    }
    const pm = this.powerMoves_();
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
    // if c comes from Stock, Waste, Cell or Reserve it's only going to be one card,
    // so allow it
    if ( accept && (c.owner instanceof Tableau) ) {
      const tail = c.getTail();
      if ( tail && tail.length > 0 ) {
        const pm = this.powerMoves_(0 === this.cards.length);
        if ( tail.length > pm ) {
          // console.log(`accept: you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
          accept = false;
        }
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
    if ( c.isTopCard() ) {
      if ( foundations[0].canAcceptCard(c) ) {
        moveCards(this, foundations[0], 1);
      } else {
        c.shake();
      }
    }
  }

  /**
   * @override
   * @returns {number}
   */
  availableMoves() {
    this.cards.forEach( c => c.markMoveable() );

    const c = this.peek();
    if ( c && foundations[0].canAcceptCard(c) ) {
      c.markMoveable(foundations[0]);
      return 1;
    }
    return 0;
  }
}

/**
 * @param {Array} ccClasses 
 * @returns {Array<CardContainer>}
 */
function linkClasses(ccClasses) {
  const /** Array<CardContainer> */dst = [];
  ccClasses.forEach ( ccClass => {
    // window[e] = e; // export for --compilation_level ADVANCED_OPTIMIZATIONS 
    // <g class="StockKlondike"><rect x="10" y="10"></rect></g>
    document.querySelectorAll('g.' + ccClass.name).forEach( g => {
      // g contains a rect, the rect contains x,y attributes in SVG coords
      const r = g.querySelector('rect');
      const x = Number.parseInt(r.getAttribute('x'), 10) || 0;
      const y = Number.parseInt(r.getAttribute('y'), 10) || 0;
      const pt = Util.newPoint(x, y);
      dst.push(new ccClass(pt, g));
    });
  });
  return dst;
}

/**
 * @param {Function} ccType
 * @returns {string}
 */
function countInstances(ccType) {
  let count = 0;
  cardContainers.forEach( cc => {
    if ( cc instanceof ccType )
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
function isConformant0(rules, cPrev, cThis) {
  // written for simplicity and speed, not prettiness
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
        } else if ( cThis.ordinal !== cPrev.ordinal + 1 ) {
          return false;
        }
      } else {
        if ( cThis.ordinal !== cPrev.ordinal + 1 ) {
          return false;
        }
      }
      break;
    case 2: // down, e.g. a 9 goes on a 10
      if ( rules.rankwrap ) {
        if ( cPrev.ordinal === 1 && cThis.ordinal === 13 ) {
          // a King on an Ace
        } else if ( cThis.ordinal !== cPrev.ordinal - 1 ) {
          return false;
        }
      } else {
        if ( cThis.ordinal !== cPrev.ordinal - 1 ) {
          return false;
        }
      }
      break;
    case 4: // either up or down
      if ( rules.rankwrap ) {
        if ( cPrev.ordinal === 13 && cThis.ordinal === 1 ) {
        } else if ( cPrev.ordinal === 1 && cThis.ordinal === 13 ) {
        } else if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) ) {
          return false;
        }
      } else {
        if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) ) {
          return false;
        }
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

/**
 * @returns {number}
 */
function calcPercent() {
  let count = 0;
  foundations.forEach( (f) => {
    count += f.cards.length;
  });
  return Math.round(count / stock.expectedNumberOfCards() * 100);
}

function updatePercent() {
  // waitForCards()
  // .then( () => {
    const ele = document.getElementById('percentComplete');
    if ( ele ) {
      ele.innerHTML = String(calcPercent() + '%');
    }
  // });
}

function isComplete() {
  return cardContainers.every( cc => cc.isComplete() );
}

function pullCardsToFoundations() {
  let cardMoved = false;
  foundations.forEach( (f) => {
    if ( f.collector() )
      cardMoved = true;
  });
  return cardMoved;
}

function allAvailableMoves() {
  return cardContainers.reduce( (acc,obj) => {
    return acc + obj.availableMoves();
  }, 0);
}

window.doshowavailablemoves = function() {
  const a = allAvailableMoves();
  if ( 0 === a )
    displayToastNoAvailableMoves();
  else
    displayToast(`<span>${Util.plural(a, 'move')} available</span>`);
}

function gameOver() {
  const GSRN = gameState[rules.Name];

  if ( isComplete() ) {
    console.log('recording stats for won game', GSRN);
    GSRN.totalGames += 1;
    GSRN.totalMoves += undoStack.length;
  
    GSRN.gamesWon += 1;

    if ( GSRN.currStreak < 0 )
      GSRN.currStreak = 1;
    else
      GSRN.currStreak += 1;
    if ( GSRN.currStreak > GSRN.bestStreak )
      GSRN.bestStreak = GSRN.currStreak;

    GSRN.bestPercent = 100;
  } else if ( undoStack.length > 0 ) {
    console.log('recording stats for lost game', GSRN);
    GSRN.totalGames += 1;
    GSRN.totalMoves += undoStack.length;
  
    if ( GSRN.currStreak > 0 )
      GSRN.currStreak = -1; // bug fix currStreak can never be zero
    else
      GSRN.currStreak -= 1;
    if ( GSRN.currStreak < GSRN.worstStreak )
      GSRN.worstStreak = GSRN.currStreak;

    if ( GSRN.bestPercent < 100 ) {
      const thisPercent = calcPercent();
      if ( thisPercent > GSRN.bestPercent ) {
        GSRN.bestPercent = thisPercent;
      }
    }
  } else {
    console.log('game over with no moves');
  }

  GSRN.modified = Date.now();
  if ( GSRN.undoStack ) {
    GSRN.undoStack = []; // either way, start with a new deal
  }
}

/**
 * @param {?Number} seed
*/
function restart(seed=undefined) {
  // move all cards back to stock, can't use pop and push
  // because Blockade will try to push them back to an empty tab
  cardContainers.forEach( cc => {
    if ( cc !== stock ) {
      stock.cards = stock.cards.concat(cc.cards);
      cc.cards = /** @type {Card[]} */([]);
    }
  });
  stock.cards.forEach( c => {
    c.owner = stock;
    if ( !c.faceDown )
      c.flipDown();
    c.position1(stock.pt.x, stock.pt.y);
  });

  stock.sort(seed);
  stock.cards.forEach( c => baize.elevateCard(c) );
  stock.redeals = rules.Stock.redeals; // could be null
  undoReset();
  updatePercent();
  foundations.forEach( f => f.scattered = false );
  if ( gameState[rules.Name].undoStack ) {
    gameState[rules.Name].undoStack = [];
  }
  dealCards();
}

window.dostar = function() {
  gameOver();
  restart();
}

window.dostarseed = function() {
  modalStarSeedFn.open();
}

window.dostarseeddeal = function() {
  let seed = parseInt(document.getElementById('starSeed').value);
  if ( isNaN(seed) || (seed < 0 || seed > 999999) ) {
    displayToast('deal number must be 1 ... 999999');
  } else {
    gameOver();
    restart(seed);
  }
}

window.doreplay = function() {
  gameOver();
  restart(gameState[rules.Name].seed);
}

window.dofindnewgame = function() {
  // game state will be saved automatically when page unloads, don't do gameOver()
  window.location.replace('chooser.html');
}

/*
function doautocollect() {
  for ( let cardMoved = pullCardsToFoundations(); cardMoved; cardMoved = pullCardsToFoundations() ) {
    waitForCards()
    .catch( (reason) => console.log('autocollect', reason) );
  }
}
*/
class Saved {
  constructor() {
    this.seed = gameState[rules.Name].seed;
    this.redeals = stock.redeals;
    // this.moves no longer need this
    // this.undo no longer need this
    this.containers = [];
    for ( let i=0; i<cardContainers.length; i++ ) {
      this.containers[i] = cardContainers[i].getSaveableCards();
    }
  }
}

window.dosaveposition = function() {
  gameState[rules.Name].savedPosition = undoStack.length;
  displayToast('this position saved');
}

window.doloadposition = function() {
  if ( !gameState[rules.Name].hasOwnProperty('savedPosition') ) {
    displayToast('no saved position');
  } else if ( gameState[rules.Name].savedPosition < undoStack.length ) {
    while ( undoStack.length > gameState[rules.Name].savedPosition ) {
      window.doundo();
    }
    // keep the saved position, it's obviously meaningful to the player
    // delete gameState[rules.Name].savedPosition;
  }
}

/**
 * Load game from gameState[rules.Name]
 * 
 * @return {Boolean}
 */
window.doload = function() {
  // games are saved by popping current state onto undoStack and saving that
  if ( gameState[rules.Name].undoStack.length === 0 ) {
    return false;
  }
  undoStack = gameState[rules.Name].undoStack;
  const gss = undoPop();
  // gss will contain seed, redeals, containers
  // check that saved contains the expected number of cards
  let nCards = 0;
  for ( let i=0; i<gss.containers.length; i++ ) {
    nCards += gss.containers[i].length;
  }
  if ( nCards !== stock.expectedNumberOfCards() ) {
    console.log(`found ${nCards} in saved, expected ${stock.expectedNumberOfCards()}`);
    undoReset();
    return false;
  }

  for ( let i=0; i<cardContainers.length; i++ ) {
    cardContainers[i].load(gss.containers[i]);
  }
  gameState[rules.Name].seed = gss.seed;
  if ( gss.hasOwnProperty('redeals') ) {
    stock.redeals = gss.redeals;
  } else {
    stock.redeals = null;
  }
  stock.updateRedealsSVG_();
  scrunchContainers();
  checkIfGameOver();
  return true;
}

const modalStarSeedFn = M.Modal.getInstance(document.getElementById('modalStarSeed'));
modalStarSeedFn.options.onOpenStart = function() {
  const ele = document.getElementById('starSeed');
  if ( ele ) {
    ele.value = String(gameState[rules.Name].seed);
    ele.focus();
  }
};

modalStarSeedFn.options.onCloseEnd = function() {
};

const modalSettingsFn = M.Modal.getInstance(document.getElementById('modalSettings'));
modalSettingsFn.options.onOpenStart = function() {
  document.getElementById('aniSpeed').value = settings.aniSpeed;
  document.getElementById('sensoryCues').checked = settings.sensoryCues;
  document.getElementById('autoPlay').checked = settings.autoPlay;

  document.getElementById('autoAny').checked = settings.autoKollect === 'any';
  document.getElementById('autoSafe').checked = settings.autoKollect === 'safe';
  document.getElementById('autoSolvable').checked = settings.autoKollect === 'solvable';
  document.getElementById('autoOff').checked = settings.autoKollect === 'off';
};

modalSettingsFn.options.onCloseEnd = function() {
  settings.aniSpeed = document.getElementById('aniSpeed').value;
  settings.sensoryCues = document.getElementById('sensoryCues').checked;
  settings.autoPlay = document.getElementById('autoPlay').checked;

  if ( document.getElementById('autoAny').checked )
    settings.autoKollect = 'any';
  else if ( document.getElementById('autoSafe').checked )
    settings.autoKollect = 'safe';
  else if ( document.getElementById('autoSolvable').checked )
    settings.autoKollect = 'solvable';
  else if ( document.getElementById('autoOff').checked )
    settings.autoKollect = 'off';

  allAvailableMoves();   // mark moveable cards
};

const modalStatisticsFn = M.Modal.getInstance(document.getElementById('modalStatistics'));
modalStatisticsFn.options.onOpenStart = function() {
  const GSRN = gameState[rules.Name];
  if ( isComplete() ) {
    document.getElementById('thisGameStats').innerHTML = `You won this game of ${rules.Name} (number ${GSRN.seed}) in ${Util.plural(undoStack.length, 'move')}`;
  } else {
    let s = `Moves made: ${undoStack.length}, moves available: ${allAvailableMoves()}`;
    if ( !rules.Stock.hidden ) {
      s += `, stock cards: ${stock.cards.length}`;
    }
    if ( waste ) {
      s += `, waste cards: ${waste.cards.length}`;
    }
    s += `, game number: ${GSRN.seed}`;
    /*
      used to calculate % of foundation complete here
      but the calculation gets kludgey with Grandfather's Clock and Golf
    */
    document.getElementById('thisGameStats').innerHTML = s;
  }

  if ( GSRN.totalGames === 0 ) {
    document.getElementById('gamesPlayedStats').innerHTML = `You've not played ${rules.Name} before`;
  } else {
    if ( GSRN.gamesWon > 0 ) {
      document.getElementById('gamesPlayedStats').innerHTML = `You've played ${rules.Name} ${Util.plural(GSRN.totalGames, 'time')}, and won ${GSRN.gamesWon} (${Math.round(GSRN.gamesWon/GSRN.totalGames*100)}%)`;
    } else {
      document.getElementById('gamesPlayedStats').innerHTML = `You've played ${rules.Name} ${Util.plural(GSRN.totalGames, 'time')}; your best score is ${GSRN.bestPercent}%`;
    }
  }

  if ( GSRN.totalGames > 0 )
    document.getElementById('gamesStreakStats').innerHTML = `Your current streak is ${GSRN.currStreak}, your best winning streak is ${GSRN.bestStreak}, your worst is ${GSRN.worstStreak}`;
  else
    document.getElementById('gamesStreakStats').innerHTML = '';

  let totalPlayed = 0;
  let totalWon = 0;

  Object.keys(gameState).forEach( g => {
    if ( gameState[g].totalGames )
      totalPlayed += gameState[g].totalGames;
    if ( gameState[g].gamesWon )
      totalWon += gameState[g].gamesWon;
  });

  if ( totalPlayed )
    document.getElementById('gamesTotalStats').innerHTML = `In total, you have played ${Util.plural(totalPlayed, 'game')} and won ${totalWon} of them (${Math.round(totalWon/totalPlayed*100)}%)`;
};

modalStatisticsFn.options.onCloseEnd = function() {
};

const modalGameOverFn = M.Modal.getInstance(document.getElementById('modalGameOver'));
modalGameOverFn.options.onOpenStart = function() {
  const GSRN = gameState[rules.Name];
  let s = `You won this game of ${rules.Name} in ${undoStack.length} moves`;
  if ( GSRN.gamesWon > 1 ) {
    s = s + `; your average is ${Math.round(GSRN.totalMoves/GSRN.gamesWon)}`;
  }
  document.getElementById('movesMade').innerHTML = s;
  // document.getElementById('movesMade').innerHTML = `You won this game ${rules.Name} in ${undoStack.length} moves; your average is ${Math.round(GSRN.totalMoves/GSRN.gamesWon)}`;
};

modalGameOverFn.options.onCloseEnd = function() {
};

const modalAreYouSureFn = M.Modal.getInstance(document.getElementById('modalAreYouSure'));

/*
  https://stackoverflow.com/questions/50176213/accessing-exported-functions-from-html-file

  One of the purposes of ES modules (and JS modules in general) is to prevent the pollution of global scope.

  Module exports aren't supposed to leak to global scope.

  In case there's a need to interoperate with global scope, a variable should be explicitly exposed as a global inside a module:
*/
window.areYouSure = function(f) {
  // console.assert(typeof f === 'string');
  const ele = document.getElementById('modalAreYouSureYes');
  ele.setAttribute('onclick', `${f}()`);
  modalAreYouSureFn.open();
}

const modalShowRulesFn = M.Modal.getInstance(document.getElementById('modalShowRules'));
modalShowRulesFn.options.onOpenStart = function() {
  let r = '<p>' + stock.english() + '</p>';
  [waste,foundations[0],tableaux[0],cells[0],reserves[0]].forEach( cc => {
    if ( cc )
      r = r + '<p>' + cc.english() + '</p>';
  });
  document.getElementById('therules').innerHTML = r;

  const ele = /** @type {HTMLAnchorElement} */(document.getElementById('theruleswikipedia'));
  if ( rules.hasOwnProperty('Wikipedia') && rules.Wikipedia.length ) {
    ele.hidden = false;
    ele.href = rules.Wikipedia;
  } else {
    ele.hidden = true;
  }
};

window.doshowrules = function() {
  modalShowRulesFn.open();
}

window.dostatsreset = function() {
  const GSRN = gameState[rules.Name];
  GSRN.totalMoves = 0;
  GSRN.totalGames = 0;
  GSRN.gamesWon = 0;

  GSRN.currStreak = 0;
  GSRN.bestStreak = 0;
  GSRN.worstStreak = 0;

  GSRN.bestPercent = 0;

  GSRN.modified = Date.now();
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
  displayToast('<span>no available moves</span><button class="btn-flat toast-action" onclick="window.doundo()">Undo</button><button class="btn-flat toast-action" onclick="dostar()">New</button>');
}

window.dosettings = function() {
  modalSettingsFn.open();
}

window.dohelp = function() {
  window.open(rules.Wikipedia);
}

function dealCards() {
  cardContainers.forEach( cc => {
    window.setTimeout( () => cc.deal(), 100 );
  });
  waitForCards()
  .then( () => {
    undoReset();
  });
}

const rules = JSON.parse(document.getElementById('rules').innerHTML) || {};
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
if ( !rules.Waste.hasOwnProperty('hidden') )        rules.Waste.hidden = false;

if ( !rules.Cell.hasOwnProperty('target') )         rules.Cell.target = null;
if ( !rules.Cell.hasOwnProperty('hidden') )         rules.Cell.hidden = false;

if ( !rules.Reserve.hasOwnProperty('fan') )         rules.Reserve.fan = 'Down';
if ( !rules.Reserve.hasOwnProperty('maxfan') )      rules.Reserve.maxfan = 0;
if ( !rules.Reserve.hasOwnProperty('target') )      rules.Reserve.target = null;
if ( !rules.Reserve.hasOwnProperty('hidden') )      rules.Reserve.hidden = false;

if ( !rules.Foundation.hasOwnProperty('fan') )      rules.Foundation.fan = 'None';
if ( !rules.Foundation.hasOwnProperty('maxfan') )   rules.Foundation.maxfan = 0;
if ( !rules.Foundation.hasOwnProperty('scatter') )  rules.Foundation.scatter = 'Down';
if ( !rules.Foundation.hasOwnProperty('hidden') )   rules.Foundation.hidden = false;
if ( !rules.Foundation.hasOwnProperty('target') )   rules.Foundation.target = null;

if ( !rules.Tableau.hasOwnProperty('fan') )         rules.Tableau.fan = 'Down';
if ( !rules.Tableau.hasOwnProperty('maxcards') )    rules.Tableau.maxcards = null;    // allow any number of cards
if ( !rules.Tableau.hasOwnProperty('maxfan') )      rules.Tableau.maxfan = 0;
if ( !rules.Tableau.hasOwnProperty('build') )       rules.Tableau.build = {suit:2, rank:4};
if ( !rules.Tableau.hasOwnProperty('move') )        rules.Tableau.move = {suit:4, rank:2};
if ( !rules.Tableau.hasOwnProperty('target') )      rules.Tableau.target = null;
if ( !rules.Tableau.hasOwnProperty('hidden') )      rules.Tableau.hidden = false;

let settings = {};
try {
  // localStorage.getItem() can return null if key does not exist
  // JSON.parse(null) returns null
  settings = JSON.parse(localStorage.getItem(Constants.LOCALSTORAGE_SETTINGS)) || {};
} catch(e) {
  settings = {};
  console.error(e);
}
if ( !settings ) { settings = {} }

if ( settings.hasOwnProperty('autoCollect') )     delete settings.autoCollect;  // replaced with autoKollect 20.2.1.0
if ( !settings.hasOwnProperty('aniSpeed') )       settings.aniSpeed = 3;
if ( !settings.hasOwnProperty('autoKollect') )    settings.autoKollect = 'safe';
if ( !settings.hasOwnProperty('sensoryCues') )    settings.sensoryCues = true;
if ( !settings.hasOwnProperty('powerMoves') )     settings.powerMoves = true;
if ( !settings.hasOwnProperty('autoPlay') )       settings.autoPlay = true;
if ( !settings.hasOwnProperty('dealWinnable') )   settings.dealWinnable = false;
if ( !settings.hasOwnProperty('loadSaved') )      settings.loadSaved = true;

settings.lastGame = window.location.pathname.split('/').pop();
settings.lastVersion = Constants.GAME_VERSION;
if ( settings.aniSpeed < 1 || settings.aniSpeed > 5 )
  settings.aniSpeed = 3;

let gameState = {};
try {
  // localStorage.getItem() can return null if key does not exist
  // JSON.parse(null) returns null
  gameState = JSON.parse(localStorage.getItem(Constants.LOCALSTORAGE_GAMES)) || {};
} catch(e) {
  gameState = {};
  console.error(e);
}

if ( Object.keys(gameState).length === 0 ) {
  console.warn('game state not found in local storage');
}

if ( gameState.hasOwnProperty('Options') )
  delete gameState.Options;

if ( !gameState[rules.Name] )               gameState[rules.Name] = {};
if ( !gameState[rules.Name].totalMoves )    gameState[rules.Name].totalMoves = 0;
if ( !gameState[rules.Name].totalGames )    gameState[rules.Name].totalGames = 0;
if ( !gameState[rules.Name].gamesWon )      gameState[rules.Name].gamesWon = 0;

if ( !gameState[rules.Name].currStreak )    gameState[rules.Name].currStreak = 0;
if ( !gameState[rules.Name].bestStreak )    gameState[rules.Name].bestStreak = 0;
if ( !gameState[rules.Name].worstStreak )   gameState[rules.Name].worstStreak = 0;

if ( !gameState[rules.Name].bestPercent )   gameState[rules.Name].bestPercent = 0;

const stocks = /** @type {Array<Stock>} */ (linkClasses([Stock, StockAgnes, StockCruel, StockFan, StockKlondike, StockGolf, StockScorpion, StockSpider]));
const stock = stocks[0];
const wastes = /** @type {Array<Waste>} */ (linkClasses([Waste]));
const waste = wastes[0];
const foundations = /** @type {Array<Foundation>} */ (linkClasses([Foundation,FoundationCanfield,FoundationOsmosis,FoundationPenguin,FoundationSpider]));
const tableaux = /** @type {Array<Tableau>} */ (linkClasses([Tableau,TableauBlockade,TableauCanfield,TableauFortunesFavor,TableauFreecell,TableauGolf,TableauSpider,TableauTail]));
const cells = /** @type {Array<Cell>} */ (linkClasses([Cell,CellCarpet]));
const reserves = /** @type {Array<Reserve>} */ (linkClasses([Reserve,ReserveFrog]));

document.documentElement.style.setProperty('--bg-color', 'darkgreen');
document.documentElement.style.setProperty('--hi-color', 'lightgreen');

// document.addEventListener('contextmenu', event => event.preventDefault());

window.onbeforeunload = function(e) {
  const GSRN = gameState[rules.Name];
  undoPush();
  GSRN.undoStack = undoStack; // GSRN.saved is now ignored/deprecated to avoid loading old saved stuff into undoStack
  GSRN.modified = Date.now();
  try {
    localStorage.setItem(Constants.LOCALSTORAGE_GAMES, JSON.stringify(gameState));
    localStorage.setItem(Constants.LOCALSTORAGE_SETTINGS, JSON.stringify(settings));
  } catch(err) {
    console.error(err);
  }
// setting e.returnValue makes Chrome display a dialog
//    e.returnValue = gameState[rules.Name];
};

const someCardsInTransit = () => {
  // let arr = [];
  // for ( let i=0; i<cardContainers.length; i++ ) {
  //   for ( let j=0; j<cardContainers[i].cards.length; j++ ) {
  //     if ( cardContainers[i].cards[j].animationIds.length > 0 )
  //       arr.push(cardContainers[i].cards[j].id);
  //   }
  // }
  // if ( arr.length ) console.log(arr);

  for ( const cc of cardContainers ) {
    if ( cc.cards.some( c => c.animationIds.length ) )
      return true;
  }

  // use array indexing for memory
  // for ( let i=0; i<cardContainers.length; i++ ) {
  //   const ccds = cardContainers[i].cards;
  //   for ( let j=0; j<ccds.length; j++ ) {
  //     if ( ccds[j].animationIds.length > 0 )
  //       return true;
  //   }
  // }
  return false;
};

/**
 * @returns {Promise}
 */
const waitForCards = () => new Promise((resolve,reject) => {
  const tStart = performance.now();
  const tBored = tStart + 10000;
  const check = () => {
    if ( !someCardsInTransit() ) {
      resolve(performance.now() - tStart);
    } else if ( performance.now() > tBored ) {
      reject('timed out waiting for cards to finish moving');
    } else {
      window.setTimeout(check, 100);
    }
  };
  window.setTimeout(check, 0);
});

/**
 * @param {Card} c 
 * @returns {Promise}
 */
const waitForCard = (c) => new Promise((resolve,reject) => {
  const tStart = performance.now();
  const tBored = tStart + 10000;
  const check = () => {
    if ( 0 === c.animationIds.length ) {
      resolve(performance.now() - tStart);
    } else if ( performance.now() > tBored ) {
      reject('timed out waiting for card to finish moving');
    } else {
      window.setTimeout(check, 100);
    }
  };
  window.setTimeout(check, 0);
});

const scrunchContainers = () => {
  waitForCards()
  .then( (value) => {
    tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
    reserves.forEach( res => res.scrunchCards(rules.Reserve) );
    foundations.forEach( res => res.scrunchCards(rules.Foundation) );
  })
  .catch( (reason) => console.log('scrunch', reason) );
};

const checkIfGameOver = () => {
  waitForCards()
  .then( (value) => {
    // console.log(`wait ${Math.round(value)}ms`);
    if ( isComplete() ) {
      if ( foundations.every( f => !f.scattered ) ) {
        foundations.forEach( f => f.scatter() );
        waitForCards()
        .then( () => {
          modalGameOverFn.open();
        });
      }
    } else if ( !allAvailableMoves() ) {
      displayToastNoAvailableMoves();
    }
  })
  .catch( (reason) => console.log('gameover', reason) );
};

let inRobot = false;
function robot() {
  const autoCollectAny = () => {
    return settings.autoKollect === 'any' || settings.autoKollect === 'safe';
  };
  const autoCollectWhenSolvable = () => {
    return settings.autoKollect === 'solvable' && cardContainers.every( f => f.isSolveable() );
  };

  console.assert(!inRobot);
  inRobot = true;

  [tableaux,cells].forEach( ccl => ccl.forEach(cc => {
    waitForCards()
    .then( () => cc.autoMove() ) 
    .catch( (reason) => console.log(reason) )
  }));

  if ( autoCollectAny() || autoCollectWhenSolvable() ) {
    waitForCards()
    .then( () => {
      for ( let cardMoved = pullCardsToFoundations(); cardMoved; cardMoved = pullCardsToFoundations() ) {
        waitForCards()
        .catch( (reason) => console.log('collect', reason) );
      }
    });
  }

  scrunchContainers();

  checkIfGameOver();

  inRobot = false;
}

/**
 * Beware differences between Chrome, Edge, Firefox
 * https://unixpapa.com/js/key.html
 */
document.addEventListener('keypress', function(/** @type {KeyboardEvent} */kev) {
  // console.log(kev,kev.key,kev.keyCode,kev.ctrlKey);
  switch ( kev.key.toLowerCase() ) {
    case 'a':
      window.doshowavailablemoves();
      break;
    case 'e':
      if ( waste && waste.peek() ) {
        waste.onclick(waste.peek());
      }
      break;
    case 'l':
      window.doloadposition();
      break;
    case 'r':
      modalShowRulesFn.open();
      break;
    case 's':
      window.dosaveposition();
      break;
    case 'u':
      window.doundo();
      break;
    case 'w':
      if ( stock.peek() ) {
        stock.onclick(stock.peek());
      }
      break;
  }
});

class KeyFocus {
  constructor() {
    this.cc = tableaux[0];
    this.c = this.cc.peek();
    this.mark(true);
  }

  /**
   * Add/remove outline around card/container with focus
   * @param {!boolean} add 
   */
  mark(add) {
    (this.c ? this.c : this.cc).g.querySelector('rect').classList.toggle('focus', add);
  }

  /**
   * Move the focus down the stack of cards until we find one that can be grabbed
   * @private
   */
  findGrab_() {
    if ( this.c && this.cc.cards.length ) {
      while ( !this.cc.canGrab(this.c) ) {
        const nCard = this.c.owner.cards.findIndex( e => e === this.c );
        if ( nCard === this.cc.cards.length - 1 )
          break;
        this.c = this.cc.cards[nCard+1];
      }
    }
  }

  moveLeft() {
    this.mark(false);

    const nCard = this.c ? this.c.owner.cards.findIndex( e => e === this.c ) : -1;
    let i = cardContainers.findIndex(e => e == this.cc);
    for (;;) {
      if ( 0 === i ) {
        i = cardContainers.length - 1;
      } else {
        i -= 1;
      }
      if ( !cardContainers[i].rules.hidden )
        break;
    }
    this.cc = cardContainers[i];
    if ( nCard >= 0 && nCard < this.cc.cards.length )
      this.c = this.cc.cards[nCard];
    else
      this.c = this.cc.peek();
  
    this.findGrab_();
    this.mark(true);
  }

  moveRight() {
    this.mark(false);

    const nCard = this.c ? this.c.owner.cards.findIndex( e => e === this.c ) : -1;
    let i = cardContainers.findIndex(e => e == this.cc);
    for (;;) {
      if ( cardContainers.length - 1 === i ) {
        i = 0;
      } else {
        i += 1;
      }
      if ( !cardContainers[i].rules.hidden )
        break;
    }
    this.cc = cardContainers[i];
    if ( nCard >= 0 && nCard < this.cc.cards.length )
      this.c = this.cc.cards[nCard];
    else
      this.c = this.cc.peek();
  
    this.findGrab_();
    this.mark(true);
  }

  moveUp() {
    const findContainerAbove = () => {
      let ccAbove = cardContainers.find( (cc) => { return ( !cc.rules.hidden && cc.pt.x === this.cc.pt.x && cc.pt.y < this.cc.pt.y ) });
      if ( ccAbove )
        this.cc = ccAbove;
      return !!ccAbove;
    };
  
    this.mark(false);

    if ( this.c ) {
      let nCard = this.c.owner.cards.findIndex( e => e === this.c );
      if ( nCard > 0 ) {
        this.c = this.c.owner.cards[nCard-1];
      } else if ( findContainerAbove() ) {
        this.c = this.cc.peek();
      }
    } else if ( findContainerAbove() ) {
      this.c = this.cc.peek();
    }
  
    this.findGrab_();
    this.mark(true);
  }

  moveDown() {
    const findContainerBelow = () => {
      let ccBelow = cardContainers.find( (cc) => { return ( !cc.rules.hidden && cc.pt.x === this.cc.pt.x && cc.pt.y > this.cc.pt.y ) });
      if ( ccBelow )
        this.cc = ccBelow;
      return !!ccBelow;
    }
  
    this.mark(false);
    if ( this.c ) {
      let nCard = this.c.owner.cards.findIndex( e => e === this.c );
      if ( nCard < this.c.owner.cards.length - 1 ) {
        this.c = this.c.owner.cards[nCard+1];
      } else if ( findContainerBelow() ) {
        this.c = this.cc.cards[0];
      }
    } else if ( findContainerBelow() ) {
      this.c = this.cc.cards[0];
    }
    this.findGrab_();
    this.mark(true);
  }

  action() {
    this.mark(false);
    if ( this.c ) {
      this.cc.onclick(this.c);
      this.cc = this.c.owner;
    } else if ( this.cc.clickOnEmpty ) {
      this.cc.clickOnEmpty();
      this.c = this.cc.peek();
    }
    this.mark(true);
  }
}

document.addEventListener('keydown', function(/** @type {KeyboardEvent} */kev) {
  switch( kev.key ) {
    case 'ArrowLeft':
      if ( keyFocus )
        keyFocus.moveLeft();
      else
        keyFocus = new KeyFocus();
      kev.preventDefault();
      break;
    case 'ArrowRight':
      if ( keyFocus )
        keyFocus.moveRight();
      else
        keyFocus = new KeyFocus();
      kev.preventDefault();
      break;
    case 'ArrowUp':
      if ( keyFocus )
        keyFocus.moveUp();
      else
        keyFocus = new KeyFocus();
      kev.preventDefault();
      break;
    case 'ArrowDown':
      if ( keyFocus )
        keyFocus.moveDown();
      else
        keyFocus = new KeyFocus();
      kev.preventDefault();
      break;
    case 'Enter':
    case ' ':
      if ( keyFocus )
        keyFocus.action();
      kev.preventDefault();
      break;
  }
});

if ( gameState[rules.Name].undoStack && gameState[rules.Name].undoStack.length > 0 && settings.loadSaved ) {
  if ( !window.doload() ) {
    stock.createPacks();
    window.onload = dealCards;
  }
  gameState[rules.Name].undoStack = [];
} else {
  stock.createPacks();
  window.onload = dealCards;
}

if ( 0 === gameState[rules.Name].totalGames )
  window.doshowrules();
