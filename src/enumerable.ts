/* eslint-disable no-constant-condition */
// tslint:disable: unified-signatures
// tslint:disable: prefer-for-of
import { Big, BigSource } from 'big.js';
import { PivotSelectionStrategies } from './sorting/pivotSelectionStrategies';
import { Utils } from './utils';
import { SkipList } from './sorting/skiplist';
import { HeapSort } from './sorting/heapsort';
import { QuickSort } from './sorting/quicksort';
import { enumerable, parse } from './decorators';
import { Predicate, MapFunction, CompareFunction, PivotSelector } from './types';

export enum SortOrder {
  Ascending,
  Descending
}

export class Enumerable<T> implements Iterable<T> {
  /**
   * Repeats x forever.
   * @param x
   */
  public static repeat<T>(x: T): Enumerable<T>;
  /**
   * Repeats x n times.
   * @param x
   * @param n
   */
  public static repeat<T>(x: T, n: number): Enumerable<T>;
  @enumerable()
  public static *repeat<T>(x: T, n?: number): Iterable<T> {
    for (let i = 0; n === undefined || i < n; i++) {
      yield x;
    }
  }

  /**
   * Counts up from 0 to infinity with step size 1.
   */
  public static count(): Enumerable<number>;
  /**
   * Counts up from start to infinity with step size 1.
   * @param start
   */
  public static count(start: number): Enumerable<number>;
  /**
   * Counts up from start to infinity with the given step size.
   * @param start
   * @param stepSize
   */
  public static count(start: number, stepSize: number): Enumerable<number>;
  @enumerable()
  public static *count(start = 0, stepSize = 1): Iterable<number> {
    for (let k = start; true; k += stepSize) {
      yield k;
    }
  }

  /**
   * Counts up from 0 to stop (exclusive): [0, 1, ... , stop - 1].
   * @param stop
   */
  public static range(stop: number): Enumerable<number>;
  /**
   * Counts from start to stop (exclusive) with step size 1:
   * [start, start + stepSize, start + 2 * stepSize, ...] where |x_i| < |stop|
   * @param start
   * @param stop
   * @throws Error if stepSize is 0
   */
  public static range(start: number, stop: number): Enumerable<number>;
  /**
   * Counts from start to stop (exclusive) with the given step size:
   * [start, start + stepSize, start + 2 * stepSize, ...] where |x_i| < |stop|
   * @param start
   * @param stepSize
   * @param stop
   * @throws Error if stepSize is 0
   * @throws RangeError if stepSize indicates the opposite direction of stop from start.
   */
  public static range(start: number, stepSize: number, stop: number): Enumerable<number>;
  @parse((_this: never, ...args: number[]) => {
    let start = 0;
    let stepSize: number | null = null;
    let end: number;
    if (args.length === 1) {
      [end] = args;
    } else if (args.length === 2) {
      [start, end] = args;
    } else {
      [start, stepSize, end] = args;
    }
    const sign = Math.sign(end - start);
    if (stepSize === null) {
      stepSize = sign;
    }
    return [start, stepSize, end, sign];
  })
  @enumerable((start: number, stepSize: number, end: number, sign: number) => {
    if (sign !== 0) {
      if (sign !== Math.sign(stepSize)) {
        throw new RangeError(`invalid range (${start}, ${end}) with step size ${stepSize}`);
      } else if (stepSize === 0) {
        throw new Error('stepSize cannot be 0');
      }
    }
    return true;
  })
  public static *range(...args: number[]): Iterable<number> {
    const [start, stepSize, end, sign] = args;
    const criterion = sign > 0 ? (i: number) => i < end : (i: number) => i > end;
    for (let i = start; criterion(i); i += stepSize) {
      yield i;
    }
  }

  /**
   * Generates an infinite series by recursively applying a generating function to a seed value:
   * x_0 = seed,
   * x_n = generatingFunction(x_(n-1)) for n > 0.
   * @param generatingFunction
   * @param seed the first item in the Enumerable
   */
  public static generate<T>(generatingFunction: (previous: T, index?: number) => T, seed: T): Enumerable<T>;
  @enumerable()
  public static *generate<T>(generatingFunction: (previous: T, index?: number) => T, seed: T): Iterable<T> {
    yield seed;
    let v = seed;
    for (let i = 1; true; i++) {
      v = generatingFunction(v, i);
      yield v;
    }
  }

  private static readonly _emptyError: Error = new Error('enumerable is empty');
  private static readonly _outOfRangeError: RangeError = new RangeError('index out of range');

  private _source: Iterable<T>;

  constructor();
  constructor(source: Iterable<T>);
  constructor(source: Iterable<T> = []) {
    this._source = source;
  }

  public [Symbol.iterator](): Iterator<T> {
    return this._source[Symbol.iterator]();
  }

  /**
   * Returns the element at index.
   * Time: O(1) if this Enumerable directly wraps an array, else O(index).
   * Space: O(1).
   * @param index
   * @throws RangeError if index is out of range
   */
  public elementAt(index: number): T {
    if (index < 0) {
      throw Enumerable._outOfRangeError;
    }
    if (Array.isArray(this._source)) {
      if (index < this._source.length) {
        return this._source[index];
      }
      throw Enumerable._outOfRangeError;
    }
    for (const x of this.enumerate()) {
      if (x[0] === index) {
        return x[1];
      }
    }
    throw Enumerable._outOfRangeError;
  }

  /**
   * Returns the section of the Enumerable starting from index start.
   * Time: O(1) if this Enumerable directly wraps an array, else O(start).
   * Space: O(1).
   * @param start (nonnegative integer) the beginning (inclusive) of the specified portion of the Enumerable.
   * @returns a new, possibly empty, Enumerable xs' such that
   * xs' = [x_start, x_(start + 1), ...].
   * @throws RangeError if start is negative.
   */
  public slice(start: number): this;
  /**
   * Returns a section of the Enumerable.
   * Time: O(1) if this Enumerable directly wraps an array, else O(start).
   * Space: O(1).
   * @param start (nonnegative integer) the beginning (inclusive) of the specified portion of the Enumerable.
   * @param end (nonnegative integer) the end (exclusive) of the specified portion of the Enumerable.
   * @returns a new, possibly empty, Enumerable xs' such that
   * xs' = [x_start, x_(start + 1), ... , x_(end - 1)].
   * @throws RangeError if start or end are negative.
   */
  public slice(start: number, end: number): this;
  @enumerable<T>((start: number, end: number) => {
    if (start < 0 || end !== undefined && end < 0) {
      throw Enumerable._outOfRangeError;
    }
    return true;
  })
  public *slice(start = 0, end?: number): Iterable<T> {
    if (Array.isArray(this._source)) {
      return yield* this._source.slice(start, end);
    }
    const iterator = this.skip(start)[Symbol.iterator]();
    try {
      if (end === undefined) {
        return yield* Utils.exhaustIterator(iterator);
      }
      for (let i = start; end === undefined || i < end; i++) {
        const x = iterator.next();
        if (x.done) {
          return;
        }
        yield x.value;
      }
    } finally {
      Utils.disposeIterator(iterator);
    }
  }

  /**
   * Returns each element x along with its zero-based index i: [i, x_i].
   */
  public enumerate(): Enumerable<[number, T]>;
  /**
   * Returns each element x along with its index i, with numbering starting from startIndex: [i, x_i].
   * @param startIndex
   */
  public enumerate(startIndex: number): Enumerable<[number, T]>;
  @enumerable<T>()
  public *enumerate(startIndex = 0): Iterable<[number, T]> {
    let i = startIndex;
    for (const x of this) {
      yield [i++, x];
    }
  }

  /**
   * Returns only elements that fulfil the predicate p.
   * @param p
   */
  public where(p: Predicate<T>): this;
  @enumerable<T>()
  public *where(p: Predicate<T>): Iterable<T> {
    for (const x of this) {
      if (p(x)) {
        yield x;
      }
    }
  }

  /**
   * Takes this and another iterable and returns a new iterable of corresponding pairs of elements.
   * If the iterables are of different length, excess elements of the longer iterable are discarded.
   * @param iterable the other iterable to zip with
   */
  public zip<U>(iterable: Iterable<U>): Enumerable<[T, U]>;
  /**
   * Zips this and another iterable with a joining function.
   * If the iterables are of different length, excess elements of the longer iterable are discarded.
   * @param iterable
   * @param f
   */
  public zip<U, V>(iterable: Iterable<U>, f: (t: T, u: U) => V): Enumerable<V>;
  @enumerable<T>()
  public *zip<U, V>(iterable: Iterable<U>, f?: (t: T, u: U) => V): Iterable<V | [T, U]> {
    if (f === undefined) {
      return yield* this.zip(iterable, (t, u) => [t, u] as [T, U]);
    }
    const iterator = iterable[Symbol.iterator]();
    try {
      for (const x of this) {
        const y = iterator.next();
        if (y.done) {
          return;
        }
        yield f(x, y.value);
      }
    } finally {
      Utils.disposeIterator(iterator);
    }
  }

  /**
   * Returns the longest contiguous prefix that fulfils the given predicate.
   * @param p
   */
  public takeWhile(p: Predicate<T>): this;
  @enumerable<T>()
  public *takeWhile(p: Predicate<T>): Iterable<T> {
    for (const x of this) {
      if (!p(x)) {
        return;
      }
      yield x;
    }
  }

  /**
   * Returns the first n elements.
   * @param n
   */
  public take(n: number): this;
  @enumerable<T>()
  public *take(n: number): Iterable<T> {
    let i = 1;
    for (const x of this) {
      if (i++ > n) {
        return;
      }
      yield x;
    }
  }

  /**
   * Skips the longest contiguous prefix that fulfils the given predicate,
   * returning the remainder of the Enumerable.
   * @param p
   */
  public skipWhile(p: Predicate<T>): this;
  @enumerable<T>()
  public *skipWhile(p: Predicate<T>): Iterable<T> {
    const iterator = this[Symbol.iterator]();
    try {
      while (true) {
        const x = iterator.next();
        if (x.done) {
          return;
        }
        if (!p(x.value)) {
          yield x.value;
          break;
        }
      }
      yield* Utils.exhaustIterator(iterator);
    } finally {
      Utils.disposeIterator(iterator);
    }
  }

  /**
   * Skips the first n elements, returning the remainder of the Enumerable.
   * @param n
   */
  public skip(n: number): this;
  @enumerable<T>()
  public *skip(n: number): Iterable<T> {
    let i = 0;
    for (const x of this) {
      if (i++ < n) {
        continue;
      }
      yield x;
    }
  }

  /**
   * Returns a new Enumerable with the given item appended.
   * Warning: the number of elements that can be appended
   * without incurring stack overflow is dependent on the engine's
   * maximum recursion depth. If this is a problem, consider
   * using an array instead and wrapping the array in a new
   * Enumerable whenever necessary.
   * Time: O(1)
   * @param item
   */
  public append(item: T): this;
  /**
   * Returns a new Enumerable with the given items appended.
   * Warning: the number of elements that can be appended
   * without incurring stack overflow is dependent on the engine's
   * maximum recursion depth. If this is a problem, consider
   * using an array instead and wrapping the array in a new
   * Enumerable whenever necessary.
   * Time: O(1)
   * @param items
   */
  public append(...items: T[]): this;
  @enumerable<T>()
  public *append(...items: T[]): Iterable<T> {
    yield* this;
    yield* items;
  }

  /**
   * Returns a new Enumerable with the given item prepended.
   * Warning: the number of elements that can be prepended
   * without incurring stack overflow is dependent on the engine's
   * maximum recursion depth. If this is a problem, consider
   * using an array instead and wrapping the array in a new
   * Enumerable whenever necessary.
   * Time: O(1)
   */
  public prepend(item: T): this;
  /**
   * Returns a new Enumerable with the given items prepended.
   * Warning: the number of elements that can be prepended
   * without incurring stack overflow is dependent on the engine's
   * maximum recursion depth. If this is a problem, consider
   * using an array instead and wrapping the array in a new
   * Enumerable whenever necessary.
   * Time: O(1)
   * @param items
   */
  public prepend(...items: T[]): this;
  @enumerable<T>()
  public *prepend(...items: T[]): Iterable<T> {
    yield* items;
    yield* this;
  }

  /**
   * Returns a new Enumerable with the first occurrence of item removed.
   * @param item the element to be removed
   */
  public remove(item: T): this;
  @enumerable<T>()
  public *remove(item: T): Iterable<T> {
    const iterator = this[Symbol.iterator]();
    try {
      while (true) {
        const x = iterator.next();
        if (x.done) {
          return;
        }
        if (x.value === item) {
          break;
        }
        yield x.value;
      }
      yield* Utils.exhaustIterator(iterator);
    } finally {
      Utils.disposeIterator(iterator);
    }
  }

  /**
   * Returns a new Enumerable with all occurrences of a replaced with b.
   * @param a the element to be replaced
   * @param b the new element
   */
  public replace(a: T, b: T): this;
  @enumerable<T>()
  public *replace(a: T, b: T): Iterable<T> {
    for (const x of this) {
      yield x === a ? b : x;
    }
  }

  /**
   * Returns only distinct elements.
   */
  public distinct(): this;
  /**
   * Returns only elements with distinct values of the property indicated by propertySelector.
   * The last occurrence of each set of identical values will be returned.
   * @param propertySelector
   */
  public distinct<U>(propertySelector: MapFunction<T, U>): this;
  @enumerable<T>()
  public *distinct<U>(propertySelector?: MapFunction<T, U>): Iterable<T> {
    if (!propertySelector) {
      return yield* this.toSet();
    }
    yield* new Enumerable(this.toMap(propertySelector)).map(kv => kv[1]);
  }

  /**
   * Returns a new Enumerable with all occurrences of item removed.
   */
  public except(item: T): this;
  /**
   * Returns a new Enumerable without any of the elements in the given Iterable.
   * @param iterable
   */
  public except(iterable: Iterable<T>): this;
  @parse((_thisRef: Enumerable<T>, itemOrIterable: T | Iterable<T>) => {
    if (!Utils.isIterable(itemOrIterable)) {
      return [(x: T) => x !== itemOrIterable];
    }
    const set = new Set(itemOrIterable as Iterable<T>);
    return [(x: T) => !set.has(x)];
  })
  @enumerable<T>()
  public *except(includeCondition: unknown): Iterable<T> {
    yield* this.where(includeCondition as Predicate<T>);
  }

  /**
   * Returns true iff any element from the given Iterable occurs in this Enumerable.
   * Time/space: O(n)
   * @param iterable
   */
  public overlaps(iterable: Iterable<T>): boolean {
    const set = new Set(iterable);
    return set.size > 0 && this.some(x => set.has(x));
  }

  /**
   * Groups the elements by the given key.
   * Time/space: O(n)
   * @param keySelector
   */
  public groupBy<K>(keySelector: MapFunction<T, K>): Enumerable<[K, this]>;
  @enumerable<T>()
  public *groupBy<K>(keySelector: MapFunction<T, K>): Iterable<[K, Enumerable<T>]> {
    const map = new Map<K, T[]>();
    for (const x of this) {
      const key = keySelector(x);
      const values = map.get(key) ?? [];
      values.push(x);
      map.set(key, values);
    }
    yield* new Enumerable(map).toMap(x => x[0], x => new Enumerable(x[1]));
  }

  /**
   * Concatenates this Enumerable with the given Iterables.
   * @param iterables
   */
  public concat(...iterables: Array<Iterable<T>>): this;
  @enumerable<T>()
  public *concat(...iterables: Array<Iterable<T>>): Iterable<T> {
    yield* this;
    for (let i = 0; i < iterables.length; i++) {
      yield* iterables[i];
    }
  }

  /**
   * Returns string representations of the elements, joined without separator into a new string.
   * Time: O(n), space: O(n)
   */
  public join(): string;
  /**
   * Returns string representations of the elements, separated by separator and joined into a new string.
   * @param separator
   */
  public join(separator: string): string;
  public join(separator = ''): string {
    let s = '';
    const iterator = this[Symbol.iterator]();
    try {
      let x = iterator.next();
      if (x.done) {
        return s;
      }
      while (true) {
        s += x.value;
        x = iterator.next();
        if (x.done) {
          return s;
        }
        s += separator;
      }
    } finally {
      Utils.disposeIterator(iterator);
    }
  }

  /**
   * Returns true iff this Enumerable is deeply equivalent to the given Iterable,
   * comparing Iterable elements recursively.
   * Time: O(min(m, n)), where m is the total length of this flattened Enumerable, and n is the
   * total length of the flattened Iterable argument.
   * Space: O(min(c, d)), where c is the depth of nested Iterables in this Enumerable, and d is
   * the depth of the Iterable argument.
   * @param iterable
   */
  public equals(iterable: Iterable<T>): boolean {
    if (iterable === undefined || iterable === null) {
      return false;
    }
    const iterator = iterable[Symbol.iterator]();
    const thisIterator = this[Symbol.iterator]();
    try {
      while (true) {
        const x = thisIterator.next();
        const y = iterator.next();
        if (x.done || y.done) {
          return !!x.done && !!y.done;
        }
        if (x.value === y.value ||
          Utils.isIterable(x.value) && Utils.isIterable(y.value) &&
          new Enumerable(x.value as unknown as Iterable<unknown>).equals(y.value as unknown as Iterable<unknown>)) {
          continue;
        }
        return false;
      }
    } finally {
      Utils.disposeIterator(iterator);
      Utils.disposeIterator(thisIterator);
    }
  }

  /**
   * Returns true iff all elements fulfil the predicate p.
   * Time: O(n), space: O(1)
   * @param p
   */
  public all(p: Predicate<T>): boolean {
    return !this.some(x => !p(x));
  }

  /**
   * Returns true iff the Enumerable is nonempty.
   * Time: O(n), space: O(1)
   */
  public some(): boolean;
  /**
   * Returns true iff any element fulfils the predicate p.
   * Time: O(n), space: O(1)
   * @param p
   */
  public some(p: Predicate<T>): boolean;
  public some(p: Predicate<T> = _ => true): boolean {
    for (const x of this) {
      if (p(x)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns a new Enumerable with each element transformed by the given function.
   * @param f
   */
  public map<U>(f: MapFunction<T, U>): Enumerable<U>;
  @enumerable<T>()
  public *map<U>(f: MapFunction<T, U>): Iterable<U> {
    for (const x of this) {
      yield f(x);
    }
  }

  /**
   * Applies the given function to each element.
   * @param f
   */
  public forEach(f: (x: T) => void): void {
    for (const x of this) {
      f(x);
    }
  }

  /**
   * Returns this Enumerable as an Array.
   */
  public toArray(): T[] {
    return Array.from(this._source);
  }

  /**
   * Returns this Enumerable as a Set.
   */
  public toSet(): Set<T> {
    return new Set(this);
  }

  /**
   * Returns this Enumerable as an ordered list, implemented as a SkipList.
   */
  public toSkipList(): SkipList<T>;
  /**
   * Returns this Enumerable as an ordered list, implemented as a SkipList, comparing elements
   * using compareFn.
   * @param compareFn
   */
  public toSkipList(compareFn: CompareFunction<T>): SkipList<T>;
  public toSkipList(compareFn: CompareFunction<T> = Utils.defaultCompareFn): SkipList<T> {
    return new SkipList(this, compareFn);
  }

  /**
   * Returns a new Map with the keys extracted by keySelector and the elements themselves as values.
   * @param keySelector
   */
  public toMap<K>(keySelector: (x: T) => K): Map<K, T>;
  /**
   * Returns a new Map with the keys and values extracted by keySelector and valueSelector, respectively.
   * @param keySelector
   * @param valueSelector
   */
  public toMap<K, V>(keySelector: (x: T) => K, valueSelector: (x: T) => V): Map<K, V>;
  public toMap<K, V>(keySelector: (x: T) => K, valueSelector: (x: T) => V | T = Utils.id): Map<K, V | T> {
    return new Map(this.map(x => [keySelector(x), valueSelector(x)] as Readonly<[K, T | V]>));
  }

  /**
   * Returns the first element in the Enumerable.
   * @throws Error if the Enumerable is empty
   */
  public first(): T;
  /**
   * Returns the first element in the Enumerable, or defaultValue if the Enumerable is empty.
   * @param defaultValue
   */
  public first(defaultValue: T): T;
  /**
   * Returns the first element that fulfils the predicate p.
   * @param p
   * @throws Error if no element fulfils the predicate
   */
  public first(p: Predicate<T>): T;
  /**
   * Returns the first element that fulfils the predicate p, or defaultValue if no such element was found.
   * @param defaultValue
   * @param p
   */
  public first(p: Predicate<T>, defaultValue: T): T;
  @parse((_this: never, ...args: any[]) => {
    let p = (_: T) => true as const;
    let defaultValue: T | undefined;
    if (args.length === 2) {
      [p, defaultValue] = args;
    } else if (args.length === 1) {
      const firstArg = args[0];
      if (firstArg instanceof Function) {
        p = firstArg;
      } else {
        defaultValue = firstArg;
      }
    }
    return [p, defaultValue];
  })
  public first(...args: any[]): T {
    const [p, defaultValue] = args;
    for (const x of this) {
      if (p(x)) {
        return x;
      }
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error('no matching element found');
  }

  /**
   * Returns the last element in the Enumerable.
   * Time O(n), space O(1).
   * @throws Error if the Enumerable is empty
   */
  public last(): T;
  /**
   * Returns the last element in the Enumerable, or defaultValue if the Enumerable is empty.
   * @param defaultValue
   */
  public last(defaultValue: T): T;
  /**
   * Returns the last element that fulfils the predicate p.
   * Time O(n), space O(1).
   * @param p
   * @throws Error if no element fulfils the predicate
   */
  public last(p: Predicate<T>): T;
  /**
   * Returns the last element that fulfils the predicate p, or defaultValue if no such element was found.
   * @param defaultValue
   * @param p
   */
  public last(p: Predicate<T>, defaultValue: T): T;
  @parse((_this: never, ...args: any[]) => {
    let p = (_: T) => true as const;
    let defaultValue: T | undefined;
    if (args.length === 2) {
      [p, defaultValue] = args;
    } else if (args.length === 1) {
      const firstArg = args[0];
      if (firstArg instanceof Function) {
        p = firstArg;
      } else {
        defaultValue = firstArg;
      }
    }
    return [p, defaultValue];
  })
  public last(...args: any[]): T {
    const [p, defaultValue] = args;
    let lastFound;
    for (const x of this) {
      if (p(x)) {
        lastFound = x;
      }
    }
    if (lastFound !== undefined) {
      return lastFound;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw Enumerable._outOfRangeError;
  }

  /**
   * Returns true iff the Enumerable contains the given item.
   * @param item
   */
  public contains(item: T): boolean {
    return this.some(x => x === item);
  }

  /**
   * Returns the number of elements in the Enumerable.
   * Warning: if the directly underlying Iterable is not an Array, a Set, or a Map,
   * this method will iterate over the full Enumerable. If the Enumerable has infinitely many
   * elements, this method will never terminate.
   */
  public count(): number;
  /**
   * Returns the number of occurrences of the given item.
   * @param item
   */
  public count(item: T): number;
  /**
   * Returns the number of elements that fulfil the given property.
   * @param property
   */
  public count(property: Predicate<T>): number;
  @parse((_this: never, ...args: any[]) => {
    const [itemOrProperty] = args;
    const property: Predicate<T> = itemOrProperty instanceof Function ?
      itemOrProperty as Predicate<T> :
      itemOrProperty === undefined ?
        (_ => true) :
        (x => x === itemOrProperty);
    return [property];
  })
  public count(...args: any[]): number {
    if (args.length === 0) {
      if (Array.isArray(this._source)) {
        return this._source.length;
      }
      if (this._source instanceof Map) {
        return this._source.size;
      }
      if (this._source instanceof Set) {
        return this._source.size;
      }
      if (this._source instanceof SkipList) {
        return this._source.count();
      }
    }
    const [property] = args;
    let count = 0;
    for (const x of this) {
      if (property(x)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Applies the function f to an accumulated value y_(k-1) and each element x_k of the Enumerable,
   * using the first element x_0 as the initial value, and returning the final accumulated value y_n:
   * return y_n, where y_0 = x_0, y_k = f(y_(k-1), x_k).
   * @param f
   * @throws Error if the Enumerable is empty
   */
  public reduce(f: (previous: T, current: T) => T): T;
  /**
   * Applies the function f to an accumulated value y_(k-1) and each element x_k of the Enumerable,
   * using the provided initial value, and returning the final accumulated value y_n:
   * return y_n, where y_0 = initial, y_k = f(y_(k-1), x_k).
   * @param f
   * @param initial
   */
  public reduce<U>(f: (previous: U, current: T) => U, initial: U): U;
  public reduce<U>(f: (previous: U | T, current: T) => U | T, initial?: U | T): U | T {
    if (initial === undefined) {
      try {
        return this.skip(1).reduce(f, this.first());
      } catch (e) {
        throw Enumerable._emptyError;
      }
    }
    let acc = initial;
    for (const x of this) {
      acc = f(acc, x);
    }
    return acc;
  }

  /**
   * Lazily sorts the Enumerable by the value of the elements.
   * @param sortOrder defaults to Ascending
   */
  public quickSort(sortOrder?: SortOrder): this;
  /**
   * Lazily sorts the Enumerable by the value of some property extracted from each element.
   * @param propertySelector
   * @param sortOrder defaults to Ascending
   */
  public quickSort<U>(propertySelector: MapFunction<T, U>, sortOrder?: SortOrder): this;
  /**
   * Lazily sorts the Enumerable by the value of the extracted property,
   * using the given pivot selection strategy.
   * @param propertySelector
   * @param pivotSelector
   * @param sortOrder defaults to Ascending
   */
  public quickSort<U>(
    propertySelector: MapFunction<T, U>,
    pivotSelector: PivotSelector<T>,
    sortOrder?: SortOrder): this;
  /**
   * Lazily sorts the Enumerable using the provided function to compare elements.
   * @param compareFn
   */
  public quickSort(compareFn: CompareFunction<T>): this;
  /**
   * Lazily sorts the Enumerable using the provided compare function and pivot selection strategy.
   * @param compareFn
   * @param pivotSelector
   */
  public quickSort(compareFn: CompareFunction<T>, pivotSelector: PivotSelector<T>): this;
  @parse((_this: never, ...args: any[]) => {
    const lastArg = args[args.length - 1] as number;
    const compare: CompareFunction<unknown> = lastArg === SortOrder.Descending ?
      (x, y) => Utils.defaultCompareFn(y, x) :
      Utils.defaultCompareFn;
    const [f, pivotSelector] = args.slice(0, lastArg in SortOrder ? args.length - 1 : args.length);
    let compareFn: CompareFunction<T>;
    if (f === undefined) {
      compareFn = compare;
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-types
      if ((f as Function).length === 2) { // f takes two arguments and is a CompareFunction
        compareFn = f as CompareFunction<T>;
      } else {
        const propertySelector = f as MapFunction<T, unknown>;
        compareFn = (x: T, y: T) => {
          const xVal = propertySelector(x);
          const yVal = propertySelector(y);
          return compare(xVal, yVal);
        };
      }
    }
    return [compareFn, pivotSelector];
  })
  @enumerable<T>()
  public *quickSort(...args: any[]): Iterable<T> {
    const [compareFn, pivotSelector] = args;
    return yield* QuickSort.sort(this, compareFn as CompareFunction<T>, pivotSelector as PivotSelector<T> || PivotSelectionStrategies.medianOfThree);
  }

  /**
   * Lazily sorts the Enumerable by the value of the elements.
   * This method is implemented using HeapSort, an unstable sorting algorithm.
   * If stable sorting is desired, use quickSort; to obtain a persistently sorted
   * data structure, use toSkipList.
   * @param sortOrder defaults to Ascending
   */
  public sort(sortOrder?: SortOrder): this;
  /**
   * Lazily sorts the Enumerable by the value of some property extracted from each element.
   * This method is implemented using HeapSort, an unstable sorting algorithm.
   * If stable sorting is desired, use quickSort; to obtain a persistently sorted
   * data structure, use toSkipList.
   * @param propertySelector
   * @param sortOrder defaults to Ascending
   */
  public sort<U>(propertySelector: MapFunction<T, U>, sortOrder?: SortOrder): this;
  /**
   * Lazily sorts the Enumerable using the provided function to compare elements.
   * This method is implemented using HeapSort, an unstable sorting algorithm.
   * If stable sorting is desired, use quickSort; to obtain a persistently sorted
   * data structure, use toSkipList.
   * @param compareFn
   */
  public sort(compareFn: CompareFunction<T>): this;
  @parse((_thisRef: Enumerable<T>, ...args: any[]) => {
    const lastArg = args[args.length - 1];
    const compare: CompareFunction<unknown> = lastArg === SortOrder.Descending ?
      (a, b) => Utils.defaultCompareFn(b, a) :
      Utils.defaultCompareFn;
    let compareFn: CompareFunction<T> | undefined;
    if (args.length > 0) {
      const firstArg = args[0];
      if (firstArg instanceof Function) {
        compareFn = firstArg.length === 2 ?
          firstArg as CompareFunction<T> :
          (a, b) => compare(firstArg(a), firstArg(b));
      }
    }
    return [compareFn ?? compare];
  })
  @enumerable<T>()
  public *sort(...args: any[]): Iterable<T> {
    const [compareFn] = args;
    return yield* HeapSort.sort(this, compareFn as CompareFunction<T>);
  }

  /**
   * Cycles the Enumerable forever.
   */
  public cycle(): this;
  @enumerable<T>()
  public *cycle(): Iterable<T> {
    while (true) {
      yield* this;
    }
  }

  /**
   * Returns the numeric sum of the elements.
   */
  public sum(): number;
  /**
   * Sums the indicated property over all elements.
   * @param propertySelector
   */
  public sum(propertySelector: (element: T) => BigSource): number;
  public sum(propertySelector?: (element: T) => BigSource): number {
    return Number(propertySelector ? this.bigSum(propertySelector) : this.bigSum());
  }

  /**
   * Returns the sum of the elements as a Big object.
   */
  public bigSum(): Big;
  /**
   * Sums the indicated property over all elements, returning the result as a Big object.
   * @param propertySelector
   */
  public bigSum(propertySelector: (element: T) => BigSource): Big;
  public bigSum(propertySelector?: (element: T) => BigSource): Big {
    const selector = propertySelector || (Utils.id as () => BigSource);
    return this.reduce(
      (prev, curr) => prev.plus(selector(curr)),
      new Big(0));
  }

  /**
   * Returns the numeric average of the elements.
   * @throws Error if the Enumerable is empty.
   */
  public average(): number;
  /**
   * Returns the average of the indicated property over all elements.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public average(propertySelector: (element: T) => BigSource): number;
  public average(propertySelector?: (element: T) => BigSource): number {
    return Number(propertySelector ? this.bigAverage(propertySelector) : this.bigAverage());
  }

  /**
   * Returns the average of the elements as a Big object.
   * @throws Error if the Enumerable is empty.
   */
  public bigAverage(): Big;
  /**
   * Computes the average of the indicated property over all elements, returning the result as a Big object.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public bigAverage(propertySelector: (element: T) => BigSource): Big;
  public bigAverage(propertySelector: (element: T) => BigSource = (Utils.id as () => BigSource)): Big {
    let n = 0;
    const sum = this.reduce(
      (prev, curr) => {
        n++;
        return prev.plus(propertySelector(curr));
      }, new Big(0));
    if (n > 0) {
      return sum.div(n);
    }
    throw Enumerable._emptyError;
  }

  /**
   * Maps the function f over all elements and flattens the results.
   * @param f
   */
  public flatMap<U>(f: (x: T) => Iterable<U>): Enumerable<U>;
  @enumerable<T>()
  public *flatMap<U>(f: (x: T) => Iterable<U>): Iterable<U> {
    for (const x of this) {
      yield* f(x);
    }
  }

  /**
   * Returns the elements in reverse order.
   * Time and space complexity O(n).
   */
  public reverse(): this;
  @enumerable<T>()
  public *reverse(): Iterable<T> {
    // for some inexplicable reason, this stack-based implementation appears to be the fastest possible
    const xs = [];
    for (const x of this) {
      xs.push(x);
    }
    while (true) {
      const x = xs.pop();
      if (x === undefined) {
        break;
      }
      yield x;
    }
  }

  /**
   * Flattens the Enumerable, recursively flattening Iterable elements.
   */
  public flat(): Enumerable<unknown>;
  /**
   * Flattens the Enumerable, recursively flattening Iterable elements down to the given depth.
   * @param depth
   */
  public flat(depth: number): Enumerable<unknown>;
  public flat<U>(this: Enumerable<Iterable<U>>, depth: 1): Enumerable<U>;
  public flat(depth: 0): this;
  @enumerable<T>()
  public *flat<U>(depth?: number): unknown {
    for (const x of this) {
      if ((depth === undefined || depth > 0) && Utils.isIterable(x)) {
        yield* depth === undefined ?
          new Enumerable(x as unknown as Iterable<U>).flat() :
          new Enumerable(x as unknown as Iterable<U>).flat(depth - 1);
      } else {
        yield x;
      }
    }
  }

  /**
   * Returns the index of the first element fulfilling the property,
   * or -1 if no such element could be found.
   * @param property
   */
  public indexOf(property: Predicate<T>): number;
  /**
   * Returns the index of the first element fulfilling the property,
   * or -1 if no such element could be found.
   * Search starts from index fromIndex.
   * @param property
   * @param fromIndex
   */
  public indexOf(property: Predicate<T>, fromIndex: number): number;
  /**
   * Returns the index of the first occurrence of item, or -1 if item is not in the Enumerable.
   * @param item
   */
  public indexOf(item: T): number;
  /**
   * Returns the index of the first occurrence of item, or -1 if item is not in the Enumerable.
   * Search starts from index fromIndex.
   * @param item
   * @param fromIndex
   */
  public indexOf(item: T, fromIndex: number): number;
  @parse((_thisRef: Enumerable<T>, ...args: any[]) => {
    const [itemOrProperty, fromIndex = 0] = args;
    const property: Predicate<T> = itemOrProperty instanceof Function ?
      itemOrProperty as Predicate<T> :
      x => x === itemOrProperty;
    return [property, fromIndex];
  })
  public indexOf(...args: any[]): number {
    const [property, fromIndex] = args;
    let index = fromIndex;
    for (const x of this.skip(fromIndex)) {
      if (property(x)) {
        return index;
      }
      index++;
    }
    return -1;
  }

  /**
   * Returns the maximum element in the Enumerable.
   * @throws Error if the Enumerable is empty.
   */
  public max(): T;
  /**
   * Returns the maximum element in the Enumerable, using compareFn for comparison.
   * @param compareFn
   * @throws Error if the Enumerable is empty.
   */
  public max(compareFn: CompareFunction<T>): T;
  /**
   * Returns the maximum value of the property given by propertySelector.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public max<U>(propertySelector: MapFunction<T, U>): U;
  @parse(Utils.parseCompareFnOrPropertySelector)
  public max<U>(...args: any[]): U {
    const [compareFn, propertySelector] = args;
    return this
      .map(propertySelector as MapFunction<T, U>)
      .reduce((prev, curr) => compareFn(prev, curr) > 0 ? prev : curr);
  }

  /**
   * Returns the minimum element in the Enumerable.
   * @throws Error if the Enumerable is empty.
   */
  public min(): T;
  /**
   * Returns the minimum element in the Enumerable, using compareFn for comparison.
   * @param compareFn
   * @throws Error if the Enumerable is empty.
   */
  public min(compareFn: CompareFunction<T>): T;
  /**
   * Returns the minimum value of the property given by propertySelector.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public min<U>(propertySelector: MapFunction<T, U>): U;
  @parse(Utils.parseCompareFnOrPropertySelector)
  public min<U>(...args: any[]): U {
    const [compareFn, propertySelector] = args;
    return this
      .map(propertySelector as  MapFunction<T, U>)
      .reduce((prev, curr) => compareFn(prev, curr) < 0 ? prev : curr);
  }

  /**
   * Returns the element in the Enumerable with the maximum value of the property given by propertySelector.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public maxBy<U>(propertySelector: MapFunction<T, U>): T;
  /**
   * Returns the element in the Enumerable with the maximum value of the property given by propertySelector,
   * with values compared using compareFn.
   * @param propertySelector
   * @param compareFn
   * @throws Error if the Enumerable is empty.
   */
  public maxBy<U>(propertySelector: MapFunction<T, U>, compareFn: CompareFunction<U>): T;
  public maxBy<U>(propertySelector: MapFunction<T, U>, compareFn: CompareFunction<U> = Utils.defaultCompareFn): T {
    return this.max((x: T, y: T) => compareFn(propertySelector(x), propertySelector(y)));
  }

  /**
   * Returns the element in the Enumerable with the minimum value of the property given by propertySelector.
   * @param propertySelector
   * @throws Error if the Enumerable is empty.
   */
  public minBy<U>(propertySelector: MapFunction<T, U>): T;
  /**
   * Returns the element in the Enumerable with the minimum value of the property given by propertySelector,
   * with values compared using compareFn.
   * @param propertySelector
   * @param compareFn
   * @throws Error if the Enumerable is empty.
   */
  public minBy<U>(propertySelector: MapFunction<T, U>, compareFn: CompareFunction<U>): T;
  public minBy<U>(propertySelector: MapFunction<T, U>, compareFn: CompareFunction<U> = Utils.defaultCompareFn): T {
    return this.min((x: T, y: T) => compareFn(propertySelector(x), propertySelector(y)));
  }

  /**
   * Returns the elements in this Enumerable that are also present in iterable.
   * Time: O(n+m), for n number of elements in this, and m number of elements in iterable.
   * Space: O(m) auxiliary.
   * @param iterable
   */
  public intersect(iterable: Iterable<T>): Enumerable<T> {
    const set = new Set(iterable);
    return this.where(x => set.has(x));
  }

  /**
   * Returns a Map with the number of occurrences of each element.
   */
  public toCounter(): Map<T, number> {
    const counter = new Map<T, number>();
    for (const x of this) {
      const count = counter.get(x) ?? 0;
      counter.set(x, count + 1);
    }
    return counter;
  }
}
