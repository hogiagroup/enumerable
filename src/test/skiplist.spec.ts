import jsc from 'jsverify';
import { Enumerable } from '../enumerable';
import { SkipList } from '../sorting/skiplist';
import { TestRecord, TestUtils } from './testutils';

describe('SkipList', () => {
  describe('constructor', () => {
    it('should construct a new SkipList with the same number of elements as the array', () => {
      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sut = new SkipList(xs);
          return sut.count === xs.length;
        });
    });

    it('should construct a new SkipList with ordered elements', () => {
      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sut = new SkipList(xs);
          return TestUtils.isSortedAsc(sut);
        });
    });

    it('should construct a new SkipList with elements ordered by a given compare function', () => {
      jsc.assertForall(
        jsc.array(jsc.record({ key: jsc.string, val: jsc.nat })),
        (xs: TestRecord[]) => {
          const sorted = new SkipList(xs, (a, b) => a.val - b.val);
          return sorted.toEnumerable().equals(xs.sort((a, b) => a.val - b.val));
        });
    });
  });

  describe('insert', () => {
    it('should insert the element in the correct place', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], item: number) => {
          const sut = new SkipList(xs);
          sut.insert(item);
          return sut.count === xs.length + 1 && TestUtils.isSortedAsc(sut);
        });
    });

    it('should insert each element in its correct place', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.array(jsc.nat),
        (xs: number[], items: number[]) => {
          const sut = new SkipList(xs);
          sut.insert(...items);
          return sut.count === xs.length + items.length && TestUtils.isSortedAsc(sut);
        });
    });
  });

  describe('contains', () => {
    it('should return true iff the SkipList contains the given element', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], item: number) => {
          const sut = new SkipList(xs);
          return sut.contains(item) === xs.includes(item);
        });
    });
  });

  describe('remove', () => {
    it('should remove the first occurrence of the given element, if present', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], item: number) => {
          const sut = new SkipList(xs);
          sut.remove(item);
          return sut.toEnumerable().count(item) === Math.max(0, new Enumerable(xs).count(item) - 1);
        });
    });
  });
});
