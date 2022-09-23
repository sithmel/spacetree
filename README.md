# Spacetree
Spacetree is a fast and compact library to query spatial data in the 2 dimensions.

## Why to use it
If you are developing an application that deals with bidimensional space you probably need to retrieve all points or shapes in a certain area. This library allows you to do it in logarithmic time! That means that you can handle a lot of shapes very fast.

## How it works internally
Internally uses a data structure called (quadtree)[https://en.wikipedia.org/wiki/Quadtree].

## Basic usage
Create the data structure and add some data:
```js
import Spacetree from 'Spacetree';
const st = new Spacetree({height: 1200, width:2000});
const points = [
  {x: 100, y: 0, data: 'first'},
  {x: 100, y: 100, data: 'second'},
  {x: 1000, y: 100, data: 'third'},
  {x: 1000, y: 600, data: 'fourth'},
  {x: 10000, y: 10000, data: 'fifth'}, // note the coordinates outside of the boundary
];
for (const point of points) {
  console.log(`Insert ${point.data}:`, st.insert(point));
}
console.log('Total size', st.size);
```
This will print:
```
Insert first: true
Insert second: true
Insert third: true
Insert fourth: true
Insert fifth: false
Total size: 4
```
because data are inserted only if they fit in the boundary of the data structure.
Here's how we retrieve the points in an area:
```js
for (const point of st.retrieve({x: 10, y: 10, width: 100, height: 100})) {
  console.log('Point found: ', point.data)
}
```
That will return:
```
first
second
```
If we want we can remove a point using:
```js
console.log(`Deleting ${points[0].data}`, st.delete(points[0]));
console.log('Remaining points: ', st.size);
```
```
Deleting first: true
Remaining points: 3
```
## How to retrieve from multiple boundaries
"retrieve" takes multiple ares as arguments:
```js
st.retrieve({x: 10, y: 10, width: 100, height: 100}, {x:500, y: 100, width: 10, height: 10});
```
If the areas overlap, duplicate points will be removed.

## How to use different shapes
The library can be used to retrieve rectangles, circles and every other bidimensional shape.
The only thing needed is a function that returns if an object is in a rectangular area:
```js
import Spacetree, {isRectInBoundary} from 'Spacetree';

const st = new Spacetree({height: 1200, width:2000}, {isShapeinBoundary: isRectInBoundary});
st.insert({x: 10, y: 10, width: 100, height: 100});
...
```
You can mix up shaped passing the function in the insert and delete methods:
```js
import Spacetree, {isRectInBoundary, isCircleInBoundary} from 'Spacetree';

const st = new Spacetree({height: 1200, width:2000});
st.insert({x: 10, y: 10, width: 100, height: 100}, isCircleInBoundary);
st.insert({x: 10, y: 10, width: 100, height: 100}, isRectInBoundary);
...
```
Or you can write your own. This is how isPointInBoundary (the default function) is implemented:
```js
function isPointInBoundary(obj, boundary) {
  const boundaryX = boundary?.x ?? 0;
  const boundaryY = boundary?.y ?? 0;

  return !(
    (obj.x < boundaryX) ||
    (obj.x >= boundaryX + boundary.width) ||
    (obj.y < boundaryY) ||
    (obj.y >= boundaryY + boundary.height));
}
```
## How to clean up reset or change boundaries
There is no particular API for this common operations but here how you can perform them.
If you need to clean up the tree, I suggest to just create a new one and let's the old one to be garbage collected. In fact this is the most performant way to get an empty data structure. If you need to change the boundaries of the data structure, again I suggest to create a new Spacetree. There is an API to retrieve all the object saved so that you can easily create a new one:
```js
const newST = new Spacetree({width: 20000, height: 10000});
for (const [obj, isShapeInBoundary] of st.retrieveAll()) {
  newST.insert(obj, isShapeInBoundary);
}
```

## Running time
- insert O(log n)
- delete O(log n)
- retrieve O(log n)
- retrieveAll O(n)
- size O(1)

## Why use this and not other Quadtree implementations?
- This is extensible: you can define you own shapes
- Very small footprint and no dependencies
- It is thouroughly tested
- It has a compact API, it does one thing well and fast
- It runs everywhere (no transpilation provided)