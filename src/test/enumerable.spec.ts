import { Enumerable, SortOrder } from '../enumerable';
import { PivotSelectionStrategies } from '../sorting/pivotSelectionStrategies';
import { Big } from 'big.js';
import { TestRecord, TestUtils } from './testutils';
import jsc from 'jsverify';

describe('Enumerable', () => {
  // test equals first so we can use it in subsequent tests
  describe('equals', () => {
    it('no array should be equivalent to undefined or null', () => {
      const arr = [1, 2];
      expect(new Enumerable(arr).equals(undefined)).toBeFalse();
      expect(new Enumerable(arr).equals(null)).toBeFalse();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(xs).equals(xs));
    });

    it('any given array should be equivalent to itself', () => {
      const arr = [1, 2];
      expect(new Enumerable(arr).equals(arr)).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(xs).equals(xs));
    });

    it('any given array should be equivalent to a copy of itself', () => {
      expect(new Enumerable([1, 1]).equals([1, 1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(xs).equals(Array.from(xs)));
    });

    it('any given array of arrays should be equivalent to a deep copy of itself', () => {
      expect(new Enumerable([[1, 2], [2, 1]]).equals([[1, 2], [2, 1]])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.nat)),
        (xss: number[][]) => new Enumerable(xss).equals(xss.map(xs => Array.from(xs))));
    });

    it('arrays of different length should not be equivalent', () => {
      expect(new Enumerable([1, 1]).equals([1, 1, 1])).toBeFalse();

      jsc.assertForall(
        (jsc.suchthat(jsc.pair(jsc.array(jsc.nat), jsc.array(jsc.nat)), u => u[0].length !== u[1].length)),
        (u: number[][]) => !new Enumerable(u[0]).equals(u[1]));
    });

    it('arrays with different elements should not be equivalent', () => {
      expect(new Enumerable([1, 1]).equals([1, 2])).toBeFalse();

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.nat, jsc.suchthat(jsc.number, x => x !== 0),
        (xs: number[], i: number, c: number) => {
          const ys = Array.from(xs);
          ys[i % ys.length] += c;
          return !new Enumerable(xs).equals(ys);
        });
    });
  });

  describe('toArray', () => {
    it('should return the original array', () => {
      const arr = [1, 2];
      expect(new Enumerable(new Enumerable(arr).toArray()).equals(arr)).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(new Enumerable(xs).toArray()).equals(xs));
    });
  });

  describe('any', () => {
    it('should return true iff the predicate is fulfilled for at least one item', () => {
      expect(new Enumerable([1, 2]).some(x => x > 1)).toBeTrue();
      expect(new Enumerable([1, 1]).some(x => x > 1)).toBeFalse();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) =>
          new Enumerable(xs).some(p) === xs.some(p)
      );
    });

    it('should return true iff the iterable is nonempty when invoked with no arguments', () => {
      expect(new Enumerable([1, 1]).some()).toBeTrue();
      expect(new Enumerable([]).some()).toBeFalse();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(xs).some() === xs.length > 0
      );
    });
  });

  describe('all', () => {
    it('should return true iff the predicate is fulfilled for all items', () => {
      const arr = [1, 2];
      expect(new Enumerable(arr).all(x => x > 0)).toBeTrue();
      expect(new Enumerable(arr).all(x => x > 1)).toBeFalse();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) =>
          new Enumerable(xs).all(p) === !xs.some(x => !p(x))
      );
    });
  });

  describe('map', () => {
    it('should return a new Enumerable with each item mapped with the given function', () => {
      expect(new Enumerable([1, 2]).map(x => x.toString()).equals(['1', '2'])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.string),
        (xs: number[], f: (x: number) => string) =>
          new Enumerable(xs).map(f).equals(xs.map(f))
      );
    });
  });

  describe('forEach', () => {
    it('should invoke the given function for each item in the Enumerable', () => {
      let c = 0;
      new Enumerable([1, 2]).forEach(x => {
        c += x;
      });
      expect(c).toBe(3);

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const arr: number[] = [];
          const f = (x: number) => void arr.push(x);
          const sut = new Enumerable(xs);
          sut.forEach(f);
          return sut.equals(arr);
        });
    });
  });

  describe('reduce', () => {
    it('should return the correct aggregated value when invoked with nonempty iterable and no initial value', () => {
      expect(new Enumerable([1, 2]).reduce((prev, curr) => prev + curr)).toBe(3);

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.fn(jsc.nat),
        (xs: number[], f: (prev: number, curr: number) => number) =>
          new Enumerable(xs).reduce(f) === xs.reduce(f)
      );
    });

    it('should return the correct aggregated value when invoked with initial value', () => {
      expect(new Enumerable([1, 2]).reduce((prev, curr) => prev + curr, 2)).toBe(5);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.string), jsc.string,
        (xs: number[], f: (prev: string, curr: number) => string, init: string) =>
          new Enumerable(xs).reduce(f, init) === xs.reduce(f, init)
      );
    });

    it('should throw an exception when invoked with an empty iterable and no initial value', () => {
      expect(() => new Enumerable([]).reduce((x, y) => x + y)).toThrowError();
    });
  });

  describe('toMap', () => {
    it('should return a new Map', () => {
      expect(new Enumerable([1, 2]).toMap(x => x, x => x.toString())).toEqual(new Map([[1, '1'], [2, '2']]));

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.string),
        (xs: number[], vs: (x: number) => string) => {
          const actual = new Enumerable(xs).toMap(x => x, vs);
          return new Enumerable(xs).all(x => actual.get(x) === vs(x));
        }
      );
    });
  });

  describe('zip', () => {
    it('should return a new Enumerable with pairs', () => {
      expect(new Enumerable([1, 2]).zip(['1', '2']).equals([[1, '1'], [2, '2']])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], ys: number[]) => {
          const actual = new Enumerable(xs).zip(ys).toArray();
          const shortestLength = Math.min(xs.length, ys.length);
          for (let i = 0; i < shortestLength; i++) {
            const [x, y] = actual[i];
            if (x !== xs[i] || y !== ys[i]) {
              return false;
            }
          }
          return actual.length === shortestLength;
        }
      );
    });

    it('should return a new Enumerable of transformed elements when given a joining function', () => {
      expect(new Enumerable([1, 2]).zip(['1', '2'], (a, b) => a.toString() + b).equals(['11', '22'])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat), jsc.fn(jsc.string),
        (xs: number[], ys: number[], f: (x: number, y: number) => string) => {
          const actual = new Enumerable(xs).zip(ys, f).toArray();
          const shortestLength = Math.min(xs.length, ys.length);
          for (let i = 0; i < shortestLength; i++) {
            const z = actual[i];
            if (z !== f(xs[i], ys[i])) {
              return false;
            }
          }
          return actual.length === shortestLength;
        }
      );
    });
  });

  describe('enumerate', () => {
    it('should return a new Enumerable with pairs of [index, element]', () => {
      expect(new Enumerable(['1', '2']).enumerate().equals([[0, '1'], [1, '2']])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const actual = new Enumerable(xs).enumerate().toArray();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i][1] !== xs[i] || actual[i][0] !== i) {
              return false;
            }
          }
          return actual.length === xs.length;
        }
      );
    });
  });

  describe('where', () => {
    it('should return only items fulfilling the predicate', () => {
      expect(new Enumerable([1, 2, 0]).where(x => x < 2).equals([1, 0])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) =>
          new Enumerable(xs).where(p).equals(xs.filter(p))
      );
    });
  });

  describe('takeWhile', () => {
    it('all elements should fulfil the predicate', () => {
      expect(new Enumerable([1, 2]).takeWhile(x => x < 2).equals([1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) => {
          const actual = new Enumerable(xs).takeWhile(p).toArray();
          return actual.filter(p).length === actual.length;
        }
      );
    });

    it('should stop when encountering an item that does not fulfil the predicate', () => {
      expect(new Enumerable([1, 2, 1]).takeWhile(x => x < 2).equals([1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) => {
          const actual = new Enumerable(xs).takeWhile(p).toArray();
          const tail = xs.slice(actual.length);
          return tail.length === 0 || !p(tail[0]);
        }
      );
    });
  });

  describe('take', () => {
    it('should take n items', () => {
      expect(new Enumerable([1, 2]).take(1).equals([1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], n: number) =>
          new Enumerable(xs).take(n).equals(xs.slice(0, n))
      );
    });
  });

  describe('skipWhile', () => {
    it('should skip while items fulfil the predicate', () => {
      expect(new Enumerable([1, 2]).skipWhile(x => x < 2).equals([2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) => {
          const actual = new Enumerable(xs).skipWhile(p).toArray();
          const skipped = xs.slice(0, xs.length - actual.length);
          return skipped.filter(p).length === skipped.length;
        }
      );
    });

    it('should stop when encountering an item that does not fulfil the predicate', () => {
      expect(new Enumerable([1, 2, 1]).skipWhile(x => x < 2).equals([2, 1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) => {
          const actual = new Enumerable(xs).skipWhile(p).toArray();
          return actual.length === 0 || !p(actual[0]);
        }
      );
    });
  });

  describe('skip', () => {
    it('should skip n items', () => {
      expect(new Enumerable([1, 2]).skip(1).equals([2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], n: number) =>
          new Enumerable(xs).skip(n).equals(xs.slice(n))
      );
    });
  });

  describe('append', () => {
    it('should return a new Enumerable with the items appended', () => {
      expect(new Enumerable([1, 2]).append(3).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], ys: number[]) =>
          new Enumerable(xs).append(...ys).equals(xs.concat(ys))
      );
    });
  });

  describe('prepend', () => {
    it('should return a new Enumerable with the item prepended', () => {
      expect(new Enumerable([1, 2]).prepend(0).equals([0, 1, 2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], y: number) =>
          new Enumerable(xs).prepend(y).equals([y].concat(xs))
      );
    });
  });

  describe('concat', () => {
    it('should return a new Enumerable with the arrays concatenated', () => {
      expect(new Enumerable([1, 2]).concat([3, 4]).equals([1, 2, 3, 4])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.array(jsc.nat)),
        (xs: number[], yss: number[][]) =>
          new Enumerable(xs).concat(...yss).equals(xs.concat(...yss))
      );
    });
  });

  describe('repeat', () => {
    it('should return the given item repeated n times', () => {
      expect(Enumerable.repeat(1, 3).equals([1, 1, 1])).toBeTrue();

      jsc.assertForall(
        jsc.nat, jsc.nat,
        (x: number, n: number) => {
          const actual = Enumerable.repeat(x, n).toArray();
          return actual.length === n && actual.filter(a => a === x).length === actual.length;
        }
      );
    });

    it('should continue forever when not passed count argument', () => {
      jsc.assertForall(
        jsc.nat, jsc.nat,
        (x: number, n: number) => {
          const actual = Enumerable.repeat(x).take(n).toArray();
          return actual.length === n;
        }
      );
    });
  });

  describe('range', () => {
    it('should return the range [0, a) with step size 1 when only given positive end', () => {
      expect(Enumerable.range(3).equals([0, 1, 2])).toBeTrue();

      jsc.assertForall(
        jsc.nat,
        (end: number) => {
          const actual = Enumerable.range(end).toArray();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== i) {
              return false;
            }
          }
          return actual.length === end;
        }
      );
    });

    it('should return the range [0, a) with step size -1 when only given negative end', () => {
      expect(Enumerable.range(-3).equals([0, -1, -2])).toBeTrue();

      jsc.assertForall(
        jsc.nat,
        (end: number) => {
          const actual = Enumerable.range(-end).toArray();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== -i) {
              return false;
            }
          }
          return actual.length === end;
        }
      );
    });

    it('should return the range [a, b) with step size 1 when given start and end where start <= end', () => {
      expect(Enumerable.range(1, 4).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.integer, jsc.integer,
        (a: number, b: number) => {
          const [start, end] = new Enumerable([a, b]).sort();
          const actual = Enumerable.range(start, end).toArray();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== i + start) {
              return false;
            }
          }
          return actual.length === end - start;
        }
      );
    });

    it('should return the range [a, b) with step size -1 when given start and end where start >= end', () => {
      expect(Enumerable.range(1, 4).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.integer, jsc.integer,
        (a: number, b: number) => {
          const [end, start] = new Enumerable([a, b]).sort();
          const actual = Enumerable.range(start, end).toArray();
          for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== -i + start) {
              return false;
            }
          }
          return actual.length === start - end;
        }
      );
    });

    it('should return the range [a, b) with positive step size', () => {
      expect(Enumerable.range(1, 2, 6).equals([1, 3, 5])).toBeTrue();

      jsc.assertForall(
        jsc.pair(jsc.integer, jsc.integer), jsc.suchthat(jsc.nat, x => x !== 0),
        (ab: number[], s: number) => {
          const endPoints = ab.sort((a, b) => a - b);
          const actual = Enumerable.range(endPoints[0], s, endPoints[1]);
          let i = endPoints[0];
          for (const x of actual) {
            if (x !== i || x >= endPoints[1]) {
              return false;
            }
            i += s;
          }
          return true;
        }
      );
    });

    it('should return the range [a, b) with negative step size', () => {
      expect(Enumerable.range(1, -2, -6).equals([1, -1, -3, -5])).toBeTrue();

      jsc.assertForall(
        jsc.pair(jsc.integer, jsc.integer), jsc.suchthat(jsc.nat, x => x !== 0),
        (ab: number[], s: number) => {
          const endPoints = ab.sort((a, b) => b - a);
          const actual = Enumerable.range(endPoints[0], -s, endPoints[1]);
          let i = endPoints[0];
          for (const x of actual) {
            if (x !== i || x <= endPoints[1]) {
              return false;
            }
            i -= s;
          }
          return true;
        }
      );
    });
  });

  describe('quickSort', () => {
    it('should give the same result as Array.sort when sorting in ascending order', () => {
      expect(new Enumerable([2, 1, 3]).quickSort().equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          return new Enumerable(xs).quickSort().equals(xs.sort((a, b) => a - b));
        });
    });

    it('should give the same result as Array.sort when sorting in descending order', () => {
      expect(new Enumerable([2, 1, 3]).quickSort(SortOrder.Descending).equals([3, 2, 1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          return new Enumerable(xs).quickSort(SortOrder.Descending).equals(xs.sort((a, b) => b - a));
        });
    });

    it('should sort in ascending order by the compare function', () => {
      expect(new Enumerable([2, 1, 3]).quickSort((a: number, b: number) => a - b).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const f = (x: number, y: number): number => x - y;
          const sorted = new Enumerable(xs).quickSort(f);
          return sorted.equals(xs.sort(f));
        });
    });

    it('should be lazy', () => {
      let count = 0;
      const f = (x: number, y: number): number => {
        count++;
        return x - y;
      };
      const xs = [2, 4, 0, 3, 1];
      new Enumerable(xs).quickSort(f).take(1).toArray();
      expect(count).toBeLessThan(14); // 14 is the number of comparisons for the full array
    });

    it('should sort in ascending order with pivot selection strategy first', () => {
      expect(new Enumerable([2, 1, 3]).quickSort(x => x, PivotSelectionStrategies.first).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).quickSort(x => x, PivotSelectionStrategies.first);
          return sorted.equals(xs.sort((a, b) => a - b));
        });
    });

    it('should sort in ascending order with pivot selection strategy random', () => {
      expect(new Enumerable([2, 1, 3]).quickSort(x => x, PivotSelectionStrategies.random).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).quickSort(x => x, PivotSelectionStrategies.random);
          return sorted.equals(xs.sort((a, b) => a - b));
        });
    });

    it('should be idempotent', () => {
      const arr = [2, 1, 3];
      expect(new Enumerable(arr).quickSort().quickSort().equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).quickSort();
          return sorted.equals(sorted.quickSort());
        });
    });

    it('should order the array by property in ascending order', () => {
      expect(new Enumerable([-1, 2, 0]).quickSort(x => Math.abs(x)).equals([0, -1, 2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.string, val: jsc.nat })),
        (xs: TestRecord[]) => {
          const sorted: Enumerable<TestRecord> = new Enumerable(xs).quickSort(x => x.val);
          return sorted.equals(xs.sort((a, b) => a.val - b.val));
        });
    });

    it('should order the array by property in descending order', () => {
      expect(new Enumerable([-1, 2, 0]).quickSort(x => Math.abs(x), SortOrder.Descending).equals([2, -1, 0])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.string, val: jsc.nat })),
        (xs: TestRecord[]) => {
          const sorted: Enumerable<TestRecord> = new Enumerable(xs).quickSort(x => x.val, SortOrder.Descending);
          return sorted.equals(xs.sort((a, b) => b.val - a.val));
        });
    });

    it('should be stable', () => {
      expect(
        new Enumerable([['a', 1], ['b', 2], ['c', 2], ['d', 1]]).quickSort(x => x[1]).map(x => x[0]).equals('adbc')).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).enumerate().quickSort(x => x[1]);
          let prev: [number, number] = null;
          for (const x of sorted) {
            if (prev !== null && x[1] === prev[1] && x[0] <= prev[0]) {
              return false;
            }
            prev = x;
          }
          return true;
        });
    });

    it('should be stable when sorting in descending order', () => {
      expect(
        new Enumerable([['a', 1], ['b', 2], ['c', 2], ['d', 1]])
          .quickSort(x => x[1], SortOrder.Descending).map(x => x[0]).equals('bcad')).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).enumerate().quickSort(x => x[1], SortOrder.Descending);
          let prev: [number, number] = null;
          for (const x of sorted) {
            if (prev !== null && x[1] === prev[1] && x[0] <= prev[0]) {
              return false;
            }
            prev = x;
          }
          return true;
        });
    });
  });

  describe('cycle', () => {
    it('should cycle the iterable forever', () => {
      expect(new Enumerable('ab').cycle().take(5).equals('ababa')).toBeTrue();

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.nat,
        (xs: number[], n: number) => {
          const actual = new Enumerable(xs).cycle().take(n);
          let i = 0;
          for (const x of actual) {
            if (x !== xs[i++ % xs.length]) {
              return false;
            }
          }
          return i === n;
        });
    });
  });

  describe('flatMap', () => {
    it('should map and flatten', () => {
      expect(new Enumerable([1, 2, 3]).flatMap(x => [x, x]).equals([1, 1, 2, 2, 3, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.nat)), jsc.fn(jsc.array(jsc.string)),
        (xss: number[][], f: (xs: number[]) => string[]) =>
          new Enumerable(xss).flatMap(f).equals(TestUtils.flatten(xss.map(f)))
      );
    });
  });

  describe('flat', () => {
    it('should leave a 1D Enumerable untouched', () => {
      expect(new Enumerable([1, 2, 3]).flat().equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => new Enumerable(xs).flat().equals(xs));
    });

    it('should leave the Enumerable untouched when passed depth 0', () => {
      expect(new Enumerable([[1, 1], [2, 2], [3, 3]]).flat(0).equals([[1, 1], [2, 2], [3, 3]])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.nat)),
        (xs: number[][]) => new Enumerable(xs).flat(0).equals(xs));
    });

    it('should flatten a 2D Enumerable', () => {
      expect(new Enumerable([[1, 1], [2, 2], [3, 3]]).flat().equals([1, 1, 2, 2, 3, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.nat)),
        (xss: number[][]) => new Enumerable(xss).flat().equals(TestUtils.flatten(xss)));
    });

    it('should flatten a 3D Enumerable', () => {
      expect(new Enumerable([[[1, 1], [2, 2]], [[3, 3], [4, 4]]]).flat().equals([1, 1, 2, 2, 3, 3, 4, 4])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.array(jsc.nat))),
        (xss: number[][][]) => {
          const expected = TestUtils.flatten(TestUtils.flatten(xss));
          return new Enumerable(xss).flat().equals(expected);
        });
    });

    it('should flatten a 3D Enumerable to 2D when passed depth 1', () => {
      expect(new Enumerable([[[1, 1], [2, 2]], [[3, 3], [4, 4]]]).flat(1).equals([[1, 1], [2, 2], [3, 3], [4, 4]])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.array(jsc.array(jsc.nat))),
        (xss: number[][][]) => new Enumerable(xss).flat(1).equals(TestUtils.flatten(xss)));
    });
  });

  describe('join', () => {
    it('should convert all elements to string and concatenate them interspersed with the separator', () => {
      expect(new Enumerable([1, 2, 3]).join(':')).toBe('1:2:3');

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.string,
        (xs: number[], s: string) =>
          new Enumerable(xs).join(s) === xs.join(s)
      );
    });

    it('should convert all elements to string and concatenate them when not passed separator', () => {
      expect(new Enumerable([1, 2, 3]).join()).toBe('123');

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) =>
          new Enumerable(xs).join() === xs.join('')
      );
    });
  });

  describe('groupBy', () => {
    it('should return correct values in original order', () => {
      expect(
        new Enumerable([['a', 1], ['a', 2], ['b', 2]])
          .groupBy(x => x[0])
          .equals([['a', new Enumerable([['a', 1], ['a', 2]])], ['b', new Enumerable([['b', 2]])]]))
        .toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.elements(['a', 'b', 'c']), val: jsc.nat })),
        (xs: Array<{key: string, val: number}>) => {
          const grouped = new Enumerable(xs).groupBy(x => x.key);
          return grouped.all(group => group[1].equals(xs.filter(x => x.key === group[0])));
        });
    });
  });

  describe('distinct', () => {
    it('should return exactly one of each distinct element', () => {
      expect(new Enumerable([1, 2, 2]).distinct().equals([1, 2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const actual = new Enumerable(xs).distinct();
          for (const x of xs) {
            if (actual.count(x) !== 1) {
              return false;
            }
          }
          return true;
        });
    });

    it('should return exactly one of each distinct element by property', () => {
      expect(
        new Enumerable([['a', 1], ['a', 2], ['b', 2]])
          .distinct(x => x[0])
          .equals([['a', 2], ['b', 2]]))
        .toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.char),
        (xs: number[], f: (x: number) => string) => {
          const actual = new Enumerable(xs).distinct(f);
          for (const x of xs) {
            if (actual.count(a => f(a) === f(x)) !== 1) {
              return false;
            }
          }
          return true;
        });
    });
  });

  // I can think of no good way to test this without reimplementing the method itself
  describe('sum', () => {
    it('should return the sum of the elements', () => {
      expect(new Enumerable([]).sum()).toBe(0);
      expect(new Enumerable([1, 2, 3]).sum()).toBe(6);

      jsc.assertForall(
        jsc.array(jsc.number),
        (xs: number[]) => {
          const actual = new Enumerable(xs).sum();
          let expected = new Big(0);
          for (const x of xs) {
            expected = expected.add(x);
          }
          return actual === Number(expected);
        });
    });
  });

  // I can think of no good way to test this without reimplementing the method itself
  describe('bigSum', () => {
    it('should return the sum of the elements', () => {
      expect(new Enumerable([]).bigSum()).toEqual(new Big(0));
      expect(new Enumerable([1, 2, 3]).bigSum()).toEqual(new Big(6));

      jsc.assertForall(
        jsc.array(jsc.number),
        (xs: number[]) => {
          const actual = new Enumerable(xs).map(x => new Big(x)).bigSum();
          let expected = new Big(0);
          for (const x of xs) {
            expected = expected.add(x);
          }
          return actual.eq(expected);
        });
    });
  });

  describe('count', () => {
    it('should return the number of items if invoked without arguments', () => {
      expect(new Enumerable([]).count()).toBe(0);
      expect(new Enumerable([1, 2, 3]).count()).toBe(3);

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) =>
          new Enumerable(xs).count() === xs.length);
    });

    it('should return the number of occurrances of the given item', () => {
      expect(new Enumerable([1, 2, 3, 2]).count(2)).toBe(2);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], c: number) =>
          new Enumerable(xs).count(c) === xs.filter(x => x === c).length);
    });

    it('should return the number of items that fulfil the condition', () => {
      expect(new Enumerable([1, 2, 3, 1]).count(x => x < 2)).toBe(2);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) =>
          new Enumerable(xs).count(p) === xs.filter(x => p(x)).length);
    });
  });

  describe('contains', () => {
    it('should return true iff the Enumerable contains the item', () => {
      expect(new Enumerable([1, 2, 3]).contains(2)).toBeTrue();
      expect(new Enumerable([1, 2, 3]).contains(0)).toBeFalse();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], x: number) =>
          new Enumerable(xs).contains(x) === (xs.indexOf(x) > -1));
    });
  });

  describe('remove', () => {
    it('should remove the first occurrence of the item', () => {
      expect(new Enumerable([1, 2, 3, 2]).remove(2).equals([1, 3, 2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], x: number) => {
          const sut = new Enumerable(xs);
          const actual = sut.remove(x);
          return actual.count(x) === Math.max(0, sut.count(x) - 1);
        });
    });
  });

  describe('replace', () => {
    it('should replace all occurrences of a with b', () => {
      expect(new Enumerable([1, 2, 3, 2]).replace(2, 0).equals([1, 0, 3, 0])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat, jsc.nat,
        (xs: number[], a: number, b: number) => {
          const actual = new Enumerable(xs).replace(a, b);
          return actual.zip(xs, (t, x) => x === a ? t === b : x === t).all(x => x);
        });
    });
  });

  describe('generate', () => {
    it('should generate items with the given function', () => {
      expect(Enumerable.generate(x => 2 * x, 1).take(4).equals([1, 2, 4, 8])).toBeTrue();

      jsc.assertForall(
        jsc.fn(jsc.nat), jsc.nat, jsc.nat,
        (f: (x: number) => number, seed: number, n: number) => {
          const actual = Enumerable.generate(f, seed).take(n + 1);
          const xs = [seed];
          for (let i = 1; i <= n; i++) {
            xs.push(f(xs[i - 1]));
          }
          return actual.equals(xs);
        });
    });

    it('should generate items with the given function accepting index argument', () => {
      expect(Enumerable.generate((x, i) => i * x, 1).take(4).equals([1, 1, 2, 6])).toBeTrue();

      jsc.assertForall(
        jsc.fn(jsc.nat), jsc.nat, jsc.nat,
        (f: (x: number, i: number) => number, seed: number, n: number) => {
          const actual = Enumerable.generate(f, seed).take(n + 1);
          const xs = [seed];
          for (let i = 1; i <= n; i++) {
            xs.push(f(xs[i - 1], i));
          }
          return actual.equals(xs);
        });
    });
  });

  describe('indexOf', () => {
    it('should return the zero-based index of the first occurrence of a, or -1 if a is not in the Enumerable', () => {
      expect(new Enumerable([1, 2, 3, 2]).indexOf(0)).toBe(-1);
      expect(new Enumerable([1, 2, 3, 2]).indexOf(2)).toBe(1);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], a: number) => {
          const actual = new Enumerable(xs).indexOf(a);
          return actual === xs.indexOf(a);
        });
    });

    it('should return the zero-based index of the first occurrence of a, starting search from n, or -1 if a is not in the Enumerable', () => {
      expect(new Enumerable([1, 2, 3, 2]).indexOf(1, 2)).toBe(-1);
      expect(new Enumerable([1, 2, 3, 2]).indexOf(2, 2)).toBe(3);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat, jsc.nat,
        (xs: number[], a: number, n: number) => {
          const actual = new Enumerable(xs).indexOf(a, n);
          return actual === xs.indexOf(a, n);
        });
    });

    it('should return the zero-based index of the first element for which p is true, or -1 if no such element could be found', () => {
      expect(new Enumerable([1, 2, 3, 2]).indexOf(x => x < 0)).toBe(-1);
      expect(new Enumerable([1, 2, -3, -2]).indexOf(x => x < 0)).toBe(2);
      expect(new Enumerable([1, 2, -3, -2]).indexOf(x => x < 0, 3)).toBe(3);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.fn(jsc.bool),
        (xs: number[], p: (x: number) => boolean) => {
          const actual = new Enumerable(xs).indexOf(p);
          return actual === xs.map(p).indexOf(true);
        });
    });
  });

  describe('reverse', () => {
    it('should return the elements in reverse order', () => {
      expect(new Enumerable([1, 2, 3]).reverse().equals([3, 2, 1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          return new Enumerable(Array.from(xs)).reverse().equals(xs.reverse());
        });
    });
  });

  describe('min', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().min()).toThrowError();
    });

    it('should return the smallest element of a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).min()).toBe(1);

      jsc.assertForall(
        jsc.nearray(jsc.nat),
        (xs: number[]) => new Enumerable(xs).min() === Math.min(...xs));
    });

    it('should return the smallest value of a given property of elements in a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).min(x => -x)).toBe(-3);

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.fn(jsc.integer),
        (xs: number[], f: (x: number) => number) =>
          new Enumerable(xs).min(f) === Math.min(...xs.map(f)));
    });
  });

  describe('max', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().max()).toThrowError();
    });

    it('should return the largest element of a non-empty array', () => {
      expect(new Enumerable([2, 3, 1]).max()).toBe(3);

      jsc.assertForall(
        jsc.nearray(jsc.nat),
        (xs: number[]) => new Enumerable(xs).max() === Math.max(...xs));
    });

    it('should return the largest value of a given property of elements in a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).max(x => -x)).toBe(-1);

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.fn(jsc.integer),
        (xs: number[], f: (x: number) => number) =>
          new Enumerable(xs).max(f) === Math.max(...xs.map(f)));
    });
  });

  describe('minBy', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().minBy(x => x)).toThrowError();
    });

    it('should return the element with the smallest value of the property on a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).minBy(x => -x)).toBe(3);
    });

    it('should return the element with the smallest value of the property compared with the compare function on a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).minBy(x => x, (x, y) => y - x)).toBe(3);
    });
  });

  describe('maxBy', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().maxBy(x => x)).toThrowError();
    });

    it('should return the element with the largest value of the property on a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).maxBy(x => -x)).toBe(1);
    });

    it('should return the element with the largest value of the property compared with the compare function on a non-empty array', () => {
      expect(new Enumerable([2, 1, 3]).maxBy(x => x, (x, y) => y - x)).toBe(1);
    });
  });

  describe('average', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().average()).toThrowError();
    });

    it('should return the average of the elements of a non-empty array', () => {
      // in plain JS/TS, (0.1 + 0.2) / 2 will output 0.15000000000000002, due to rounding error
      expect(new Enumerable([0.1, 0.2]).average()).toBe(0.15);

      jsc.assertForall(
        jsc.nearray(jsc.nat),
        (xs: number[]) => new Enumerable(xs).average() === xs.reduce((x, y) => x + y) / xs.length);
    });
  });

  describe('bigAverage', () => {
    it('should throw an error when passed an empty enumerable', () => {
      expect(() => new Enumerable().bigAverage()).toThrowError();
    });

    it('should return the average of the elements of a non-empty array', () => {
      expect(new Enumerable([0.1, 0.2]).bigAverage()).toEqual(new Big(0.15));
    });
  });

  describe('slice', () => {
    it('should throw an error when passed negative arguments', () => {
      expect(() => new Enumerable().slice(-1)).toThrowError();
      expect(() => new Enumerable().slice(-1, -1)).toThrowError();
    });

    it('should behave like Array.slice for nonnegative values of start and end', () => {
      expect(new Enumerable([1, 2, 3]).slice(1, 2).equals([2])).toBeTrue();
      expect(new Enumerable([1, 2, 3]).slice(1, 5).equals([2, 3])).toBeTrue();
      expect(new Enumerable([1, 2, 3]).slice(2, 1).equals([])).toBeTrue();

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.nat, jsc.nat,
        (xs: number[], start: number, end: number) => {
          return new Enumerable(xs).slice(start, end).equals(xs.slice(start, end));
        });
    });
  });

  describe('sort', () => {
    it('should give the same result as Array.sort when sorting in ascending order', () => {
      expect(new Enumerable([2, 1, 3]).sort().equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          return new Enumerable(xs).sort().equals(xs.sort((a, b) => a - b));
        });
    });

    it('should give the same result as Array.sort when sorting in descending order', () => {
      expect(new Enumerable([2, 1, 3]).sort(SortOrder.Descending).equals([3, 2, 1])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          return new Enumerable(xs).sort(SortOrder.Descending).equals(xs.sort((a, b) => b - a));
        });
    });

    it('should sort in ascending order by the compare function', () => {
      expect(new Enumerable([2, 1, 3]).sort((a: number, b: number) => a - b).equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const f = (x: number, y: number): number => x - y;
          const sorted = new Enumerable(xs).sort(f);
          return sorted.equals(xs.sort(f));
        });
    });

    it('should be idempotent', () => {
      const arr = [2, 1, 3];
      expect(new Enumerable(arr).sort().sort().equals([1, 2, 3])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sorted = new Enumerable(xs).sort();
          return sorted.equals(sorted.sort());
        });
    });

    it('should order the array by property in ascending order', () => {
      expect(new Enumerable([-1, 2, 0]).sort(x => Math.abs(x)).equals([0, -1, 2])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.string, val: jsc.nat })),
        (xs: TestRecord[]) => {
          const sorted: Enumerable<TestRecord> = new Enumerable(xs).sort(x => x.val);
          return TestUtils.isSortedAsc(sorted.map(x => x.val));
        });
    });

    it('should order the array by property in descending order', () => {
      expect(new Enumerable([-1, 2, 0]).sort(x => Math.abs(x), SortOrder.Descending).equals([2, -1, 0])).toBeTrue();

      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.string, val: jsc.nat })),
        (xs: TestRecord[]) => {
          const sorted: Enumerable<TestRecord> = new Enumerable(xs).sort(x => x.val, SortOrder.Descending);
          return TestUtils.isSortedDesc(sorted.map(x => x.val));
        });
    });
  });

  describe('overlaps', () => {
    it('should return true iff any element in xs also occurs in ys', () => {
      expect(new Enumerable([]).overlaps([])).toBeFalse();
      expect(new Enumerable([]).overlaps([1, 2])).toBeFalse();
      expect(new Enumerable([1, 2]).overlaps([])).toBeFalse();
      expect(new Enumerable([1, 2]).overlaps([2, 3])).toBeTrue();
      expect(new Enumerable([1, 2]).overlaps([3, 4])).toBeFalse();

      jsc.assertForall(
        jsc.nearray(jsc.nat), jsc.nearray(jsc.nat),
        (xs: number[], ys: number[]) =>
          new Enumerable(xs).overlaps(ys) === xs.some(x => ys.includes(x))
      );
    });
  });

  describe('count (static)', () => {
    it('should count forever from 0 with step size 1 when invoked with no arguments', () => {
      expect(Enumerable.count().take(3).toArray()).toEqual([0, 1, 2]);

      jsc.assertForall(
        jsc.nat,
        (n: number) => {
          const actual = Enumerable.count().take(n);
          let i = 0;
          for (const x of actual) {
            if (x !== i++) {
              return false;
            }
          }
          return true;
        }
      );
    });

    it('should count forever from start with step size 1 when given only start', () => {
      expect(Enumerable.count(0).take(3).toArray()).toEqual([0, 1, 2]);
      expect(Enumerable.count(-1).take(3).toArray()).toEqual([-1, 0, 1]);
      expect(Enumerable.count(1).take(3).toArray()).toEqual([1, 2, 3]);

      jsc.assertForall(
        jsc.integer, jsc.nat,
        (start: number, n: number) => {
          const actual = Enumerable.count(start).take(n);
          let i = start;
          for (const x of actual) {
            if (x !== i++) {
              return false;
            }
          }
          return true;
        }
      );
    });

    it('should count forever from start with given step size when given start and stepSize', () => {
      expect(Enumerable.count(-1, 3).take(3).toArray()).toEqual([-1, 2, 5]);
      expect(Enumerable.count(1, 2).take(3).toArray()).toEqual([1, 3, 5]);
      expect(Enumerable.count(1, -1).take(3).toArray()).toEqual([1, 0, -1]);

      jsc.assertForall(
        jsc.integer, jsc.integer, jsc.nat,
        (start: number, stepSize: number, n: number) => {
          const actual = Enumerable.count(start, stepSize).take(n);
          let i = start;
          for (const x of actual) {
            if (x !== i) {
              return false;
            }
            i += stepSize;
          }
          return true;
        }
      );
    });
  });

  describe('except', () => {
    it('should exclude the given element', () => {
      expect(new Enumerable([1, 2, 3, 2, 3]).except(2).toArray()).toEqual([1, 3, 3]);
      expect(new Enumerable([1, 2, 3]).except(0).toArray()).toEqual([1, 2, 3]);

      jsc.assertForall(
        jsc.array(jsc.string), jsc.string,
        (xs: string[], a: string) =>
          !new Enumerable(xs).except(a).contains(a)
      );
    });

    it('should exclude elements in the given iterable', () => {
      expect(new Enumerable([1, 2, 3, 2, 3]).except([1, 2]).toArray()).toEqual([3, 3]);
      expect(new Enumerable([1, 2, 3]).except([0]).toArray()).toEqual([1, 2, 3]);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], ys: number[]) =>
          !new Enumerable(xs).except(ys).overlaps(ys)
      );
    });
  });

  describe('intersect', () => {
    it('should exclude elements not in the given iterable', () => {
      expect(new Enumerable([1, 2, 3, 2, 3]).intersect([1, 2]).toArray()).toEqual([1, 2, 2]);
      expect(new Enumerable([1, 2, 3]).intersect([0]).toArray()).toEqual([]);

      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], ys: number[]) => {
          const ysSet = new Set(ys);
          return new Enumerable(xs).intersect(ys).all(x => ysSet.has(x));
        }
      );
    });

    it('should not have more elements than the "this" iterable', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], ys: number[]) => {
          const len = new Enumerable(xs).intersect(ys).count();
          return len <= xs.length;
        }
      );
    });
  });

  describe('toCounter', () => {
    it('should have the correct counts of each element', () => {
      expect(new Enumerable().toCounter()).toEqual(new Map<number, number>());
      expect(new Enumerable([1, 2, 3, 2, 3, 3]).toCounter()).toEqual(new Map([[1, 1], [2, 2], [3, 3]]));

      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const xse = new Enumerable(xs);
          return new Enumerable(xse.toCounter()).all(([k, v]) => v === xse.count(k));
        }
      );
    });
  });
});
