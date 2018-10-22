//@ts-check
'use strict';
/* jshint esversion:6 */
// import {M} from './js/materialize.min.js';

const Constants = {
    GAME_NAME: 'Solitaire',
    GAME_VERSION: '0.10.21.0',
    SVG_NAMESPACE: 'http://www.w3.org/2000/svg',

    MOBILE:     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    CHROME:     navigator.userAgent.indexOf('Chrome/') != -1,   // also Brave, Opera
    EDGE:       navigator.userAgent.indexOf('Edge/') != -1,
    FIREFOX:    navigator.userAgent.indexOf('Firefox/') != -1,

    // PEP: false,

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
    CARD_RADIUS: '5',
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

// @ts-ignore
if ( 'function' !== typeof Array.prototype.peek )
{
    // @ts-ignore
    Array.prototype.peek = function() {
        return this[this.length-1];
    };
}

const Util = {
    getDistance: function(pt1, pt2)
    {
        return Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);     // see 30 seconds of code
    },

    plural: function(n, word)
    {
        if ( 0 === n )
            return `no ${word}s`;
        else if ( 1 === n )
            return `${n} ${word}`;
        else
            return `${n} ${word}s`;
    },

    newPoint: function(x, y)
    {
        // @ts-ignore
        const pt = baize.ele.createSVGPoint();
        if ( typeof x === 'object' )
        {
            pt.x = x.x;
            pt.y = x.y;
        }
        else if ( typeof x === 'undefined' )
        {
        }
        else if ( typeof x === 'number' && typeof y === 'number' )
        {
            pt.x = x;
            pt.y = y;
        }
        else
        {
            throw new TypeError();
        }
        return pt;
    },

    // samePoint: function(pt1, pt2)
    // {
    //     return ( (pt1.x === pt2.x) && (pt1.y === pt2.y) );
    // },

    nearlySamePoint: function(pt1, pt2)
    {
        const xMin = pt1.x - 2;
        const xMax = pt1.x + 2;
        const yMin = pt1.y - 2;
        const yMax = pt1.y + 2;
        return ( pt2.x > xMin && pt2.x < xMax && pt2.y > yMin && pt2.y < yMax );
    },

    DOM2SVG: function(x, y)
    {
        // https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/
        const pt = Util.newPoint(x,y);
        // @ts-ignore
        pt.matrixTransform(baize.ele.getScreenCTM().inverse());
        pt.x = Math.round(pt.x);    // Card.pt should be integers, no decimal fractions
        pt.y = Math.round(pt.y);
        return pt;
    },

    id2Card: function(id)
    {
        if ( !id )
            return null;

        let card = null;
        for ( let i=0; i<listOfCardContainers.length; i++ )
        {
            card = listOfCardContainers[i].cards.find( c => c.id === id );
            if ( card )
                break;
        }
        if ( !card ) console.warn('couldn\'t id', id);
        return card;
    },
/*
findCard: function(target)
{
    let card = null;
    for ( let i=0; i<listOfCardContainers.length; i++ )
    {
        card = listOfCardContainers[i].cards.find( c => c.g === target );
        if ( card )
            break;
    }
    if ( !card ) console.warn('couldn\'t find', target);
    return card;
}
*/
    absorbEvent: function(event)
    {
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
class Random
{
    constructor(seed)
    {
        this._seed = seed % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    }

    /**
     * Returns a pseudo-random value between 1 and 2^32 - 2.
     * @return {number}
    */
    next()
    {
        return this._seed = this._seed * 16807 % 2147483647;
    }

    /**
     * Returns a pseudo-random floating point number in range [0, 1].
     * @return {number}
    */
    nextFloat()
    {
        // We know that result of next() will be 1 to 2147483646 (inclusive).
        return (this.next() - 1) / 2147483646;
    }

    /**
    * Returns a random integer between min (inclusive) and max (inclusive)
    * Using Math.round() will give you a non-uniform distribution!
    * @return {number}
    */
    nextInt(min, max)
    {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }
}

class Baize
{
    constructor()
    {
        this._ele = document.getElementById('baize');
        this._borderWidth = 0;

        this._gutsWidth = 0;
        document.querySelectorAll('rect').forEach( r => {
            r.setAttributeNS(null, 'height', String(Constants.CARD_HEIGHT));
            r.setAttributeNS(null, 'width', String(Constants.CARD_WIDTH));
            r.setAttributeNS(null, 'rx', Constants.CARD_RADIUS);
            r.setAttributeNS(null, 'ry', Constants.CARD_RADIUS);

            let x = Number.parseInt(r.getAttribute('x')) || 0;
            if ( x > this._gutsWidth )
                this._gutsWidth = x;
        });
        this._gutsWidth += Constants.CARD_WIDTH + 10;

        this._setBox();

        console.log(this._ele.style.touchAction);
        this._ele.style.touchAction = 'none';
    }

    _addBorder()
    {   // console.log('adding', this._borderWidth);
        if ( this._borderWidth )
        {
            this._ele.querySelectorAll('rect').forEach( r => {
                let x = Number.parseInt(r.getAttribute('x')) || 0;
                r.setAttributeNS(null, 'x', String(x + this._borderWidth));
            });
            this._ele.querySelectorAll('rect text').forEach( r => {
                let x = Number.parseInt(r.getAttribute('x')) || 0;
                r.setAttributeNS(null, 'x', String(x + this._borderWidth));
            });
        }
    }

    // _removeBorder()
    // {
    //     if ( this._borderWidth )
    //     {   console.log('removing', this._borderWidth);
    //         document.querySelectorAll('rect').forEach( r => {
    //             let x = Number.parseInt(r.getAttribute('x')) || 0;
    //             r.setAttributeNS(null, 'x', String(x - this._borderWidth));
    //         });
    //         document.querySelectorAll('rect text').forEach( r => {
    //             let x = Number.parseInt(r.getAttribute('x')) || 0;
    //             r.setAttributeNS(null, 'x', String(x - this._borderWidth));
    //         });
    //     }
    //     this._borderWidth = 0;
    // }

    _setBox()
    {
        this._width = this._gutsWidth;
        this._height = Math.max(1000,window.screen.height);

        if ( window.screen.height > window.screen.width /*|| screen.orientation.angle === 0*/ )
        {   // portrait
        }
        else
        {   // landscape
            if ( this._gutsWidth < 800 )
            {
                this._borderWidth = (800 - this._gutsWidth) / 2;
                this._addBorder();
                this._width = 800;
            }
        }
        // set viewport (visible area of SVG)
        this._ele.setAttributeNS(null, 'width', String(this._width));
        this._ele.setAttributeNS(null, 'height', String(this._height));

        this._ele.setAttributeNS(null, 'viewBox', `0 0 ${this._width} ${this._height}`);
        this._ele.setAttributeNS(null, 'preserveAspectRatio', 'xMinYMin slice');

        // console.log('guts', this._gutsWidth)
        // console.log('border', this._borderWidth);
        // console.log('svg', this._width, this._height);
        // console.log('window', window.innerWidth, window.innerHeight);
    }

    // onOrientationChange()
    // {
    //     this._removeBorder();
    //     this._setBox();
    // }

    get ele()
    {
        return this._ele;
    }
}

const baize = new Baize;
// window.addEventListener('resize', baize.onresize.bind(baize));
// window.addEventListener("orientationchange", baize.onOrientationChange.bind(baize));

class Mover
{
    constructor()
    {
        this._zzzz = false;
        this._count = 0;
    }

    reset()
    {
        this._count = 0;
    }

    sleep(f)
    {
        this._zzzz = true;
        f();
        this._zzzz = false;
        this.increment();
    }

    increment()
    {
        if ( !this._zzzz )
        {
            this._count++;
            window.setTimeout(robot, 500);
        }
    }

    get count()
    {
        return this._count;
    }

    set count(n)
    {
        this._count = n;
    }
}

const tallyMan = new Mover;

// https://stackoverflow.com/questions/20368071/touch-through-an-element-in-a-browser-like-pointer-events-none/20387287#20387287
function dummyTouchStartHandler(e) {e.preventDefault();};

class Card
{
    constructor(pack, suit, ordinal, faceDown, pt)
    {   console.assert(this instanceof Card);
        this.pack = pack;
        this.ordinal = ordinal;                 // 1 .. 13
        this.suit = suit;
        this.faceDown = faceDown;

        // sort uses the card id as input to locale
        // padStart() ok in Chrome, Edge, Firefox
        if ( this.ordinal < 10 )
            this.id = `${pack}${suit}0${String(this.ordinal)}`;
        else
            this.id = `${pack}${suit}${String(this.ordinal)}`;
        console.assert(this.id.length===4);
        // this.id = `${pack}${suit}${String(this.ordinal).padStart(2,'0')}`;

        this.owner = null;

        this.pt = Util.newPoint(pt);            // SVG coords
        this.ptOriginal = null;                 // used in dragging
        this.ptOffset = null;                   // used in dragging
        this.grabbedTail = null;
        // https://stackoverflow.com/questions/33859113/javascript-removeeventlistener-not-working-inside-a-class
        this.downHandler = this.onpointerdown.bind(this);
        this.moveHandler = this.onpointermove.bind(this);
        // this.moveHandler = debounce(this.onpointermove.bind(this), 10);
        this.upHandler = this.onpointerup.bind(this);
        this.cancelHandler = this.onpointercancel.bind(this);
        this.overHandler = this.onpointerover.bind(this);

        this.inTransit = false;                 // set when moving
        this.multiMove = false;                 // part of a large group being moved

        this.g = this.createSVG();
        /*
        this.gFront = this._createFrontSVG();
        this.gFront.style.display = 'none';
        this.gBack = this._createBackSVG();
        this.gBack.style.display = 'none';
        */
        this.position0();
    }

    get faceValue()
    {
        return Constants.cardValues[this.ordinal];
    }

    get color()
    {
        if ( this.suit === Constants.HEART || this.suit === Constants.DIAMOND )
            return 'red';
        else
            return 'black';
    }

    toString()
    {
        return this.id;
    }

    _createRect(cl)
    {
        const r = document.createElementNS(Constants.SVG_NAMESPACE, 'rect');
        r.classList.add(cl);
        r.style.touchAction = 'none';
        // if ( Constants.PEP )
        //     r.setAttributeNS(null, 'touch-action', 'none'); // https://github.com/jquery/PEP
        r.setAttributeNS(null, 'width', String(Constants.CARD_WIDTH));
        r.setAttributeNS(null, 'height', String(Constants.CARD_HEIGHT));
        r.setAttributeNS(null, 'rx', Constants.CARD_RADIUS);
        r.setAttributeNS(null, 'ry', Constants.CARD_RADIUS);
        return r;
    }

    createSVG()
    {   console.assert(this instanceof Card);
        let g = document.createElementNS(Constants.SVG_NAMESPACE, 'g');
        // if ( Constants.PEP )
        //     g.setAttributeNS(null, 'touch-action', 'none'); // https://github.com/jquery/PEP

        if ( this.faceDown )
        {
            /*
            const u = document.createElementNS(Constants.SVG_NAMESPACE, 'use');
            u.setAttributeNS(null, 'href', '#spielkarteback');
            g.appendChild(u);
            */
            const r = this._createRect('spielkarteback');
            g.appendChild(r);
        }
        else
        {   // TODO use a viewBox to centre ordinal?
            const ordOffset = [0,9,9,9,9,9,9,10,9,9,4,11,8,9];
            const r = this._createRect('spielkarte');
            g.appendChild(r);

            const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
            t.classList.add('spielkartevalue');
            t.setAttributeNS(null, 'x', String(ordOffset[this.ordinal]));
            t.setAttributeNS(null, 'y', '23');
            t.setAttributeNS(null, 'fill', this.color);
            t.innerHTML = this.faceValue;
            g.appendChild(t);

            if ( Constants.MOBILE )
            {
                const u = document.createElementNS(Constants.SVG_NAMESPACE, 'use');
                u.setAttributeNS(null, 'href', `#${this.suit}`);
                u.setAttributeNS(null, 'height', '22');
                u.setAttributeNS(null, 'width', '24');
                if ( rules.Cards.suit === 'BottomLeft' )
                {
                    u.setAttributeNS(null, 'x', '4');
                    u.setAttributeNS(null, 'y', '58');
                }
                else if ( rules.Cards.suit === 'TopRight' )
                {
                    u.setAttributeNS(null, 'x', '30');
                    u.setAttributeNS(null, 'y', '4');
                }
                else
                {
                    console.error('Unknown rules.Cards.suit', rules.Cards.suit);
                }
                g.appendChild(u);
            }
            else
            {
                const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
                t.classList.add('spielkartesuit');
                if ( rules.Cards.suit === 'BottomLeft' )
                {
                    t.setAttributeNS(null, 'x', '6');
                    t.setAttributeNS(null, 'y', '80');
                }
                else if ( rules.Cards.suit === 'TopRight' )
                {
                    if ( this.suit === Constants.CLUB )
                        t.setAttributeNS(null, 'x', '33');
                    else if ( this.suit === Constants.HEART )
                        t.setAttributeNS(null, 'x', '34');
                    else
                        t.setAttributeNS(null, 'x', '35');
                    t.setAttributeNS(null, 'y', '24');
                }
                else
                {
                    console.error('Unknown rules.Cards.suit', rules.Cards.suit);
                }
                t.setAttributeNS(null, 'fill', this.color);
                t.innerHTML = this.suit;
                g.appendChild(t);
            }
        }

        this._addListeners(g);

        return g;
    }

    _addListeners(g)
    {
        // put the event handlers on the g, but the event happens on the rect inside
        // http://www.open.ac.uk/blogs/brasherblog/?p=599
        // the ordinal and suit symbols use css pointer-event: none so the events pass through to their parent (the rect)
        g.addEventListener('pointerover', this.overHandler);
        g.addEventListener('pointerdown', this.downHandler);
        g.addEventListener('touchstart', dummyTouchStartHandler);
    }

    _removeListeners(g)
    {
        g.removeEventListener('pointerover', this.overHandler);
        g.removeEventListener('pointerdown', this.downHandler);
        g.removeEventListener('touchstart', dummyTouchStartHandler);
    }

    _addDragListeners()
    {
        window.addEventListener('pointermove', this.moveHandler);
        window.addEventListener('pointerup', this.upHandler);
        window.addEventListener('pointercancel', this.cancelHandler);
    }

    _removeDragListeners()
    {
        window.removeEventListener('pointermove', this.moveHandler);
        window.removeEventListener('pointerup', this.upHandler);
        window.removeEventListener('pointercancel', this.cancelHandler);
    }

    onclick(event)
    {
        console.error('click received directly on a card');
    }

    onpointerover(event)
    {   console.assert(this instanceof Card);
        let cur = 'default';
        if ( this.faceDown && this === this.owner.cards.peek() )
            cur = 'pointer';
        else if ( this.owner.canGrab(this) )
        {
            if ( stats.Options.autoPlay )
                cur = 'pointer';
            else
                cur = 'grab';
        }

        for ( let i=0; i<this.g.children.length; i++ )
            this.g.children[i].style.cursor = cur;
    }

    _getPointerPoint(event)
    {
        // choice of client, offset, (page), (layer), screen, and (x, y)
        return Util.DOM2SVG(event.clientX, event.clientY);
    }

    onpointerdown(event)
    {   console.assert(this instanceof Card);
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
        if ( this.owner.lastEvent )
        {
            if ( event.pointerType !== this.owner.lastEvent.pointerType && event.timeStamp < this.owner.lastEvent.timeStamp + 1000 )
                return false;
        }
        this.owner.lastEvent = event;

        if ( event.pointerType === 'mouse' )
        {
            if ( !(event.button === 0) )
            {
                console.log('don\'t care about mouse button', event.button);
                return false;
            }
        }

        if ( this.grabbedTail )
        {
            console.warn('grabbing a grabbed card', this.id);
            return false;
        }

        // where's the harm in grabbing a moving card?
        // if ( this.inTransit )
        // {
        //     console.warn('grabbing a moving card', this.id);
        //     return false;
        // }

        this.grabbedTail = this.owner.canGrab(this);
        if ( !this.grabbedTail )
        {
            console.log('can\'t grab', this.id);
            return false;
        }

        this.ptOriginalPointerDown = this._getPointerPoint(event);
        this.grabbedTail.forEach( c =>
        {
            c.ptOriginal = Util.newPoint(c.pt);
            c.ptOffset = Util.newPoint(
                this.ptOriginalPointerDown.x - c.pt.x,
                this.ptOriginalPointerDown.y - c.pt.y
            );
            // console.log(event, c.id, prOriginalPointerDown, c.ptOffset);
            c.bringToTop();
        });

        this._addDragListeners();

        return false;
    }

    _scalePointer(pt)
    {
        const r = baize.ele.getBoundingClientRect();
        const w = r.right - r.left;
        const h = r.bottom - r.top;

        const xFactor = baize._width/w;
        const xMoved = pt.x - this.ptOriginalPointerDown.x;
        const xMovedScaled = Math.round(xMoved * xFactor);

        const yFactor = baize._height/h;
        const yMoved = pt.y - this.ptOriginalPointerDown.y;
        const yMovedScaled = Math.round(yMoved * yFactor);
        // console.log(xFactor, ':', this.ptOriginalPointerDown.x, pt.x, xMoved, xMovedScaled);
        // console.log(yFactor, ':', this.ptOriginalPointerDown.y, pt.y, yMoved, yMovedScaled);
        pt.x = this.ptOriginalPointerDown.x + xMovedScaled;
        pt.y = this.ptOriginalPointerDown.y + yMovedScaled;
    }

    onpointermove(event)
    {   console.assert(this instanceof Card);
        console.assert(this.grabbedTail);
        Util.absorbEvent(event);

        const ptNew = this._getPointerPoint(event);
        this._scalePointer(ptNew);
        this.grabbedTail.forEach( c =>
        {
            c.position0(ptNew.x - c.ptOffset.x, ptNew.y - c.ptOffset.y);
            // console.assert(c.ptOffset.x===ptNew.x - c.pt.x);
            // console.assert(c.ptOffset.y===ptNew.y - c.pt.y);
        });
        return false;
    }

    onpointerup(event)
    {   console.assert(this instanceof Card);
        console.assert(this.grabbedTail);
        Util.absorbEvent(event);

        const ptNew = this._getPointerPoint(event);
        const ptNewCard = Util.newPoint(
            ptNew.x - this.ptOffset.x,
            ptNew.y - this.ptOffset.y
        );
        if ( Util.nearlySamePoint(ptNewCard, this.ptOriginal) )
        {
            // console.log('nearly same point', ptNewCard, this.ptOriginal);
            this.grabbedTail.forEach( c => {
                c.position0(c.ptOriginal.x, c.ptOriginal.y);
            });
            // a click on a card just sends the click to it's owner, so we do that directly
            this.owner.onclick(this);
        }
        else
        {
            // console.log('not nearly same point', ptNewCard, this.ptOriginal);
            const cc = this.getNewOwner();
            if ( cc )
            {
                this.moveTail(cc);
            }
            else
            {
                this.grabbedTail.forEach( c =>
                {
                    c.animate(c.ptOriginal);
                });
            }
        }

        this.grabbedTail = null;
        this._removeDragListeners();
    }

    onpointercancel(event)
    {   console.log('pointer cancel', event);

        if ( this.grabbedTail )
        {
            this.grabbedTail.forEach( c => c.animate(c.ptOriginal) );
        }
        this.grabbedTail = null;
        this._removeDragListeners();
    }

    bringToTop()
    {   console.assert(this instanceof Card);
        baize.ele.appendChild(this.g);  // move card to end of baize (no SVG z-index)
    }

    turnUp(undoable=true)
    {
        if ( this.faceDown )
        {
            this.faceDown = false;
            this._removeListeners(this.g);
            let newG = this.createSVG();
            baize.ele.replaceChild(newG, this.g);
            this.g = newG;  this.position0();
            if ( undoable )
                undo.push({move:tallyMan.count, turn:this.id, dir:'up'});
        }
        else
        {
            console.error(this.id, 'is already up');
        }
    }

    turnDown(undoable=true)
    {
        if ( !this.faceDown )
        {
            this.faceDown = true;
            this._removeListeners(this.g);
            let newG = this.createSVG();
            baize.ele.replaceChild(newG, this.g);
            this.g = newG;  this.position0();
            if ( undoable )
                undo.push({move:tallyMan.count, turn:this.id, dir:'down'});
        }
        else
        {
            console.error(this.id, 'is already down');
        }
    }

    position0(x, y)
    {
        if ( x !== undefined && y !== undefined )
        {
            this.pt.x = x;
            this.pt.y = y;
        }
        
        this.g.setAttributeNS(null, 'transform', `translate(${this.pt.x} ${this.pt.y})`);
    }

    _smootherstep(x)
    {
        return ((x) * (x) * (x) * ((x) * ((x) * 6 - 15) + 10));
    }

    animate(ptTo)
    {   // http://sol.gfxile.net/interpolation
        console.assert(ptTo != this.pt);    // needs a new point
        const speed = [0,50,40,30,20,10];   // index will be 1..5
        const ptFrom = Util.newPoint(this.pt);
        this.pt.x = ptTo.x; // update final pos immediately in case we're interrupted
        this.pt.y = ptTo.y;

        const distance = Util.getDistance(ptFrom, ptTo);
        if ( 0 === distance )
        {
            this.inTransit = false;
            this.multiMove = false;
            return;
        }

        let i = distance;
        const step = (timestamp) => {
            const v = this._smootherstep(i / distance);
            const pt2 = Util.newPoint( Math.round((ptFrom.x * v) + (ptTo.x * (1 - v))),
                                       Math.round((ptFrom.y * v) + (ptTo.y * (1 - v))) );
            this.g.setAttributeNS(null, 'transform', `translate(${pt2.x} ${pt2.y})`);

            if ( this.multiMove )
                i -= distance / 5;
            else
                i -= distance/speed[stats.Options.aniSpeed];
            if ( i > 0 )
            {
                window.requestAnimationFrame(step);
            }
            else
            {
                if ( pt2.x !== this.pt.x || pt2.y !== this.pt.y )
                    this.position0();
                this.inTransit = false;
                this.multiMove = false;
            }
        };

        this.inTransit = true;
        window.requestAnimationFrame(step);
    }

    moveTop(to, undoable=true)
    {   console.assert(this===this.owner.peek());
        const from = this.owner;
        from.pop();
        this.bringToTop();
        to.push(this);
        if ( undoable )
        {
            undo.push({move:tallyMan.count,
                from:listOfCardContainers.findIndex(e => e === from),
                to:listOfCardContainers.findIndex(e => e === to),
                count:1});
            tallyMan.increment();
        }
    }

    moveTail(to, undoable=true)
    {
        const from = this.owner;
        let nCard = this.owner.cards.findIndex( e => e === this );
        console.assert(nCard !== -1);
        let nOfCards = from.cards.length;

        const tmp = [];
        for ( let n=nCard; n<nOfCards; n++ )
        {
            tmp.push(from.pop());
        }
        while ( tmp.length )
        {
            const c = tmp.pop();
            c.bringToTop();
            to.push(c);
        }
        if ( undoable )
        {
            undo.push({move:tallyMan.count,
                from:listOfCardContainers.findIndex(e => e === from),
                to:listOfCardContainers.findIndex(e => e === to),
                count:nOfCards-nCard});
            tallyMan.increment();
        }
    }

    _overlapArea(pt2)
    {
        const rect1 = {left:this.pt.x, top:this.pt.y, right:this.pt.x + Constants.CARD_WIDTH, bottom:this.pt.y + Constants.CARD_HEIGHT};
        const rect2 = {left:pt2.x, top:pt2.y, right:pt2.x + Constants.CARD_WIDTH, bottom:pt2.y + Constants.CARD_HEIGHT};
        const xOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
        const yOverlap = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
        return xOverlap * yOverlap;
    }

    getNewOwner()
    {
        let ccMost = null;
        let ovMost = 0;
        for ( let i=0; i<listOfCardContainers.length; i++ )
        {
            const dst = listOfCardContainers[i];
            if ( this.owner === dst )
                continue;
            if ( this.owner.canTarget(dst) && dst.canAcceptCard(this) )
            {
                const tc = dst.peek();
                let ov = this._overlapArea(tc ? tc.pt : dst.pt);
                if ( ov > ovMost )
                {
                    ovMost = ov;
                    ccMost = dst;
                }
            }
        }
        return ccMost;
    }

    findFullestAcceptingContainer(ccList)
    {
        let cc = null;
        for ( let i=0; i<ccList.length; i++ )
        {
            const dst = ccList[i];

            if ( this.owner.canTarget(dst) && dst.canAcceptCard(this) )
            {
                if ( !cc )
                {
                    cc = dst;
                }
                else if ( dst.cards.length > cc.cards.length )
                {
                    cc = dst;
                }
            }
        }
        return cc;
    }

    getTail()
    {
        const nCard = this.owner.cards.findIndex( e => e === this );
        return this.owner.cards.slice(nCard);
    }

    markMoveable(moveable)
    {   // odd logic because modalSettings may turn flag on/off
        if ( this.faceDown )
            return;
        if ( this.g.firstChild.localName !== 'rect' )
            return;
        const cl = this.g.firstChild.classList;
        if ( stats.Options.sensoryCues )
        {
            cl.toggle('spielkarte0', !moveable);
            cl.toggle('spielkarte', moveable);
        }
        else
        {
            if ( cl.contains('spielkarte0') )
            {
                cl.replace('spielkarte0', 'spielkarte');
            }
        }
    }

    getSaveableCard()
    {
        return {'pack':this.pack, 'suit':this.suit, 'ordinal':this.ordinal, 'faceDown':this.faceDown};
    }

    destructor()
    {
        this._removeListeners(this.g);
        baize.ele.removeChild(this.g);
    }
}

let undo = [];

function doundo()
{
    if ( 0 === undo.length )
    {
        displayToast('nothing to undo');
        return;
    }

    const m = undo[undo.length-1].move;
    let ua = undo.filter( e => e.move === m ).reverse();

    while ( ua.length )
    {
        let u = ua.pop();       // console.log('undo', u);

        if ( u.hasOwnProperty('from') && u.hasOwnProperty('to') )
        {
            const src = listOfCardContainers[u.from];
            const dst = listOfCardContainers[u.to];

            let n = 1;
            if ( u.count )
                n = u.count;
            let tmp = [];
            while ( n-- )
                tmp.push(dst.pop());
            while ( tmp.length )
            {
                const c = tmp.pop();
                c.bringToTop();
                src.push(c);
            }
        }
        // else if ( u.hasOwnProperty('redeals') )
        // {
        //     console.assert(u.redeals===-1);
        //     stock.redeals += 1;
        //     stock._updateRedealsSVG();
        // }
        else if ( u.turn && u.dir )
        {
            const c = Util.id2Card(u.turn);
            if ( u.dir === 'up' )
                c.turnDown(false);
            else if ( u.dir === 'down' )
                c.turnUp(false);
        }
    }
    undo = undo.filter( e => e.move !== m );
    availableMoves();   // repaint moveable cards
}

class CardContainer
{
    constructor(pt, g)
    {
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
        if ( this._acceptSymbol() )
        {
        }
        else
        {
            this.a_accept = Number.parseInt(this.a_accept);
            console.assert(!isNaN(this.a_accept));
        }
        if ( this.a_accept )
            this._createAcceptSVG();
        listOfCardContainers.push(this);
    }

    _acceptSymbol()
    {
        return ( Constants.ACCEPT_NOTHING_SYMBOL === this.a_accept
            || Constants.ACCEPT_INSECT_SYMBOL === this.a_accept
            || Constants.ACCEPT_MARTHA_SYMBOL === this.a_accept );
    }

    _createAcceptSVG()
    {   // gets updated by Canfield calling dostar()
        // g has .rect and .text children
        console.assert(this.a_accept);

        let oldText = this.g.querySelector('text');
        if ( oldText )
        {
            if ( this._acceptSymbol() )
                oldText.innerHTML = this.a_accept;
            else
                oldText.innerHTML = Constants.cardValues[this.a_accept];
        }
        else
        {
            const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
            t.classList.add('accepts');
            if ( this._acceptSymbol() )
            {
                t.setAttributeNS(null, 'x', String(this.pt.x + 10));
                t.setAttributeNS(null, 'y', String(this.pt.y + 24));
                t.innerHTML = this.a_accept;
            }
            else
            {
                t.setAttributeNS(null, 'x', String(this.pt.x + 4));
                t.setAttributeNS(null, 'y', String(this.pt.y + 24));
                t.innerHTML = Constants.cardValues[this.a_accept];
            }
            this.g.appendChild(t);
        }
    }

    load(arr)
    {
        this.cards.forEach( c => c.destructor() );
        this.cards = [];
        arr.forEach( a => {
            const c = new Card(a.pack, a.suit, a.ordinal, a.faceDown, this.pt);
            c.multiMove = true;
            this.push(c);   // assigns owner and animates
            baize.ele.appendChild(c.g);
        });
    }

    peek()
    {
        return this.cards.peek();
    }

    pop()
    {
        const c = this.cards.pop();
        if ( c ) c.owner = null;
        return c;
    }

    push(c)
    {   // generic, can be overridden
        c.owner = this;
        this.cards.push(c);
        c.animate(this.pt);
    }

    onclick(c)
    {
        console.error('onclick not implemented in base CardContainer', c);
    }

    // dump()
    // {
    //     let str = '';
    //     this.cards.forEach( c => str = str.concat(c.id + ' ') );
    //     console.log(str);
    // }

    sort(seed)
    {   // seed may be undefined or 0
        if ( seed )
        {
            console.log('reusing seed', seed);
        }
        else if ( stats.Options.dealWinnable && rules.Winnable.length )
        {
            seed = rules.Winnable[Math.floor(Math.random()*rules.Winnable.length)];
            console.log('winnable seed', seed);
        }
        else
        {
            seed = Math.round(Math.random() * 1000000);
            console.log('new seed', seed);
        }
        const r = new Random(seed);
        // put them in a definite order before applying random seeded sort
        // we rely on card.id being a good sort key
        this.cards.sort(function(a, b) { return a.id.localeCompare(b.id); });
        // Knuth Fisher Yates
        for ( let i = this.cards.length - 1; i > 0; i-- )
        {
            const n = r.nextInt(0, i);
            if ( i !== n )
            {
                const tmp = this.cards[i];
                this.cards[i] = this.cards[n];
                this.cards[n] = tmp;
            }
        }

        stats[rules.Name].seed = seed;
    }

    canAcceptCard(c)
    {
        console.error('can accept card not implemented', c);
        return false;
    }

    canTarget(cc)
    {
        console.error('can target container not implemented', cc);
        return false;
    }

    canGrab(c)
    {   // only grab top card, we could be fanned
        if ( this.cards.peek() === c )
            return [c];
        else
            return null;
    }

    _availableMovesForThisCard(c)
    {
        let count = 0;
        for ( let i=0; i<listOfCardContainers.length; i++ )
        {
            let dst = listOfCardContainers[i];
            if ( dst === this )
                continue;
            if ( c.owner.canTarget(dst) && dst.canAcceptCard(c) )
            {
                if ( ((dst instanceof Tableau && c.owner instanceof Tableau) || (dst instanceof Cell && c.owner instanceof Cell))
                    && 0 === dst.cards.length
                    && c === c.owner.cards[0] )
                {
                    // moving empty cell/tab to empty cell/tab - legal but not useful
                }
                else
                {
                    count += 1;
                    c.markMoveable(true);
                }
            }
        }
        return count;
    }

    _availableMovesTopCard()
    {   // used by base CardContainer
        let count = 0;
        const c = this.cards.peek();
        if ( c )
        {
            if ( c.faceDown )
            {
                count += 1;     // the move is that it can be turned up?
            }
            else
            {
                count += this._availableMovesForThisCard(c);
            }
        }
        return count;
    }

    _availableMovesStack()
    {   // used by TableauTail, TableauFreecell
        let count = 0;
        this.cards.forEach( c => {
            if ( c.faceDown )
            {
                if ( c === this.peek() )
                    count += 1;
            }
            else
            {
                c.markMoveable(false);
                if ( this.canGrab(c) )
                {
                    count += this._availableMovesForThisCard(c);
                }
            }
        });
        return count;
    }

    _availableMovesStackAll()
    {   // used by Stock, Waste
        let count = 0;
        this.cards.forEach( c => {
            c.markMoveable(false);
            listOfCardContainers.forEach( dst => {
                if ( dst !== this )
                {
                    const oldFaceDown = c.faceDown;
                    c.faceDown = false;
                    if ( c.owner.canTarget(dst) && dst.canAcceptCard(c) )
                    {   //console.log(dst, 'can accept', c.id);
                        c.markMoveable(true);
                        count++;
                    }
                    c.faceDown = oldFaceDown;
                }
            });
        });
        //console.log(this, this.cards.length, count);
        return count;
    }

    availableMoves()
    {   // default just test top card; can be overridden by derived classes
        this.cards.forEach( c => c.markMoveable(false) );
        return this._availableMovesTopCard();
    }

    _bury()
    {
        const b = this.cards.filter( c => c.ordinal === rules.Tableau.bury );
        if ( b )
        {
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

    deal()
    {
        if ( !this.a_deal )
        {
            //console.warn('no deal specified', this);
            return;
        }
        // stock.cards.forEach( c => c.multiMove = true );
        for ( let i=0; i<this.a_deal.length; i++ )
        {
            let c = null;
            const ch = this.a_deal.charAt(i);
            if ( 'dDuU'.includes(ch) )
            {
                c = stock.pop();
                if ( !c )
                {   // StockFan will trigger this
                    console.warn('out of stock during deal', this);
                    return;
                }
            }
            else if ( 'Pp'.includes(ch) )
            {
                /*
                    The beak; see http://www.parlettgames.uk/patience/penguin.html
                    Move the three other cards of the same ordinal in this Stock to Foundations[0,1,2]
                    Then place this card as if it were an 'u'
                */
                c = stock.pop();
                const stock3 = stock.cards.filter( sc => sc.ordinal === c.ordinal );
                console.assert(stock3.length===3);
                stock3.forEach( sc => sc.turnUp() );
                stock.cards = stock.cards.filter( sc => sc.ordinal !== c.ordinal );
                for ( let i=0; i<stock3.length; i++ )
                    foundations[i].push(stock3[i]);
            }
            else if ( '♥♦♣♠'.includes(ch) )
            {   // e.g. ♥01
                const suit = ch;
                const ord = Number.parseInt(this.a_deal.slice(1));
                const idx = stock.cards.findIndex( e => e.suit === suit && e.ordinal === ord );
                i = this.a_deal.length;     // to break out of loop
                if ( idx > -1 )
                {
                    c = stock.cards.splice(idx, 1)[0];  // returns an array of deleted items
                    c.turnUp(false);
                }
                else
                {
                    console.error('cannot find', suit, ord, 'in stock');
                    return;
                }
            }
            else
            {
                console.error('unexpected character in deal', ch);
            }

            c.bringToTop();
            this.push(c);

            if ( 'd' === ch )
            {
                c.turnDown();
            }
            else if ( 'u' === ch )
            {
                // popping off stock turns card up
            }
        }

        if ( rules.Tableau.bury )
        {   // pause so user can see what's happening
            window.setTimeout(this._bury.bind(this), 1000);
        }
        // clear multiMove flags from any that didn't get dealt
        // stock.cards.forEach( c => c.multiMove = false );
    }

    _dynamicX(lim = this.cards.length)
    {
        let x = this.pt.x;
        for ( let i=0; i<lim; i++ )
            x += this.cards[i].faceDown
                ? Constants.FACEDOWN_STACK_WIDTH
                : Math.round(Constants.CARD_WIDTH/this.stackFactor);
        return x;
    }

    _dynamicArrayX()
    {
        const arr = new Array(this.cards.length);
        arr[0] = this.pt.x;
        for ( let i=1; i<this.cards.length; i++ )
        {
            arr[i] = arr[i-1] + (this.cards[i-1].faceDown
                ? Constants.FACEDOWN_STACK_WIDTH
                : Math.round(Constants.CARD_WIDTH/this.stackFactor));
        }
        return arr;
    }

    /**
     * returns the y position of a stacked card
     * 
     * @param {Number} n - the card whose position we want;
     * if not specified, the position of the next card to be pushed is returned 
     */
    _dynamicY(n = this.cards.length)
    {
        let y = this.pt.y;
        for ( let i=0; i<n; i++ )
            y += this.cards[i].faceDown
                ? Constants.FACEDOWN_STACK_HEIGHT
                : Math.round(Constants.CARD_HEIGHT/this.stackFactor);
        return y;
    }

    _dynamicArrayY()
    {
        const arr = new Array(this.cards.length);
        arr[0] = this.pt.y;
        for ( let i=1; i<this.cards.length; i++ )
        {
            arr[i] = arr[i-1] + (this.cards[i-1].faceDown
                ? Constants.FACEDOWN_STACK_HEIGHT
                : Math.round(Constants.CARD_HEIGHT/this.stackFactor));
        }
        return arr;
    }

    _resetStackFactor(rules)
    {
        switch ( rules.fan )
        {
        case 'Right':
        case 'Left':    this.stackFactor = Constants.DEFAULT_STACK_FACTOR_X;    break;
        case 'Down':    this.stackFactor = Constants.DEFAULT_STACK_FACTOR_Y;    break;
        case 'None':    this.stackFactor = 0;                                   break;
        }
    }

    scrunchCards(rules)
    {
        const oldStackFactor = this.stackFactor;

        if ( rules.fan === 'Down' )
        {
            this.stackFactor = Constants.DEFAULT_STACK_FACTOR_Y;
            const max = rules.maxfan === 0 ? baize._height - this.pt.y : this.pt.y + rules.maxfan;

            let arr = this._dynamicArrayY();
            while ( arr.peek() + Constants.CARD_HEIGHT > max && this.stackFactor < Constants.MAX_STACK_FACTOR )
            {
                this.stackFactor += (1.0/3.0);
                arr = this._dynamicArrayY();
            }
            if ( this.stackFactor !== oldStackFactor )
            {
                for ( let i=0; i<this.cards.length; i++ )
                {
                    const c = this.cards[i];
                    c.position0(this.pt.x, arr[i]);
                    // const pt = Util.newPoint(this.pt.x, arr[i]);
                    // c.animate(pt);
                }
            }
        }
        else if ( rules.fan === 'Right' )
        {
            this.stackFactor = Constants.DEFAULT_STACK_FACTOR_X;
            const max = rules.maxfan === 0 ? baize._width - this.pt.x : this.pt.x + rules.maxfan;

            let arr = this._dynamicArrayX();
            while ( arr.peek() + Constants.CARD_WIDTH > max && this.stackFactor < Constants.MAX_STACK_FACTOR )
            {
                this.stackFactor += (1.0/3.0);
                arr = this._dynamicArrayX();
            }
            if ( this.stackFactor !== oldStackFactor )
            {
                for ( let i=0; i<this.cards.length; i++ )
                {
                    const c = this.cards[i];
                    c.position0(arr[i], this.pt.y);
                }
            }
        }
        else if ( rules.fan === 'None' )
        {
        }
        else
        {
            console.error('Unknown scrunch fan', rules.fan);
        }
    }

    isSolveable()
    {
        console.error('is solveable not implemented', this);
        return false;
    }

    isComplete()
    {
        return 0 === this.cards.length;
    }

    getSaveableCards()
    {
        const o = [];
        this.cards.forEach(c => o.push(c.getSaveableCard()));
        return o;
    }

    english()
    {
        return 'There is no explanation for this';
    }
}

class Cell extends CardContainer
{   // always face up
    onclick(c)
    {
        if ( !stats.Options.autoPlay )
            return;

        let cc = null;
        cc = c.findFullestAcceptingContainer(foundations);
        if ( !cc )
            cc = c.findFullestAcceptingContainer(tableaux);
        if ( cc )
            c.moveTop(cc);
    }

    canAcceptCard(c)
    {
        if ( c !== c.owner.cards.peek() )
            return false;   // can't accept a stack of cards
        return 0 === this.cards.length;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Cell.target )
            return true;
        return ( rules.Cell.target === cc.constructor.name );
    }

    isSolveable()
    {
        return true;
    }

    english()
    {
        return `Cell ${countInstances(Cell)}. Can store one card of any type.`;
    }
}

class CellCarpet extends Cell
{   // TODO DRY TableauFortunesFavor
    pop()
    {
        const c = super.pop();
        if ( this.cards.length === 0 )
        {
            let c2 = waste.peek();
            if ( !c2 )
                c2 = stock.peek();
            if ( c2 )
                c2.moveTop(this);
        }
        return c;
    }

    availableMoves()
    {   // total fudge
        this.cards.forEach( c => c.markMoveable(true) );
        return this.cards.length;
    }

    english()
    {
        let e = super.english();
        e += ' Spaces are automatically filled with the top card from the waste or stock.';
        return e;
    }
}

class Reserve extends CardContainer
{
    constructor(pt, g)
    {
        super(pt, g);
        this._resetStackFactor(rules.Reserve);
    }

    push(c)
    {   // same as Tableau.push
        if ( 0 === this.cards.length )
            this._resetStackFactor(rules.Reserve);

        let pt = null;
        if ( rules.Reserve.fan === 'Down' )
            pt = Util.newPoint(this.pt.x, this._dynamicY());
        else if ( rules.Reserve.fan === 'Right' )
            pt = Util.newPoint(this._dynamicX(), this.pt.y);
        else if ( rules.Reserve.fan === 'None' )
            pt = Util.newPoint(this.pt.x, this.pt.y);
        this.cards.push(c);
        c.owner = this;
        c.animate(pt);
    }

    pop()
    {   // same as Tableau.pop
        const c = super.pop();

        const tc = this.peek();
        if ( tc && tc.faceDown && stats.Options.autoFlip )
            tc.turnUp();
        return c;
    }

    onclick(c)
    {
        if ( c !== this.cards.peek() )
            return;

        if ( c.faceDown )
        {
            c.turnUp();
            window.setTimeout(robot, 500);
            return;
        }

        if ( !stats.Options.autoPlay )
            return;

        let cc = null;
        cc = c.findFullestAcceptingContainer(foundations);
        if ( !cc )
            cc = c.findFullestAcceptingContainer(tableaux);
        if ( cc )
            c.moveTop(cc);
    }

    canAcceptCard(c)
    {
        return false;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Reserve.target )
            return true;
        return ( rules.Reserve.target === cc.constructor.name );
    }

    isSolveable()
    {
        return this.cards.length === 0;
    }

    english()
    {
        return `Reserve ${countInstances(Reserve)}. Stores multiple cards of any type. You cannot move a card to a reserve stack.`;
    }
}

class ReserveFrog extends Reserve
{
    deal()
    {   // override
        while ( this.cards.length < 13 )
        {
            const c = stock.pop();
            if ( 1 === c.ordinal )
            {
                for ( let i=0; i<foundations.length; i++ )
                {
                    const dst = foundations[i];
                    if ( dst.canAcceptCard(c) )
                    {
                        dst.push(c);
                        break;
                    }
                }
            }
            else
            {
                c.bringToTop();
                this.push(c);   // popping off stock turns card up
            }
        }

        if ( !foundations.some( f => f.length > 0 ) )
        {
            const idx = stock.cards.findIndex( c => 1 === c.ordinal );
            const c = stock.cards.splice(idx, 1)[0];    // returns array of deleted items
            foundations[0].push(c);
            c.turnUp();
        }
    }
}

class Stock extends CardContainer
{
    constructor(pt, g)
    {
        super(pt, g);

        if ( rules.Stock.hidden )
            this.g.style.display = 'none';

        this.redeals = rules.Stock.redeals;
        // this._updateRedealsSVG();

        g.onclick = this.clickOnEmpty.bind(this);

        if ( !stats.Options.loadSaved || !stats[rules.Name].saved )
            this._createPacks();
    }

    _createPacks()
    {
        for ( let ord=1; ord<Constants.cardValues.length; ord++ )
        {
            for ( let p=0; p<rules.Stock.packs; p++ )
            {
                for ( let s of rules.Stock.suitfilter )     // defaults to '♠♥♦♣'
                    this.cards.push(new Card(p, s, ord, true, this.pt));
            }
        }
        if ( this.cards.length !== (rules.Stock.packs*52) ) console.warn(this.cards.length, ' cards in pack');
        this.sort();
        this.cards.forEach( c => c.owner = this );
        this.cards.forEach( c => baize.ele.appendChild(c.g) );
    }

    _createRedealsSVG()
    {   // only called by StockCruel, StockKlondike, StockFan
        const t = document.createElementNS(Constants.SVG_NAMESPACE, 'text');
        t.classList.add('stockredeals');
        t.setAttributeNS(null, 'x', String(this.pt.x + 12));
        t.setAttributeNS(null, 'y', String(this.pt.y + 66));
        t.innerHTML = Constants.REDEALS_SYMBOL;
        this.g.appendChild(t);
    }

    _updateRedealsSVG()
    {   // g has rect and text children
        let txt = this.g.querySelector('text');
        if ( txt )
        {
            if ( 0 === this.redeals )
            // if ( 0 === this.cards.length && 0 === this.redeals )
            // if ( this.redealsAvailable() )
                txt.innerHTML = '';
            else
                txt.innerHTML = Constants.REDEALS_SYMBOL;
        }
        // else we don't have a redeals indicator
    }

    pop()
    {   // extend, so something coming off stock can be turned up
        const c = super.pop();
        if ( c && c.faceDown )
            c.turnUp();
        if ( 0 === this.cards.length )
        {
            this._updateRedealsSVG();
        }
        return c;
    }

    push(c)
    {
        super.push(c);
        if ( !c.faceDown )
            c.turnDown();
    }

    redealsAvailable()
    {
        // infinite redeals when this.redeals is null
        return ( (null === this.redeals) || (Number.isInteger(this.redeals) && (this.redeals > 0)) );
    }

    decreaseRedeals()
    {
        if ( Number.isInteger(this.redeals) )
        {
            this.redeals -= 1;
            this._updateRedealsSVG();
            // undo.push({move:tallyMan.count, redeals:-1});
            undo.length = 0;
        }
    }

    clickOnEmpty()
    {
        if ( !waste )
            return;

        if ( this.redealsAvailable() )
        {
            tallyMan.sleep( () => {
                for ( let c=waste.peek(); c; c=waste.peek() )
                {
                    c.multiMove = true;
                    c.moveTop(stock);
                }
                this.decreaseRedeals();
            });
        }
    }

    canAcceptCard(c)
    {
        return false;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Stock.target )
            return true;
        return ( rules.Stock.target === cc.constructor.name );
    }

    isSolveable()
    {
        return this.cards.length === 0;
    }

    availableMoves()
    {
        return this._availableMovesStackAll();
    }

    english()
    {
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

class StockKlondike extends Stock
{   // moves cards to Waste when clicked
    constructor(pt, g)
    {
        super(pt, g);
        this._createRedealsSVG();
    }

    onclick(c)
    {   // override to move 1 or 3 cards at once to waste
        if ( Number.isInteger(rules.Waste.maxcards) )
            if ( !(waste.cards.length < rules.Waste.maxcards) )
                return;

        const tmp = [];
        tmp.push(this.pop());
        for ( let nCard = rules.Stock.cards - 1; nCard > 0; nCard-- )
        {   // we already popped one
            if ( stock.peek() )
                tmp.push(this.pop());
        }
        const nCardsMoved = tmp.length;
        while ( tmp.length )
        {
            const c = tmp.pop();
            c.bringToTop();
            waste.push(c);
        }
        undo.push({move:tallyMan.count,
            from:listOfCardContainers.findIndex(e => e === stock),
            to:listOfCardContainers.findIndex(e => e === waste),
            count:nCardsMoved});
        tallyMan.increment();
    }

    english()
    {
        let e = super.english();
        return `${e} Clicking on the stock will transfer ${Util.plural(rules.Stock.cards, 'card')} to the waste stack.`;
    }
}

class StockAgnes extends Stock
{
    onclick(c)
    {
        tallyMan.sleep( () => {
            for ( let i=0; i<reserves.length; i++ )
            {
                const c = this.peek();
                if ( !c )
                    break;
                c.moveTop(reserves[i]);
            }
        });
    }

    english()
    {
        let e = super.english();
        return `${e} Clicking on the stock will transfer one card to each of the reserve stacks.`;
    }
}

class StockScorpion extends Stock
{
    onclick(c)
    {
        tallyMan.sleep( () => {
            for ( let i=0; i<tableaux.length; i++ )
            {
                const c = this.peek();
                if ( !c )
                    break;
                c.moveTop(tableaux[i]);
            }
        });
    }

    availableMoves()
    {
        return this.cards.length;
    }

    english()
    {
        return 'Clicking on the stock will transfer one card to each of the tableaux stacks.';
    }
}

class StockSpider extends Stock
{
    onclick(c)
    {
        if ( tableaux.some( t => t.cards.length === 0 ) )
        {
            let tabCards = 0;
            tableaux.forEach( t => tabCards += t.cards.length );
            if ( tabCards >= tableaux.length )
            {
                displayToast('all spaces in the tableau must be filled before a new row is dealt');
                return;
            }
        }
        tallyMan.sleep( () => {
            for ( let i=0; i<tableaux.length; i++ )
            {
                const c = this.peek();
                if ( !c )
                    break;
                c.moveTop(tableaux[i]);
            }
        });
    }

    availableMoves()
    {
        return this.cards.length;
    }

    english()
    {
        return 'Clicking on the stock will transfer one card to each of the tableaux stacks, if all spaces in the tableaux have been filled.';
    }
}

class StockGolf extends Stock
{
    availableMoves()
    {   // override
        return this.cards.length;
    }

    onclick(c)
    {
        c.moveTop(foundations[0]);
    }

    english()
    {
        let e = super.english();
        return `${e} Clicking on the stock will transfer one to the foundation stack.`;
    }
}

class StockCruel extends Stock
{
    constructor(pt, g)
    {
        super(pt, g);
        this._createRedealsSVG();
    }

    _part1()
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

    _part2(tmp)
    {
        for ( let i=0; i<tableaux.length; i++ )
        {
            const dst = tableaux[i].cards;
            const n = tableaux[i].a_deal.length;
            const t = tmp.splice(-n, n);
            if ( t.length === 0 )
                break;

            for ( let n=0; n<t.length; n++ )
            {
                dst.push(t[n]);
            }
        }
    }

    _part3()
    {
        for ( let i=0; i<tableaux.length; i++ )
        {
            const tab = tableaux[i];
            for ( let j=0; j<tab.cards.length; j++ )
            {
                const c = tab.cards[j];
                c.owner = tab;
                c.bringToTop();
                if ( rules.Tableau.fan === 'Down' )
                    c.animate(Util.newPoint(tab.pt.x, tab._dynamicY(j)));
                else if ( rules.Tableau.fan === 'Right' )
                    c.animate(Util.newPoint(tab._dynamicX(j), tab.pt.y));
            }
        }
    }

    clickOnEmpty()
    {
        // infinite redeals when this.redeals is null
        if ( this.redealsAvailable() )
        {
            const tmp = this._part1();
            this._part2(tmp);
            this._part3();

            if ( 1 === availableMoves() )   // repaint moveable cards
                displayToastNoAvailableMoves();
            else
                tallyMan.increment();

            this.decreaseRedeals();
        }
    }

    availableMoves()
    {
        if ( this.redealsAvailable() )
            return 1;
        else
            return 0;
    }

    english()
    {
        let e = super.english();
        return `${e} Clicking on the stock will collect and then redeal the tableaux stacks.`;
    }
}

class StockFan extends Stock
{
    constructor(pt, g)
    {
        super(pt, g);
        this._createRedealsSVG();
    }

    clickOnEmpty()
    {
        if ( this.redealsAvailable() )
        {
            // TODO surely we could moveTail the whole tab stack to stock?
            tableaux.forEach( t => {
                for ( let c=t.peek(); c; c=t.peek() )
                    c.moveTop(stock, false);
            });

            waitForCards()
                .then ( () => {
                    const oldSeed = stats[rules.Name].seed;
                    stock.sort(123456);         // just some made up, reproduceable seed
                    stats[rules.Name].seed = oldSeed;   // sort(n) over-writes this
                    undo.length = 0;            // can't undo a jumble
                });

            tableaux.forEach( t => {
                // waitForCards().then( () => t.deal() );
                window.setTimeout( () => t.deal(), 1 );
            });

            waitForCards()
                .then ( () => {
                    if ( 1 === availableMoves() )   // repaint moveable cards
                        displayToastNoAvailableMoves();
                    else
                        tallyMan.increment();

                    this.decreaseRedeals();
                });
        }
    }

    availableMoves()
    {
        if ( this.redealsAvailable() )
            return 1;
        else
            return 0;
    }

    english()
    {
        let e = super.english();
        return `${e} Clicking on the stock will collect and then redeal the tableaux stacks.`;
    }
}

class Waste extends CardContainer
{
    _middleX() { return this.pt.x + Constants.CARD_WIDTH_STACKED; }
    _rightX() { return this.pt.x + Constants.CARD_WIDTH_STACKED * 2; }

    push(c)
    {
        let ptNew = Util.newPoint(this.pt);
        if ( this.cards.length === 0 )
        {   // incoming card will go to left position

        }
        else if ( this.cards.length === 1 )
        {   // incoming card will go to middle position
            ptNew.x = this._middleX();
        }
        else if ( this.cards.length === 2 )
        {   // incoming card will go to right position
            ptNew.x = this._rightX();
        }
        else
        {   // incoming card will go to right position
            ptNew.x = this._rightX();
            // card in middle needs to go to left position
            const cMiddle = this.cards[this.cards.length-2];
            const ptLeft = Util.newPoint(this.pt.x, this.pt.y);
            cMiddle.animate(ptLeft);
            // card on right (top card) needs to go to middle position
            const cTop = this.cards[this.cards.length-1];
            const ptMiddle = Util.newPoint(this._middleX(), this.pt.y);
            cTop.animate(ptMiddle);
        }
        c.owner = this;
        this.cards.push(c);
        if ( c.faceDown )
            c.turnUp();
        c.animate(ptNew);
    }

    pop()
    {
        const c = super.pop();

        if ( this.cards.length > 2 )
        {
            // top card needs to go to right position
            const cTop = this.cards[this.cards.length-1];
            const ptRight = Util.newPoint(this._rightX(), this.pt.y);
            cTop.animate(ptRight);

            // top-1 card needs to go to middle position
            const cTop1 = this.cards[this.cards.length-2];
            const ptMiddle = Util.newPoint(this._middleX(), this.pt.y);
            cTop1.animate(ptMiddle);

            // top-2 card needs to go to left position
            const cTop2 = this.cards[this.cards.length-3];
            const ptLeft = Util.newPoint(this.pt.x, this.pt.y);
            cTop2.animate(ptLeft);
        }

        return c;
    }

    onclick(c)
    {
        if ( !stats.Options.autoPlay )
            return;

        if ( c !== this.cards.peek() )
            return;

        let cc = null;
        cc = c.findFullestAcceptingContainer(foundations);
        if ( !cc )
            cc = c.findFullestAcceptingContainer(tableaux);
        if ( !cc )
            cc = c.findFullestAcceptingContainer(cells);      // Carpet
        if ( cc )
        {
            c.moveTop(cc);
        }
    }

    canAcceptCard(c)
    {
        return c.owner instanceof Stock;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Waste.target )
            return true;
        return ( rules.Waste.target === cc.constructor.name );
    }

    isSolveable()
    {
        return this.cards.length === 0;
    }

    availableMoves()
    {
        if ( stock.redeals === null || stock.redeals > 0 )
            return this._availableMovesStackAll();
        else
            return super.availableMoves();   // just the top card
    }

    english()
    {
        return `Waste ${countInstances(Waste)}. Cards can be be moved from here to tableaux or foundations.`;
    }
}

class Foundation extends CardContainer
{
    constructor(pt, g)
    {
        super(pt, g);
        this._resetStackFactor(rules.Foundation);
        this.scattered = false;
        if ( this.a_accept === 0 && rules.Foundation.accept )
        {   // accept not specified in guts, so we use rules
            this.a_accept = rules.Foundation.accept;
            this._createAcceptSVG();
        }
        this.a_complete = this.g.getAttribute('complete');  // e.g. "♥01"
        if ( this.a_complete )
        {
            this.a_completeSuit = this.a_complete.charAt(0);
            this.a_completeOrd = Number.parseInt(this.a_complete.slice(1));
        }
        this.a_reverse = !!(this.g.getAttribute('reverse') || 0);
        if ( this.a_reverse )
        {
            this.rules = JSON.parse(JSON.stringify(rules.Foundation));
            if ( this.rules.rank === 1 ) // up
                this.rules.rank = 2;     // down
        }
        else
        {
            this.rules = rules.Foundation;
        }
    }

    push(c)
    {   // override to fan
        let pt = null;
        if ( rules.Foundation.fan === 'Down' )
            pt = Util.newPoint(this.pt.x, this._dynamicY());
        else if ( rules.Foundation.fan === 'Right' )
            pt = Util.newPoint(this._dynamicX(), this.pt.y);
        else if ( rules.Foundation.fan === 'None' )
            pt = Util.newPoint(this.pt.x, this.pt.y);
        this.cards.push(c);
        c.owner = this;
        c.animate(pt);
    }

    onclick(c)
    {
        if ( !stats.Options.playFromFoundation )
            return;
        if ( !stats.Options.autoPlay )
            return;

        let cc = c.findFullestAcceptingContainer(tableaux);
        if ( cc )
            c.moveTop(cc);
    }

    isSolveable()
    {
        return true;
    }

    availableMoves()
    {   // override - we don't allow play from foundation
        this.cards.forEach( c => c.markMoveable(false) );
        return 0;
    }

    canAcceptCard(c)
    {
        let accept = true;

        if ( c.owner.peek() !== c )
        {   // Tableau or Reserve, needs to be top card only
            accept = false;
        }
        else
        {
            const fc = this.peek();
            if ( !fc )
            {
                if ( this.a_accept )    // 0 or missing to accept any card
                    accept = ( c.ordinal === this.a_accept );
            }
            else
            {
                accept = isConformant0(this.rules, fc, c);
            }
        }
        return accept;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Foundation.target )
            return true;
        return ( rules.Foundation.target === cc.constructor.name );
    }

    canGrab(c)
    {
        if ( stats.Options.playFromFoundation )
        {
            return [c];
        }
        return null;
    }

    autoSolve(ord)
    {
        const _solve = (c) => {
            if ( c && !c.faceDown )
            {
                if ( ord === 0 || c.ordinal === ord )
                {
                    if ( c.owner.canTarget(this) && this.canAcceptCard(c) )
                    {
                        c.moveTop(this);
                        cardMoved = true;
                    }
                }
            }
        }

        let cardMoved = false;
        cells.forEach( cc => {
            _solve(cc.peek());
        });
        tableaux.forEach( t => {
            _solve(t.peek());
        });
        return cardMoved;
    }

    isComplete()
    {
        if ( this.a_complete )
        {   // Grandfather's Clock
            const c = this.cards.peek();
            return ( c && c.ordinal === this.a_completeOrd && c.suit === this.a_completeSuit );
        }
        /*
            Because of the Bisley/reverse foundation problem, a game is complete if
            every container except a foundation is empty, rather than a game being
            complete when every foundation contains (13) cards.
        */
        return true;
    }

    scatter()
    {
        if ( !this.scattered )
        {
            this['scatter'+rules.Foundation.scatter]();
            this.scattered = true;
        }
    }

    scatterNone()
    {
        function scat()
        {
            this.markMoveable(true);
        }

        this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
    }

    scatterCircle()
    {
        function scat()
        {
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

    scatterDown()
    {
        function scat()
        {
            this.markMoveable(true);
            const pt = Util.newPoint(
                this.pt.x,
                this.pt.y + ((this.ordinal-1) * Math.round(Constants.CARD_HEIGHT/3)));
            this.animate(pt);
        }

        this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
    }

    scatterLeft()
    {
        function scat()
        {
            this.markMoveable(true);
            const pt = Util.newPoint(
                this.pt.x - ((this.ordinal-1) * Math.round(Constants.CARD_WIDTH/2)),
                this.pt.y);
            this.animate(pt);
        }
        for ( let i=this.cards.length-1; i>=0; i-- )
        {
            const c = this.cards[i];
            window.setTimeout(scat.bind(c), 500);
        }
        // this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
    }

    scatterRight()
    {
        function scat()
        {
            this.markMoveable(true);
            const pt = Util.newPoint(
                this.pt.x + ((this.ordinal-1) * Math.round(Constants.CARD_WIDTH/2)),
                this.pt.y);
            this.animate(pt);
        }
        for ( let i=this.cards.length-1; i>=0; i-- )
        {
            const c = this.cards[i];
            window.setTimeout(scat.bind(c), 500);
        }
        // this.cards.forEach ( c => window.setTimeout(scat.bind(c), 500) );
    }

    english()
    {
        if ( rules.Foundation.hidden )
            return '';
        else if ( this.a_complete )
            return `Foundation ${countInstances(Foundation)}. Build ${englishRules(rules.Foundation)}. The game is complete when each stack has a certain card on top.`;
        else
            return `Foundation ${countInstances(Foundation)}. Build ${englishRules(rules.Foundation)}. `;
    }
}

class FoundationCanfield extends Foundation
// set a_accept after first card is pushed
{
    push(c)
    {
        super.push(c);
        if ( this === foundations[0] && this.cards.length === 1 )
        {
            console.log('a_accept will be', c.ordinal);
            foundations.forEach( f => {
                f.a_accept = c.ordinal;
                f._createAcceptSVG();
            });
        }
    }
}

class FoundationOsmosis extends Foundation
{
    push(c)
    {
        super.push(c);
        // first card dealt, setup the other foundations
        if ( this === foundations[0] && this.cards.length === 1 )
        {
            console.log('a_accept will be', c.ordinal);
            foundations.forEach( f => {
                f.a_accept = c.ordinal;
                f._createAcceptSVG();
            });
        }
    }

    canAcceptCard(c)
    {
        if ( this.cards.length === 0 )
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

class FoundationPenguin extends Foundation
// set a_accept on Foundation and Tableau after first card is pushed
/*
    When you empty a column, you may fill the space it leaves with a card one rank lower than the rank of the beak,
    together with any other cards attached to it in descending suit-sequence. For example, since the beak is a Ten,
    you can start a new column only with a Nine, or a suit-sequence headed by a Nine.

    Agnes rules from PGS: "Spaces (in the tableau) are filled by a card or legal
    group of cards headed by a card one rank below the foundation base card."
*/
{
    push(c)
    {
        super.push(c);
        if ( this === foundations[0] && this.cards.length === 1 )
        {
            console.log('a_accept will be', c.ordinal);
            foundations.forEach( f => {
                f.a_accept = c.ordinal;
                f._createAcceptSVG();
            });
            const o = c.ordinal === 1 ? 13 : c.ordinal - 1;
            tableaux.forEach( t => {
                t.a_accept = o;
                t._createAcceptSVG();
            });
        }
    }
}

class FoundationGolf extends Foundation
{
    push(c)
    {   // override to fan card to the right
        const pt = Util.newPoint(
            this.pt.x + (this.cards.length * 4),
            this.pt.y);
        c.owner = this;
        this.cards.push(c);
        c.animate(pt);
        if ( c.faceDown )
            c.turnUp();
    }
}

class FoundationSpider extends Foundation
{
    canAcceptCard(c)
    {
        if ( this.cards.length )
            return false;
        if ( c.ordinal !== 13 )
            return false;
        const tail = c.getTail();
        if ( tail.length !== 13 )
            return false;
        return isConformant(this.rules, tail);
    }

    autoSolve(ord=0)
    {   // override
        if ( this.cards.length )
            return false;

        let cardMoved = false;
        tableaux.forEach( t => {
            if ( t.cards.length >= 13 )
            {
                for ( let i=0; i<t.cards.length; i++ )
                {
                    const c = t.cards[i];
                    if ( c.faceDown )
                        continue;
                    if ( c.ordinal === 13 )
                    {
                        const tail = c.getTail();
                        if ( tail.length === 13 && isConformant(this.rules, tail) )
                        {
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

    english()
    {
        return `Foundation ${countInstances(Foundation)}. Completed sequences of cards are automatically moved to the foundation.`;
    }
}

class Tableau extends CardContainer
{
    constructor(pt, g)
    {
        super(pt, g);
        this._resetStackFactor(rules.Tableau);
        if ( this.a_accept === 0 && rules.Tableau.accept )
        {   // accept not specified in guts, so we use rules
            this.a_accept = rules.Tableau.accept;
            this._createAcceptSVG();
        }
    }

    push(c)
    {
        if ( 0 === this.cards.length )
            this._resetStackFactor(rules.Tableau);

        let pt = null;
        if ( rules.Tableau.fan === 'Down' )
            pt = Util.newPoint(this.pt.x, this._dynamicY());
        else if ( rules.Tableau.fan === 'Right' )
            pt = Util.newPoint(this._dynamicX(), this.pt.y);
        this.cards.push(c);
        c.owner = this;
        c.animate(pt);
    }

    pop()
    {
        const c = super.pop();

        const tc = this.peek();
        if ( tc && tc.faceDown && stats.Options.autoFlip )
            tc.turnUp();
        return c;
    }

    canAcceptCard(c)
    {
        let accept = true;

        if ( c.owner === this )
        {
            accept = false;
        }
        else
        {
            let tc = this.peek();
            if ( !tc )
            {
                if ( 0 === this.a_accept )
                {
                    accept = true;
                }
                else if ( Constants.ACCEPT_MARTHA_SYMBOL === this.a_accept )
                {
                    accept = c.owner.canGrab(c).length === 1;
                }
                else if ( this.a_accept )   // a number or a symbol
                {
                    accept = ( c.ordinal === this.a_accept );
                }
            }
            else
            {
                accept = isConformant0(rules.Tableau.build, tc, c);
            }
        }
        return accept;
    }

    canTarget(cc)
    {   // override base class to implement
        if ( null === rules.Tableau.target )
            return true;
        return ( rules.Tableau.target === cc.constructor.name );
    }

    onclick(c)
    {
        if ( c.faceDown && this.peek() === c )
        {
            c.turnUp();
            window.setTimeout(robot, 500);
            return;
        }

        if ( !stats.Options.autoPlay )
            return;

        if ( !this.canGrab(c) )
            return;

        let cc = null;
        if ( foundations[0] instanceof FoundationSpider )   // TODO subclass to get rid of this ugly hack
            cc = c.findFullestAcceptingContainer(foundations);
        else if ( this.cards.peek() === c )
            cc = c.findFullestAcceptingContainer(foundations);
        if ( !cc )
            cc = c.findFullestAcceptingContainer(tableaux);
        if ( !cc && this.cards.peek() === c )
            cc = c.findFullestAcceptingContainer(cells);
        if ( cc )
            c.moveTail(cc);
    }

    isSolveable()
    {
        if ( this.cards.length )
            return isConformant(rules.Tableau.build, this.cards);
        else
            return true;
    }

    english()
    {
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

class TableauTail extends Tableau
{
    canGrab(c)
    {   // override to grab a conformant tail
        const tail = c.getTail();
        if ( !isConformant(rules.Tableau.move, tail) )
        {
            // console.warn('tail is not conformant');
            return null;
        }
        return tail;
    }

    availableMoves()
    {   // override
        return this._availableMovesStack();
    }

    english()
    {
        let e = super.english();
        e += ' Sequences of cards may be moved together.';
        return e;
    }
}

class TableauBlockade extends TableauTail
// "Fill each space at once with the top card from the stock"
{
    pop()
    {
        const c = super.pop();
        if ( this.cards.length === 0 )
        {
            const sc = stock.peek();
            if ( sc )
                sc.moveTop(this);
        }
        return c;
    }

    english()
    {
        let e = super.english();
        e += ' Spaces are automatically filled with the top card from the stock.';
        return e;
    }
}

class TableauFortunesFavor extends Tableau
/*
    Empty spaces in the tableau are automatically filled with a card from the waste.
    If the waste is empty, then it is filled with a card from the stock.
    If the stock is empty, then empty spaces in the tableau may be filled by any card.

    Only one card may moved at a time, never sequences.
*/
{
    pop()
    {
        const c = super.pop();
        if ( this.cards.length === 0 )
        {
            let c2 = waste.peek();
            if ( !c2 )
                c2 = stock.peek();
            if ( c2 )
                c2.moveTop(this);
        }
        return c;
    }

    english()
    {
        let e = super.english();
        e += ' Spaces are automatically filled with the top card from the waste or stock.';
        return e;
    }
}

class TableauCanfield extends TableauTail
// "Fill each space at once with the top card from the reserve"
// "The top cards are available for play on foundations, but never into spaces" TODO
// Politaire says empty tableau can accept any card if reserve is empty TODO
{
    pop()
    {
        const c = super.pop();
        if ( this.cards.length === 0 )
        {
            const rc = reserve.peek();
            if ( rc )
                rc.moveTop(this);
        }
        return c;
    }

    english()
    {
        let e = super.english();
        e += ' Spaces are automatically filled with the top card from the reserve.';
        return e;
    }
}

class TableauFreecell extends Tableau
{
    _powerMoves(moveToEmptyColumn=false)
    {   // (1 + number of empty freecells) * 2 ^ (number of empty columns)
        // see http://ezinearticles.com/?Freecell-PowerMoves-Explained&id=104608
        // and http://www.solitairecentral.com/articles/FreecellPowerMovesExplained.html
        let nCells = 0;
        cells.forEach( c => {if (c.cards.length === 0) nCells++;} );
        let nCols = moveToEmptyColumn ? -1 : 0;
        tableaux.forEach( c => {if (c.cards.length === 0) nCols++;} );
        return (1 + nCells) * (Math.pow(2, nCols));
    }

    canGrab(c)
    {   // override
        const tail = c.getTail();
        if ( !isConformant(rules.Tableau.move, tail) )
        {
            // console.warn('tail is not conformant');
            return null;
        }
        const pm = this._powerMoves();
        if ( tail.length > pm )
        {
            if ( c.tailGrabbed )    // too late, grabbing already over?
                displayToast(`you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
            // console.log(`grab: you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
            return null;
        }
        return tail;
    }

    canAcceptCard(c)
    {   // override
        // If you are moving into an empty column,
        // then the column you are moving into does not count as empty column
        let accept = super.canAcceptCard(c);
        // if c comes from Stock, Waste, Cell or Reserve it's only going to be one card, so allow it
        if ( accept && c.owner instanceof Tableau )
        {
            const tail = c.getTail();
            const pm = this._powerMoves(this.cards.length === 0);
            if ( tail.length > pm )
            {
                if ( c.tailGrabbed )    // too late, grabbing already over?
                    displayToast(`you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
                // console.log(`accept: you have enough free space to move ${Util.plural(pm, 'card')}, not ${tail.length}`);
                accept = false;
            }
        }
        return accept;
    }

    availableMoves()
    {   // override
        return this._availableMovesStack();
    }

    english()
    {
        let e = super.english();
        e += ' Strictly, only the top card of each stack may be moved. However, the games automates moves of several cards, when empty tableau columns and empty cells allow.';
        return e;
    }
}

class TableauGolf extends Tableau
{
    onclick(c)
    {   // override - only click top card, which can only go to foundation[0]
        if ( this.cards.peek() === c )
        {
            if ( foundations[0].canAcceptCard(c) )
            {
                c.moveTop(foundations[0]);
            }
        }
    }

    availableMoves()
    {   // override
        this.cards.forEach( c => c.markMoveable(false) );

        const c = this.cards.peek();
        if ( c && foundations[0].canAcceptCard(c) )
        {
            c.markMoveable(true);
            return 1;
        }
        return 0;
    }
}

function linkClasses(src)
{
    const dst = [];
    src.forEach ( e => {
        document.querySelectorAll('g.' + e.name).forEach( g => {
            // g contains a rect, the rect contains x,y attributes in SVG coords
            const r = g.querySelector('rect');
            const x = Number.parseInt(r.getAttribute('x'));
            const y = Number.parseInt(r.getAttribute('y'));
            const pt = Util.newPoint(x, y);
            dst.push(new e(pt, g));
        });
    });
    return dst;
}

function countInstances(typ)
{
    let count = 0;
    listOfCardContainers.forEach( cc => {
        if ( cc instanceof typ )
            count++;
    });
    return `(${Util.plural(count, 'stack')})`;
}

function isConformant0(rules, cPrev, cThis)
{   // TODO clean up this horrible looking code
    if ( cPrev.faceDown || cThis.faceDown )
        return false;

    switch ( rules.suit )
    {
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
    switch ( rules.rank )
    {
    case 0: // may not build/move
        return false;
    case 1: // up, e.g. a 10 goes on a 9
        if ( rules.rankwrap )
        {
            if ( cPrev.ordinal === 13 && cThis.ordinal === 1 )
            {
                // An Ace on a King
            }
            else if ( cThis.ordinal !== cPrev.ordinal + 1 )
                return false;
        }
        else
        {
            if ( cThis.ordinal !== cPrev.ordinal + 1 )
                return false;
        }
        break;
    case 2: // down, e.g. a 9 goes on a 10
        if ( rules.rankwrap )
        {
            if ( cPrev.ordinal === 1 && cThis.ordinal === 13 )
            {
                // a King on an Ace
            }
            else if ( cThis.ordinal !== cPrev.ordinal - 1 )
                return false;
        }
        else
        {
            if ( cThis.ordinal !== cPrev.ordinal - 1 )
                return false;
        }
        break;
    case 4: // either up or down
        //if ( !(cThis.ordinal === cPrev.ordinal + 1 || cThis.ordinal === cPrev.ordinal - 1) )
        if ( rules.rankwrap )
        {
            if ( cPrev.ordinal === 13 && cThis.ordinal === 1 )
            {}
            else if ( cPrev.ordinal === 1 && cThis.ordinal === 13 )
            {}
            else if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) )
                return false;
        }
        else
        {
            if ( !(Math.abs(cPrev.ordinal - cThis.ordinal) === 1) )
                return false;
        }
        break;
    case 5: // regardless
        break;
    }

    return true;
}

function isConformant(rules, cards)
{
    let cPrev = cards[0];
    for ( let nCard=1; nCard<cards.length; nCard++ )
    {
        const cThis = cards[nCard];
        if ( !isConformant0(rules, cPrev, cThis) )
            return false;
        cPrev = cThis;
    }
    return true;
}

function englishRules(rules)
{
    let s = '';
    switch ( rules.suit )
    {
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
    switch ( rules.rank )
    {
    case 0: // may not build/move
        break;
    case 1: // up, e.g. a 10 goes on a 9
        s += ' and up, e.g. a 10 goes on a 9';
        if ( rules.rankwrap )
        {
            s += ', Aces are allowed on Kings';
        }
        break;
    case 2: // down, e.g. a 9 goes on a 10
        s += ' and down, e.g. a 9 goes on a 10';
        if ( rules.rankwrap )
        {
            s += ', Kings are allowed on Aces';
        }
        break;
    case 4: // either up or down
        s += ' and either up or down';
        if ( rules.rankwrap )
        {
            s += ', Aces and Kings can go on top of each other';
        }
        break;
    case 5: // regardless
        s += ' regardless of rank';
        break;
    }

    return s;
}

function isComplete()
{
    return listOfCardContainers.every( cc => cc.isComplete() );
}

function autoSolve(ord=0)
{
    let cardMoved = false;
    foundations.forEach( f => {
        waitForCards().then( () => {
            if ( f.autoSolve(ord) )
                cardMoved = true;
        });
    });
    return cardMoved;
}

function autoCollect()
{
    if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_OFF )
    {
    }
    // else if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_ACES )
    // {
    //     while ( autoSolve(1) )
    //         ;
    // }
    else if ( stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY )
    {
        while ( autoSolve(0) )
            waitForCards();
    }
}

function availableMoves()
{
    let count = listOfCardContainers.reduce( (acc,obj) => {
        return acc + obj.availableMoves();
    }, 0);
    return count;
}

function dotick()
{
    while ( !isComplete() )
    {
        waitForCards();
        if ( !autoSolve(0) )
            break;
    }
}

function gameOver(won)
{
    const st = stats[rules.Name];

    if ( won )
    {
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
    }
    else if ( tallyMan.count > 0 && !isComplete() )
    {
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

function restart(seed)
{
    gameOver(false);

    // move all cards back to stock, can't use pop and push
    // because Blockade will try to push them back to an empty tab
    listOfCardContainers.forEach( cc => {
        if ( cc !== stock )
        {
            stock.cards = stock.cards.concat(cc.cards);
            cc.cards = [];
        }
    });
    stock.cards.forEach( c => {
        c.owner = stock;
        if ( !c.faceDown )
            c.turnDown();
        c.position0(stock.pt.x, stock.pt.y);
    });

    stock.sort(seed);
    stock.cards.forEach( c => c.bringToTop() );
    stock.redeals = rules.Stock.redeals;    // could be null
    undo.length = 0;
    tallyMan.reset();
    foundations.forEach( f => f.scattered = false );
    if ( stats[rules.Name].saved )
        delete stats[rules.Name].saved; // .saved will now be 'undefined'
    dealCards();
}

function dostar()
{
    restart();
}

function doreplay()
{
    restart(stats[rules.Name].seed);
}

class Saved
{
    constructor()
    {
        this.seed = stats[rules.Name].seed;
        this.redeals = stock.redeals;
        this.moves = tallyMan.count;
        this.undo = undo;
        this.containers = [];
        for ( let i=0; i<listOfCardContainers.length; i++ )
        {
            this.containers[i] = listOfCardContainers[i].getSaveableCards();
        }
    }
}

function dosave()
{
    stats[rules.Name].saved = new Saved();
    try {
        localStorage.setItem(Constants.GAME_NAME, JSON.stringify(stats));
        displayToast('position saved');
    } catch(e) {
        console.error(e);
    }
}

function doload()
{
    if ( !stats.Options.loadSaved )
        return;

    if ( stats[rules.Name].saved )
    {
        // console.log('loading', stats[rules.Name].saved);
        for ( let i=0; i<listOfCardContainers.length; i++ )
        {
            listOfCardContainers[i].load(stats[rules.Name].saved.containers[i]);
        }
        stats[rules.Name].seed = stats[rules.Name].saved.seed;
        if ( stats[rules.Name].saved.hasOwnProperty('redeals') )
            stock.redeals = stats[rules.Name].saved.redeals;
        else
            stock.redeals = null;
        stock._updateRedealsSVG();
        tallyMan.count = stats[rules.Name].saved.moves;
        undo = stats[rules.Name].saved.undo;

        waitForCards().then( () => {    // TODO DRY
            tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
            reserves.forEach( res => res.scrunchCards(rules.Reserve) );
        });

        delete stats[rules.Name].saved;
    }
    else
    {
        displayToast('no saved game');
    }
}

const modalSettings = M.Modal.getInstance(document.getElementById('modalSettings'));
modalSettings.options.onOpenStart = function()
{
    document.getElementById('aniSpeed').value = stats.Options.aniSpeed;
    document.getElementById('sensoryCues').checked = stats.Options.sensoryCues;
    document.getElementById('autoPlay').checked = stats.Options.autoPlay;
    document.getElementById('autoFlip').checked = stats.Options.autoFlip;
    // document.getElementById('playFromFoundation').checked = stats.Options.playFromFoundation;

    document.getElementById('autoOff').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_OFF;
    document.getElementById('autoSolve').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_SOLVEABLE;
    // document.getElementById('autoAces').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_ACES;
    document.getElementById('autoAny').checked = stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY;
};

modalSettings.options.onCloseEnd = function()
{
    stats.Options.aniSpeed = document.getElementById('aniSpeed').value;
    stats.Options.sensoryCues = document.getElementById('sensoryCues').checked;
    stats.Options.autoPlay = document.getElementById('autoPlay').checked;
    stats.Options.autoFlip = document.getElementById('autoFlip').checked;
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
modalStatistics.options.onOpenStart = function()
{
    document.getElementById('gamesPlayedStats').innerHTML = stats[rules.Name].totalGames === 0
        ? `You've not played ${rules.Name} before`
        : `You've played ${rules.Name} ${stats[rules.Name].totalGames} times, and won ${stats[rules.Name].gamesWon} (${Math.round(stats[rules.Name].gamesWon/stats[rules.Name].totalGames*100)}%)`;

    {
        let s = 'In this game you\'ve made ';
        s += Util.plural(tallyMan.count, 'move');
        s += ', there are ';
        s += Util.plural(availableMoves(), 'available move');
        if ( !rules.Stock.hidden )
        {
            s += ', ';
            s += Util.plural(stock.cards.length, 'stock card');
        }
        if ( waste )
        {
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
        document.getElementById('gamesStreakStats').innerHTML = `Your current winning streak is ${stats[rules.Name].currStreak}, your best winning streak is ${stats[rules.Name].bestStreak}, your worst is ${stats[rules.Name].worstStreak}`;
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
        document.getElementById('gamesTotalStats').innerHTML = `In total, you have played ${totalPlayed} games and won ${totalWon} of them (${Math.round(totalWon/totalPlayed*100)}%)`;
};

modalStatistics.options.onCloseEnd = function()
{
};

const modalGameOver = M.Modal.getInstance(document.getElementById('modalGameOver'));
modalGameOver.options.onOpenStart = function()
{
    document.getElementById('movesMade').innerHTML = `Game ${stats[rules.Name].seed} of ${rules.Name} solved in ${tallyMan.count} moves; your average is ${Math.round(stats[rules.Name].totalMoves/stats[rules.Name].gamesWon)}`;
    document.getElementById('gamesPlayed').innerHTML = `You've played ${rules.Name} ${stats[rules.Name].totalGames} times, and won ${stats[rules.Name].gamesWon}`;
    document.getElementById('gamesStreak').innerHTML = `Your current winning streak is ${stats[rules.Name].currStreak}, your best winning streak is ${stats[rules.Name].bestStreak}, your worst is ${stats[rules.Name].worstStreak}`;
};

modalGameOver.options.onCloseEnd = function()
{
};

const modalAreYouSure = M.Modal.getInstance(document.getElementById('modalAreYouSure'));

function areYouSure(f)
{   console.assert(typeof f === 'string');
    const ele = document.getElementById('modalAreYouSureYes');
    ele.setAttribute('onclick', `${f}()`);
    modalAreYouSure.open();
}

const modalShowRules = M.Modal.getInstance(document.getElementById('modalShowRules'));
modalShowRules.options.onOpenStart = function()
{
    let r = '<p>' + stock.english() + '</p>';
    [waste,foundations[0],tableaux[0],cells[0],reserve].forEach( cc => {
        if ( cc )
            r = r + '<p>' + cc.english() + '</p>';
    });
    document.getElementById('therules').innerHTML = r;

    const ele = document.getElementById('theruleswikipedia');
    if ( rules.hasOwnProperty('Wikipedia') && rules.Wikipedia.length )
    {
        ele.hidden = false;
        ele.href = rules.Wikipedia;
    }
    else
    {
        ele.hidden = true;
    }
};

function doshowrules()
{
    modalShowRules.open();
}

function dostatsreset()
{
    stats[rules.Name].totalMoves = 0;
    stats[rules.Name].totalGames = 0;
    stats[rules.Name].gamesWon = 0;

    stats[rules.Name].currStreak = 0;
    stats[rules.Name].bestStreak = 0;
    stats[rules.Name].worstStreak = 0;
}

function displayToast(msg)
{
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

function displayToastNoAvailableMoves()
{
    displayToast('<span>no available moves</span><button class="btn-flat toast-action" onclick="doundo()">Undo</button><button class="btn-flat toast-action" onclick="dostar()">New</button>');
}

function dosettings()
{
    modalSettings.open();
}

function dohelp()
{
    window.open(rules.Wikipedia);
}

function dealCards()
{
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
if ( !rules.Tableau.hasOwnProperty('maxfan') )      rules.Tableau.maxfan = 0;       // use baize dimensions
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

if ( !stats.Options )
{
    stats.Options = {
        aniSpeed:3,
        autoCollect:Constants.AUTOCOLLECT_SOLVEABLE,
        sensoryCues:false,
        autoFlip:false,
        playFromFoundation:false,
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

const listOfCardContainers = [];

const stocks = linkClasses([Stock, StockAgnes, StockCruel, StockFan, StockKlondike, StockGolf, StockScorpion, StockSpider]);
const stock = stocks[0];
const wastes = linkClasses([Waste]);
const waste = wastes[0];
const foundations = linkClasses([Foundation,FoundationCanfield,FoundationGolf,FoundationOsmosis,FoundationPenguin,FoundationSpider]);
const tableaux = linkClasses([Tableau,TableauBlockade,TableauCanfield,TableauFortunesFavor,TableauFreecell,TableauGolf,TableauTail]);
const cells = linkClasses([Cell,CellCarpet]);
const reserves = linkClasses([Reserve,ReserveFrog]);
const reserve = reserves[0];

document.documentElement.style.setProperty('--bg-color', 'darkgreen');
document.documentElement.style.setProperty('--hi-color', 'lightgreen');
document.documentElement.style.setProperty('--ffont', 'Acme');

// document.addEventListener('contextmenu', event => event.preventDefault());

window.onbeforeunload = function(e)
{
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

const someCardsInTransit = () =>
{
    listOfCardContainers.forEach( cc =>
    {
        if ( cc.cards.some( c => c.inTransit ) )
            return true;
    });
    return false;
};

const waitForCards = () => new Promise((resolve,reject) =>
{
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

function robot()
{
    waitForCards().then ( () =>
    {
        autoCollect();
        waitForCards().then( () =>
        {
            if ( (stats.Options.autoCollect === Constants.AUTOCOLLECT_ANY || stats.Options.autoCollect === Constants.AUTOCOLLECT_SOLVEABLE)
                && listOfCardContainers.every( f => f.isSolveable() ) )
            {
                dotick();   // TODO could display toast [solve]
            }
            waitForCards().then( () =>
            {
                if ( isComplete() )
                {
                    if ( foundations.every( f => !f.scattered ) )
                    {
                        foundations.forEach( f => f.scatter() );
                        waitForCards().then( () =>
                        {
                            undo.length = 0;
                            gameOver(true);
                            modalGameOver.open();
                        });
                    }
                }
                else if ( !availableMoves() )
                {
                    displayToastNoAvailableMoves();
                }
                else
                {
                    tableaux.forEach( tab => tab.scrunchCards(rules.Tableau) );
                    reserves.forEach( res => res.scrunchCards(rules.Reserve) );
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
document.addEventListener('keypress', function(ev)
{
    // console.log(ev,ev.keyCode);
    if ( ev.keyCode === 26 && ev.ctrlKey )           // Chrome
        doundo();
    else if ( ev.key === 'a' )
    {
        const a = availableMoves();
        if ( 0 === a )
            displayToastNoAvailableMoves();
        else
            displayToast(`<span>${a} available moves</span>`);
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

if ( stats[rules.Name].totalGames === 0 )
    doshowrules();
