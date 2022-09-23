import pkg from 'zunit';

import assert from 'assert';
import Spacetree, {isRectInBoundary} from '../index.mjs';

const { describe, it, beforeEach }  = pkg;

const mapData = (iter) => Array.from(iter).map(o => o.data)

describe('Spacetree', () => {
  it('creates an instance', () => {
    assert(new Spacetree({width: 200, height: 100}) instanceof Spacetree);
  });

  describe('Offset', () => {
    it('works with positive offset', () => {
      const qt = new Spacetree({width: 200, height: 100, x: 100, y: 100});
      qt.insert({x: 20, y: 20, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);
      qt.insert({x: 120, y: 120, data: 'ok'});
      assert.equal(qt.objects.size, 1);
    });
    it('works with negative offset', () => {
      const qt = new Spacetree({width: 200, height: 100, x: -100, y: -100});
      qt.insert({x: 20, y: 20, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);
      qt.insert({x: -80, y: -80, data: 'ok'});
      assert.equal(qt.objects.size, 1);
    });
  });

  describe('Insert points', () => {
    let qt;
    beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100});
    });
    it('does not insert if out of bounds', () => {
      qt.insert({x: -1, y: -1, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: -1, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: -1, y: 10, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 201, y: 101, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 201, y: 10, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: 101, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);
    });

    it('insert in the objects', () => {
      const obj = {x: 10, y: 10, data: 'ok'};
      qt.insert(obj);
      assert.equal(qt.objects.size, 1);
      assert.equal(qt.objects.has(obj), true);
    });

    it('returns true when success', () => {
      const q1 = qt.insert({x: 10, y: 10, data: 'ok'});
      assert.equal(q1, true);
    });

    it('returns false when fails', () => {
      const q2 = qt.insert({x: 10, y: 101, data: 'outofbounds'});
      assert.equal(q2, false);
    });

    it('insert in the subnodes', () => {
      qt.insert({x: 10, y: 10, data: 'ok1'});
      qt.insert({x: 20, y: 20, data: 'ok2'});
      qt.insert({x: 101, y: 10, data: 'ok3'});
      qt.insert({x: 102, y: 10, data: 'ok4'});
      assert.equal(qt.objects.size, 4);

      qt.insert({x: 10, y: 51, data: 'ok5'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: 52, data: 'ok6'});
      assert.equal(qt.objects.size, 0);

      assert.equal(qt.subnodes[0].objects.size, 2);
      assert.equal(qt.subnodes[1].objects.size, 2);
      assert.equal(qt.subnodes[2].objects.size, 2);
      assert.equal(qt.subnodes[3].objects.size, 0);
    });

    it('splits in subnodes', () => {
      qt.insert({x: 10, y: 10, data: 'ok1'});
      qt.insert({x: 20, y: 20, data: 'ok2'});
      qt.insert({x: 101, y: 10, data: 'ok3'});
      qt.insert({x: 102, y: 10, data: 'ok4'});
      qt.insert({x: 10, y: 51, data: 'ok5'});
      qt.insert({x: 101, y: 52, data: 'ok6'});

      assert.deepEqual(qt.subnodes[0].boundary, {height: 50, width: 100, x: 0, y: 0});
      assert.deepEqual(qt.subnodes[1].boundary, {height: 50, width: 100, x: 100, y: 0});
      assert.deepEqual(qt.subnodes[2].boundary, {height: 50, width: 100, x: 0, y: 50});
      assert.deepEqual(qt.subnodes[3].boundary, {height: 50, width: 100, x: 100, y: 50});
      assert.deepEqual(mapData(qt.subnodes[0].objects.keys()), ['ok1', 'ok2']);
      assert.deepEqual(mapData(qt.subnodes[1].objects.keys()), ['ok3', 'ok4']);
      assert.deepEqual(mapData(qt.subnodes[2].objects.keys()), ['ok5']);
      assert.deepEqual(mapData(qt.subnodes[3].objects.keys()), ['ok6']);
    });
  });

  describe('Retrieve points', () => {
    let qt;
    beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100});  
      qt.insert({x: 10, y: 10, data: 'ok1'});
      qt.insert({x: 20, y: 20, data: 'ok2'});
      qt.insert({x: 101, y: 10, data: 'ok3'});
      qt.insert({x: 102, y: 10, data: 'ok4'});
      qt.insert({x: 10, y: 51, data: 'ok5'});
      qt.insert({x: 101, y: 52, data: 'ok6'});
    });
    it('retrieves items using a single bound', () => {
      assert.deepEqual(mapData(qt.retrieve({x: 300, y: 300, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 30, y: 30, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 10, y: 0, height: 30, width: 30})), ['ok1', 'ok2']);
      assert.deepEqual(mapData(qt.retrieve({x: 101, y: 0, height: 30, width: 30})), ['ok3', 'ok4']);
    });
    it('retrieves items using multiple bounds', () => {
      assert.deepEqual(mapData(qt.retrieve({x: 300, y: 300, height: 5, width: 5}, {x: 30, y: 30, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 30, y: 30, height: 5, width: 5}, {x: 101, y: 0, height: 30, width: 30})), ['ok3', 'ok4']);
      assert.deepEqual(mapData(qt.retrieve({x: 101, y: 0, height: 30, width: 30}, {x: 10, y: 0, height: 30, width: 30})), ['ok1', 'ok2', 'ok3', 'ok4']);
    });
    it('retrieves all obj and boundaries', () => {
      assert.deepEqual(Array.from(qt.retrieveAll()), [
        {
          x: 10,
          y: 10,
          data: 'ok1',
        },
        {
          x: 20,
          y: 20,
          data: 'ok2',
        },
        {
          x: 101,
          y: 10,
          data: 'ok3',
        },
        {
          x: 102,
          y: 10,
          data: 'ok4',
        },
        {
          x: 10,
          y: 51,
          data: 'ok5',
        },
        {
          x: 101,
          y: 52,
          data: 'ok6',
        },
    ]);
    });
  });

  describe('Insert rects', () => {
    let qt;
    beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100}, {isWithinBoundary: isRectInBoundary});
    });
    it('does not insert if out of bounds', () => {
      qt.insert({x: -10, y: -10, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: -10, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: -10, y: 10, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 201, y: 101, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 201, y: 10, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: 101, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.objects.size, 0);
    });

    it('insert in the objects', () => {
      const obj = {x: 10, y: 10, width: 5, height: 5, data: 'ok'};
      qt.insert(obj);
      assert.equal(qt.objects.size, 1);
      assert.equal(qt.objects.has(obj), true);
    });

    it('insert in the subnodes (with duplicate)', () => {
      qt.insert({x: 10, y: 10, width: 5, height: 5, data: 'ok1'});
      qt.insert({x: 20, y: 20, width: 5, height: 5, data: 'ok2'});
      qt.insert({x: 101, y: 10, width: 5, height: 5, data: 'ok3'});
      qt.insert({x: 102, y: 10, width: 5, height: 5, data: 'ok4'});
      assert.equal(qt.objects.size, 4);

      qt.insert({x: 10, y: 51, width: 5, height: 5, data: 'ok5'});
      assert.equal(qt.objects.size, 0);

      qt.insert({x: 10, y: 52, width: 200, height: 5, data: 'ok6'});
      assert.equal(qt.objects.size, 0);

      assert.equal(qt.subnodes[0].objects.size, 2);
      assert.equal(qt.subnodes[1].objects.size, 2);
      assert.equal(qt.subnodes[2].objects.size, 2);
      assert.equal(qt.subnodes[3].objects.size, 1); // ok6
    });

    it('splits in subnodes (with duplicate)', () => {
      qt.insert({x: 10, y: 10, width: 5, height: 5, data: 'ok1'});
      qt.insert({x: 20, y: 20, width: 5, height: 5, data: 'ok2'});
      qt.insert({x: 101, y: 10, width: 5, height: 5, data: 'ok3'});
      qt.insert({x: 102, y: 10, width: 5, height: 5, data: 'ok4'});
      qt.insert({x: 10, y: 51, width: 5, height: 5, data: 'ok5'});
      qt.insert({x: 10, y: 52, width: 200, height: 5, data: 'ok6'});

      assert.deepEqual(qt.subnodes[0].boundary, {height: 50, width: 100, x: 0, y: 0});
      assert.deepEqual(qt.subnodes[1].boundary, {height: 50, width: 100, x: 100, y: 0});
      assert.deepEqual(qt.subnodes[2].boundary, {height: 50, width: 100, x: 0, y: 50});
      assert.deepEqual(qt.subnodes[3].boundary, {height: 50, width: 100, x: 100, y: 50});
      assert.deepEqual(mapData(qt.subnodes[0].objects.keys()), ['ok1', 'ok2']);
      assert.deepEqual(mapData(qt.subnodes[1].objects.keys()), ['ok3', 'ok4']);
      assert.deepEqual(mapData(qt.subnodes[2].objects.keys()), ['ok5', 'ok6']);
      assert.deepEqual(mapData(qt.subnodes[3].objects.keys()), ['ok6']);
    });
  });

  describe('Retrieve rects', () => {
    let qt;
    beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100}, {isWithinBoundary: isRectInBoundary});
      qt.insert({x: 10, y: 10, width: 5, height: 5, data: 'ok1'});
      qt.insert({x: 20, y: 20, width: 5, height: 5, data: 'ok2'});
      qt.insert({x: 101, y: 10, width: 5, height: 5, data: 'ok3'});
      qt.insert({x: 102, y: 10, width: 5, height: 5, data: 'ok4'});
      qt.insert({x: 10, y: 51, width: 5, height: 5, data: 'ok5'});
      qt.insert({x: 10, y: 52, width: 200, height: 5, data: 'ok6'});
    });
    it('retrieves items using a single bound', () => {
      assert.deepEqual(mapData(qt.retrieve({x: 300, y: 300, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 30, y: 30, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 10, y: 0, height: 30, width: 30})), ['ok1', 'ok2']);
      assert.deepEqual(mapData(qt.retrieve({x: 101, y: 0, height: 30, width: 30})), ['ok3', 'ok4']);
    });
    it('ensures there are no duplicates', () => {
      assert.deepEqual(mapData(qt.retrieve({x: 0, y: 0, height: 1000, width: 1000})), ['ok1', 'ok2', 'ok3', 'ok4', 'ok5', 'ok6']);
    });
    it('ensures there are no duplicates (retrieve all)', () => {
      assert.deepEqual(Array.from(qt.retrieveAll()), 
      [
        {
          height: 5,
          width: 5,
          x: 10,
          y: 10,
          data: 'ok1',
        },
        {
          height: 5,
          width: 5,
          x: 20,
          y: 20,
          data: 'ok2',
        },
        {
          height: 5,
          width: 5,
          x: 101,
          y: 10,
          data: 'ok3',
        },
        {
          height: 5,
          width: 5,
          x: 102,
          y: 10,
          data: 'ok4',
        },
        {
          height: 5,
          width: 5,
          x: 10,
          y: 51,
          data: 'ok5',
        },
        {
          height: 5,
          width: 200,
          x: 10,
          y: 52,
          data: 'ok6',
        },
      ]);
    });
    it('retrieves items using multiple bounds', () => {
      assert.deepEqual(mapData(qt.retrieve({x: 300, y: 300, height: 5, width: 5}, {x: 30, y: 30, height: 5, width: 5})), []);
      assert.deepEqual(mapData(qt.retrieve({x: 30, y: 30, height: 5, width: 5}, {x: 101, y: 0, height: 30, width: 30})), ['ok3', 'ok4']);
      assert.deepEqual(mapData(qt.retrieve({x: 101, y: 0, height: 30, width: 30}, {x: 10, y: 0, height: 30, width: 30})), ['ok1', 'ok2', 'ok3', 'ok4']);
    });
  });



  describe('Size', () => {
    let qt;
    beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100});
    });

    it('tracks number of items', () => {
      const ok5 = {x: 10, y: 51, width: 5, height: 5, data: 'ok5'};
      const ok6 = {x: 10, y: 52, width: 200, height: 5, data: 'ok6'};

      qt.insert({x: 10, y: 101, width: 5, height: 5, data: 'outofbounds'});
      assert.equal(qt.size, 0);
      qt.insert({x: 10, y: 10, width: 5, height: 5, data: 'ok1'});
      assert.equal(qt.size, 1);
      qt.insert({x: 20, y: 20, width: 5, height: 5, data: 'ok2'});
      assert.equal(qt.size, 2);
      qt.insert({x: 101, y: 10, width: 5, height: 5, data: 'ok3'});
      assert.equal(qt.size, 3);
      qt.insert({x: 102, y: 10, width: 5, height: 5, data: 'ok4'});
      assert.equal(qt.size, 4);
      qt.insert(ok5);
      assert.equal(qt.size, 5);
      qt.insert(ok6); // this spans 2 subnodes, but is counted once
      assert.equal(qt.size, 6);
      qt.delete(ok5);
      assert.equal(qt.size, 5);
      qt.delete(ok6);
      assert.equal(qt.size, 4);
    });
  });

  describe('Delete', () => {
    let qt;
    const ok1 = {x: 10, y: 10, width: 5, height: 5, data: 'ok1'};
    const ok2 = {x: 20, y: 20, width: 5, height: 5, data: 'ok2'};
    const ok5 = {x: 10, y: 51, width: 5, height: 5, data: 'ok5'};
    const ok6 = {x: 10, y: 52, width: 200, height: 5, data: 'ok6'};
  beforeEach(() => {
      qt = new Spacetree({width: 200, height: 100});
      qt.insert(ok1);
      qt.insert(ok2);
      qt.insert({x: 101, y: 10, width: 5, height: 5, data: 'ok3'});
      qt.insert({x: 102, y: 10, width: 5, height: 5, data: 'ok4'});
      qt.insert(ok5);
      qt.insert(ok6); // duplicated
    });
    it('deletes an item', () => {
      qt.delete(ok5);
      assert.deepEqual(mapData(qt.retrieve({x: 0, y: 0, height: 1000, width: 1000})), ['ok1', 'ok2', 'ok3', 'ok4', 'ok6']);
      assert.equal(qt.size, 5);
      assert.equal(qt.objects.size, 0);
    });
    it('deletes a duplicated item', () => {
      qt.delete(ok6);
      assert.deepEqual(mapData(qt.retrieve({x: 0, y: 0, height: 1000, width: 1000})), ['ok1', 'ok2', 'ok3', 'ok4', 'ok5']);
      assert.equal(qt.size, 5);
      assert.equal(qt.objects.size, 0);
    });
    it('deletes and collapse nodes', () => {
      qt.delete(ok1);
      qt.delete(ok2);
      assert.deepEqual(mapData(qt.retrieve({x: 0, y: 0, height: 1000, width: 1000})), ['ok3', 'ok4', 'ok5', 'ok6']);
      assert.equal(qt.size, 4);
      assert.equal(qt.objects.size, 4);
      assert.equal(qt.subnodes, null);
    });
    it('returns true when successful', () => {
      assert.equal(qt.delete(ok1), true);
    });
    it('returns false when unsuccessful', () => {
      assert.equal(qt.delete({x: 101, y: 10, width: 5, height: 5, data: 'ok7'}), false);
    });
  });
});

