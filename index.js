/**
 * The area where to search is a Rect.
 * This is also one of the basic shapes
 * It has a width and height. 
 * x and y are coordinates in space: they can be positive or negative
 * @typedef {Object} Rect
 * @property {number} x  X-Position
 * @property {number} y  Y-Position
 * @property {number} width  Width
 * @property {number} height Height
 */

/**
 * The most basic shape is a Point.
 * @typedef {Object} Point
 * @property {number} x  X-Position
 * @property {number} y  Y-Position
 */

/**
 * A circle.
 * @typedef {Object} Circle
 * @property {number} x      X-Position
 * @property {number} y      Y-Position
 * @property {number} radius Radius of the circle
 */

/**
 * Check if a point is inside a boundary
 * 
 * @param {Point} obj
 * @param {Rect}  boundary 
 */
export function isPointInBoundary(obj, boundary) {
  return !(
    (obj.x < boundary.x) ||
    (obj.x >= boundary.x + boundary.width) ||
    (obj.y < boundary.y) ||
    (obj.y >= boundary.y + boundary.height));
}

/**
 * Check if a rectangle is inside or intersect a boundary
 * 
 * @param {Rect} obj
 * @param {Rect} boundary 
 */
export function isRectInBoundary(obj, boundary) {
  return !(
    (obj.x < boundary.x && obj.x + obj.width < boundary.x) ||
    (obj.x >= boundary.x + boundary.width && obj.x + obj.width >= boundary.x + boundary.width) ||
    (obj.y < boundary.y && obj.y + obj.height < boundary.y) ||
    (obj.y >= boundary.y + boundary.height && obj.y + obj.height >= boundary.y + boundary.height));
}

/**
 * Check if a circle is inside or intersect a boundary
 * 
 * @param {Circle} obj
 * @param {Rect}   boundary 
 */
export function isCircleInBoundary(obj, boundary) {
  const boundaryX = boundary.x - obj.radius;
  const boundaryY = boundary.y - obj.radius;
  const boundaryWidth = boundary.width + (obj.radius * 2);
  const boundaryHeight = boundary.height + (obj.radius * 2);

  return !(
    (obj.x < boundaryX) ||
    (obj.x >= boundaryX + boundaryWidth) ||
    (obj.y < boundaryY) ||
    (obj.y >= boundaryY + boundaryHeight));
}

function * removeDuplicates(iterable) {
  const objsYielded = new Set();
  for (const obj of iterable) {
    if (!objsYielded.has(obj)) {
      yield obj;
      objsYielded.add(obj);
    }
  }
}

/**
 * Options
 * @typedef {Object} Options
 * @property {number}    [maxObjects=4]           (optional) max objects a node can hold before splitting into 4 subnodes (default: 4)
 * @property {number}    [maxLevels=10]           (optional) total max levels inside root Spacetree (default: 10)
 * @property {?function} [isWithinBoundary=null] (optional) function used to determine if the object is in a boundary (if the function is no passed to the insert and delete methods). It defaults to the point function.
 */


export default class Spacetree {

  /**
   * Spacetree Constructor
   * @class Spacetree
   * @param {Rect} boundary               boundaries of the node ({ x, y, width, height }). x and y default to 0 if missing.
   * @param {?Options} opts               Options
   */
  constructor(boundary, opts, level = 0) {
    this.boundary = {...boundary, x: boundary?.x ?? 0, y: boundary?.y ?? 0};
    this.opts = opts;
    this.level = level;
    this.subnodes = null;
    this.objects = new Set();
    this._size = 0;
  }

  get maxObjects() {
    return this.opts?.maxObjects ?? 4;
  }

  get maxLevels() {
    return this.opts?.maxLevels ?? 10;
  }

  _getisWithinBoundaryFunc() {
    return this.opts?.isWithinBoundary || isPointInBoundary;
  }

  _split() {
    const width = this.boundary.width/2;
    const height = this.boundary.height/2;
    const x = this.boundary.x;
    const y = this.boundary.y;
    const nextLevel = this.level + 1;

    this.subnodes = Array(4);

    this.subnodes[0] = new Spacetree(
      {x, y, width, height},
      this.opts, nextLevel
    );
    this.subnodes[1] = new Spacetree(
      {x: x + width, y, width, height},
      this.opts, nextLevel
    );
    this.subnodes[2] = new Spacetree(
      {x, y: y + height, width, height},
      this.opts, nextLevel
    );
    this.subnodes[3] = new Spacetree(
      {x: x + width, y: y + height, width, height},
      this.opts, nextLevel
    );
  }

  /**
   * yields all objects and corresponding isWithinBoundary function
   * O(n)
   * @yields {*}
   * @memberof Spacetree
   */
  *retrieveAll() {
    yield * removeDuplicates(this._retrieveAll());
  }

  *_retrieveAll() {
    if (this.subnodes != null) {
      for (const subnode of this.subnodes) {
        yield * subnode._retrieveAll();
      }
    } else {
      yield * this.objects;
    }
  }

  /**
   * Insert object and its correspondind rectangle or point in the bidimentional space
   * O(logn)
   * @param {*} obj                              object to store in the tree
   * @return boolean                             returns true if successful. If the shape is outside the boundary of the node, it returns false
   * @memberof Spacetree
   */
  insert(obj) {
    const isInBoundary = this._getisWithinBoundaryFunc();
    if (!isInBoundary(obj, this.boundary)) {
      return false;
    }

    this._size += 1;

    if (this.subnodes != null) {
      this.subnodes.forEach((subNode) => subNode.insert(obj));
      return true;
    }

    this.objects.add(obj);

    if (this.objects.size > this.maxObjects && this.level < this.maxLevels) {
      this._split();
      for (const obj of this.objects) {
        this.subnodes.forEach((subNode) => subNode.insert(obj));
      }
      this.objects.clear();
    }
    return true;
  }

  /**
   * yields all the objects within one or more boundaries
   * O(logn)
   * @param {...Rect} searchBoundaries
   * @yields {*}
   * @memberof Spacetree
   */
  *retrieve (...searchBoundaries) {
    yield * removeDuplicates(this._retrieve(...searchBoundaries));
  }

  *_retrieve (...searchBoundaries) {
    // I filter out all the rects that don't belong to this node
    const validSearchBoundaries = searchBoundaries.filter(boundary => isRectInBoundary(boundary, this.boundary));
    if (validSearchBoundaries.length === 0) {
      return;
    }

    if (this.subnodes == null) {
      for (const obj of this.objects) {
        const isInBoundary = this._getisWithinBoundaryFunc();

        if (validSearchBoundaries.some(boundary => isInBoundary(obj, boundary))) {
          yield obj;
        }
      }
      return;
    }

    for (const subnode of this.subnodes) {
      yield * subnode._retrieve(...validSearchBoundaries);
    }
  }

  /**
   * delete an object given its position in the bidimentional space
   * O(logn)
   * @param {*} obj                              object to store in the tree
   * @return boolean
   * @memberof Spacetree
   */
  delete(obj) {
    const isInBoundary = this._getisWithinBoundaryFunc();

    if (!isInBoundary(obj, this.boundary)) {
      return false;
    }

    if (this.subnodes == null) {
      if(this.objects.delete(obj)) {
        this._size -= 1;
        return true;
      } else {
        return false;
      }
    }
    // for all subnodes, I check the number of objects in the branch
    // and collapse the node if necessary
    if(this.subnodes.some((subNode) => subNode.delete(obj))) {
      this._size -= 1;
      if (this._size <= this.maxObjects) {
        this.objects = new Set(this.retrieveAll());
        this.subnodes = null;
      }
      return true;
    }
    return false;
  }

  /**
   * number of objects in this node and subnodes
   * O(1)
   * @return number
   * @memberof Spacetree
   */
  get size() {
    return this._size;
  }
}