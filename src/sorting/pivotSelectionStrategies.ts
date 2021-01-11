import { CompareFunction } from '../types';

/**
 * Contains predefined methods for selecting pivot elements for QuickSort
 */
export class PivotSelectionStrategies {
  /**
   * Selects the median of the first, middle and last elements as the pivot.
   * Runs in expected O(n log n) time also when the iterable may be already sorted,
   * but uses more memory because the whole iterable needs to be stored in an array.
   * Good all-round pivot selection strategy.
   *
   * @param xs the iterable to be sorted
   * @param compareFn the function be used when comparing two elements
   */
  public static medianOfThree<T>(xs: Iterable<T>, compareFn: CompareFunction<T>): T | undefined {
    const arr = PivotSelectionStrategies._asArray(xs);
    if (arr.length === 0) {
      return undefined;
    }
    if (arr.length < 3) {
      return arr[0];
    }
    const first = arr[0];
    const mid = arr[Math.trunc(arr.length / 2)];
    const last = arr[arr.length - 1];
    const fm = compareFn(first, mid);
    const fl = compareFn(first, last);
    const ml = compareFn(mid, last);
    if (fm > 0 && fl > 0) {
      return ml > 0 ? mid : last;
    } else if (fm < 0 && ml > 0) {
      return fl > 0 ? first : last;
    }
    return fm > 0 ? first : mid;
  }

  /**
   * Selects the first element as the pivot.
   * Runs in O(n^2) time on already-sorted iterables, but selection is much faster
   * and uses less memory than median-of-three or random selection.
   * Suitable for iterables that are not expected to be presorted.
   *
   * @param xs the iterable to be sorted
   */
  public static first<T>(xs: Iterable<T>): T | undefined {
    return xs[Symbol.iterator]().next().value;
  }

  /**
   * Selects a random element as the pivot.
   * Runs in expected O(n log n) time, but needs to store the iterable as an array,
   * using more memory. Good all-round pivot selection strategy that behaves similarly
   * to median-of-three selection.
   *
   * @param xs the iterable to be sorted
   */
  public static random<T>(xs: Iterable<T>): T | undefined {
    const arr = PivotSelectionStrategies._asArray(xs);
    if (arr.length === 0) {
      return undefined;
    }
    return arr[Math.floor(Math.random() * (arr.length))];
  }

  private static _asArray<T>(xs: Iterable<T>): T[] {
    return Array.isArray(xs) ? xs as T[] : Array.from(xs);
  }
}
