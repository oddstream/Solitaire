//@ts-check
'use strict';
/* jshint esversion:6 */

/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 *
 * https://gist.github.com/blixt/f17b47c62508be59987b
 */
export default class Random {
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

