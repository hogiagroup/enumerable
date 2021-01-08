/* eslint-disable @typescript-eslint/unified-signatures */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/naming-convention */
import { Enumerable } from '../enumerable';
import { enumerable } from '../decorators';
import { CompareFunction, PivotSelector } from '../types';

export class QuickSort {
  /**
     * Sorts the given iterable using the provided CompareFunction for comparing elements.
     *
     * @param iterable
     * @param compareFn
     */
  public static sort<T>(xs: Iterable<T>, compareFn: CompareFunction<T>, pivotSelector: PivotSelector<T>): Enumerable<T>;
  @enumerable()
  public static *sort<T>(xs: Iterable<T>, compareFn: CompareFunction<T>, pivotSelector: PivotSelector<T>): Iterable<T> {
    return yield* QuickSort._sort(Array.from(xs), compareFn, pivotSelector);
  }

  private static *_sort<T>(xs: T[], compareFn: CompareFunction<T>, pivotSelector: PivotSelector<T>): Iterable<T> {
    if (xs.length < 32) {
      QuickSort._insertionSort(xs, compareFn);
      return yield* xs;
    }
    const pivot = pivotSelector(xs, compareFn);
    const smaller: T[] = [];
    const equal: T[] = [];
    const greater: T[] = [];
    for (const x of xs) {
      const xp = compareFn(x, pivot);
      if (xp < 0) {
        smaller.push(x);
      } else if (xp > 0) {
        greater.push(x);
      } else {
        equal.push(x);
      }
    }
    yield* QuickSort._sort(smaller, compareFn, pivotSelector);
    yield* equal;
    yield* QuickSort._sort(greater, compareFn, pivotSelector);
  }

  private static _insertionSort<T>(xs: T[], compareFn: CompareFunction<T>): void {
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      let j = i - 1;
      for (; j >= 0 && compareFn(xs[j], x) > 0; j--) {
        xs[j + 1] = xs[j];
      }
      xs[j + 1] = x;
    }
  }
}
