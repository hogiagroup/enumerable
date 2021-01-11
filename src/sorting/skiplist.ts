/* eslint-disable @typescript-eslint/unified-signatures */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/naming-convention */
import { Enumerable } from '../enumerable';
import { Utils } from '../utils';
import { CompareFunction } from '../types';

class Node<T> {
  public next: Array<Node<T>>;
  public value: T;

  public constructor(value: T, level: number) {
    this.value = value;
    this.next = new Array<Node<T>>(level);
  }
}

/**
 * An ordered list, with expected search, insertion and removal complexity in O(log n).
 */
export class SkipList<T> implements Iterable<T> {
  private readonly _maxLevel: number = 33;
  private readonly _head: Node<T | null> = new Node<T | null>(null, this._maxLevel);
  private _nLevels = 1;
  private readonly _compareFn: CompareFunction<T>;
  private _count = 0;

  /**
   * Constructs a new empty SkipList.
   */
  public constructor();
  /**
   * Constructs a new SkipList from the given Iterable.
   *
   * @param iterable
   */
  public constructor(iterable: Iterable<T>);
  /**
   * Constructs a new empty SkipList using the given CompareFunction for
   * comparing elements.
   *
   * @param compareFn
   */
  public constructor(compareFn: CompareFunction<T>);
  /**
   * Constructs a new empty SkipList from the given Iterable,
   * using the given CompareFunction for comparing elements.
   *
   * @param iterable
   * @param compareFn
   */
  public constructor(iterable: Iterable<T>, compareFn: CompareFunction<T>);
  public constructor(...args: any[]) {
    if (args.length === 0) {
      return;
    }
    let iterable: Iterable<T> = [];
    let compareFn: CompareFunction<T> = Utils.defaultCompareFn;
    if (args.length === 2) {
      [iterable, compareFn] = args;
    } else {
      const firstArg = args[0];
      if (firstArg instanceof Function) {
        compareFn = firstArg;
      } else {
        iterable = firstArg;
      }
    }
    this._compareFn = compareFn;
    // using the spread operator here may cause stack overflow
    for (const x of iterable) {
      this.insert(x);
    }
  }

  /**
   * The number of elements in the SkipList.
   */
  public count(): number {
    return this._count;
  }

  /**
   * Returns the SkipList as an Enumerable object.
   */
  public toEnumerable(): Enumerable<T> {
    return new Enumerable(this);
  }

  /**
   * Inserts the given element into the SkipList.
   *
   * @param value the element to be inserted.
   */
  public insert(value: T): void;
  /**
   * Inserts the given elements into the SkipList.
   *
   * @param values the elements to be inserted.
   */
  public insert(...values: T[]): void;
  public insert(...values: T[]): void {
    for (const value of values) {
      this._count++;
      let k = 0;
      // eslint-disable-next-line curly
      for (; k < this._maxLevel && Math.random() < 0.5; k++);

      const level = k < this._nLevels ? k : this._nLevels++;
      const node = new Node<T | null>(value, level);
      let curr = this._head;

      for (let i = this._nLevels - 1; i >= 0; i--) {
        while (curr.next[i] !== undefined && this._compareFn(curr.next[i].value!, value) <= 0) {
          curr = curr.next[i];
        }
        if (i <= level) {
          node.next[i] = curr.next[i];
          curr.next[i] = node;
        }
      }
    }
  }

  /**
   * Checks for occurrence of the provided value.
   *
   * @param value the element to look for.
   * @returns true iff the SkipList contains value.
   */
  public contains(value: T): boolean {
    let curr = this._head;
    for (let i = this._nLevels - 1; i >= 0; i--) {
      while (curr.next[i] !== undefined && this._compareFn(curr.next[i].value!, value) <= 0) {
        if (this._compareFn(curr.next[i].value!, value) === 0) {
          return true;
        }
        curr = curr.next[i];
      }
    }
    return false;
  }

  /**
   * Removes the first occurrence of value.
   *
   * @param value the element to be removed.
   * @returns true iff value was found.
   */
  public remove(value: T): boolean {
    let curr = this._head;
    let found = false;
    for (let i = this._nLevels - 1; i >= 0; i--) {
      for (; curr.next[i] !== undefined; curr = curr.next[i]) {
        if (this._compareFn(curr.next[i].value!, value) === 0) {
          found = true;
          curr.next[i] = curr.next[i].next[i];
          this._count--;
          break;
        }
        if (this._compareFn(curr.next[i].value!, value) > 0) {
          break;
        }
      }
    }
    return found;
  }

  public *[Symbol.iterator](): Iterator<T> {
    let curr = this._head.next[0];
    while (curr !== undefined) {
      yield curr.value!;
      curr = curr.next[0];
    }
  }
}
