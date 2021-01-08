/* eslint-disable @typescript-eslint/unified-signatures */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/naming-convention */
import { Enumerable } from '../enumerable';
import { Utils } from '../utils';
import { enumerable } from '../decorators';
import { CompareFunction } from '../types';

export class HeapSort {
  /**
     * Sorts the given iterable in ascending order, using the default CompareFunction.
     *
     * @param iterable
     */
  public static sort<T>(iterable: Iterable<T>): Enumerable<T>;
  /**
     * Sorts the given iterable using the provided CompareFunction for comparing elements.
     *
     * @param iterable
     * @param compareFn
     */
  public static sort<T>(iterable: Iterable<T>, compareFn: CompareFunction<T>): Enumerable<T>;
  @enumerable()
  public static *sort<T>(iterable: Iterable<T>, compareFn: CompareFunction<T> = Utils.defaultCompareFn): Iterable<T> {
    const heap = Array.from(iterable);
    if (heap.length < 2) {
      return yield* heap;
    }
    HeapSort._heapify(heap, heap.length, compareFn);

    let end = heap.length - 1;
    while (end > 0) {
      yield heap[0];
      heap[0] = heap[end--];
      HeapSort._siftDown(heap, 0, end, compareFn);
    }
    yield heap[0];
  }

  private static _leafSearch<T>(xs: T[], i: number, end: number, compareFn: CompareFunction<T>): number {
    let j = i;
    let iLeftChild = HeapSort._leftChildIndex(j);
    let iRightChild = iLeftChild + 1;
    while (iRightChild <= end) {
      j = compareFn(xs[iRightChild], xs[iLeftChild]) < 0 ? iRightChild : iLeftChild;
      iLeftChild = HeapSort._leftChildIndex(j);
      iRightChild = iLeftChild + 1;
    }
    return iLeftChild <= end ? HeapSort._leftChildIndex(j) : j;
  }

  private static _heapify<T>(xs: T[], count: number, compareFn: CompareFunction<T>): void {
    const c = count - 1;
    let start = HeapSort._parentIndex(c);
    while (start >= 0) {
      HeapSort._siftDown(xs, start--, c, compareFn);
    }
  }

  private static _siftDown<T>(xs: T[], i: number, end: number, compareFn: CompareFunction<T>): void {
    let j = HeapSort._leafSearch(xs, i, end, compareFn);
    let x = xs[i];
    while (compareFn(x, xs[j]) < 0) {
      j = HeapSort._parentIndex(j);
    }
    [x, xs[j]] = [xs[j], x];
    while (j > i) {
      const iParent = HeapSort._parentIndex(j);
      [x, xs[iParent]] = [xs[iParent], x];
      j = iParent;
    }
  }

  private static _parentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private static _leftChildIndex(index: number): number {
    return 2 * index + 1;
  }
}
