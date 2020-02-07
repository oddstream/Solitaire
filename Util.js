//@ts-check
'use strict';
/* jshint esversion:6 */

export const Util = {
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
    // https://developer.mozilla.org/en-US/docs/Web/API/SVGPoint
    const pt = document.getElementById('baize').createSVGPoint();
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

  /**
   * @param {SVGPoint} ptDst 
   * @param {SVGPoint} ptSrc 
   */
  copyPoint: function(ptDst, ptSrc) {
    ptDst.x = ptSrc.x;
    ptDst.y = ptSrc.y;
  },

  // samePoint: function(pt1, pt2) {
  //   return ( (pt1.x === pt2.x) && (pt1.y === pt2.y) );
  // },

  /**
   * @param {SVGPoint} pt1
   * @param {SVGPoint} pt2
   * @param {number=} slack
   * @returns {boolean}
   */
  nearlySamePoint: function(pt1, pt2, slack=8) {
    const xMin = pt1.x - slack;
    const xMax = pt1.x + slack;
    const yMin = pt1.y - slack;
    const yMax = pt1.y + slack;
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
    // https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement
    pt.matrixTransform(document.getElementById('baize').getScreenCTM().inverse());
    pt.x = Math.round(pt.x);
    pt.y = Math.round(pt.y);
    return pt;
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
  },

  /**
   * 
   * @param {Element} ele 
   * @param {Object} attribs 
   */
  setAttributesNS(ele, attribs) {
    for ( let a in attribs ) {
      ele.setAttributeNS(null, a, attribs[a]);
    }
  },

  /**
   * @param {string} id
   */
  play(id) {
    console.log(`audio#${id}`);
    let ele = /** @type {HTMLMediaElement} */(document.querySelector(`audio#${id}`));
    var promise = ele.play();
    if (promise !== undefined) {
      promise.then(_ => {
        // Autoplay started!
      }).catch(error => {
        // Autoplay was prevented.
      });
    }
  },

};
