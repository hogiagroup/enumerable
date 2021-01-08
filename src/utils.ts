import { CompareFunction, MapFunction } from './types';

export class Utils {
  public static disposeIterator<T>(iterator: Iterator<T>): void {
    if (iterator && iterator.return) {
      iterator.return();
    }
  }

  public static isIterable(obj: unknown): boolean {
    return !!Object(obj)[Symbol.iterator];
  }

  public static *exhaustIterator<T>(iterator: Iterator<T>): Iterable<T> {
    while (true) {
      const x = iterator.next();
      if (x.done) {
        return;
      }
      yield x.value;
    }
  }

  public static defaultCompareFn<T>(x: T, y: T): number {
    return x === y ? 0 : x < y ? -1 : 1;
  }

  public static id<T>(x: T): T {
    return x;
  }

  public static parseCompareFnOrPropertySelector<T, U>(_thisRef: T, f?: CompareFunction<T> | MapFunction<T, U>): [CompareFunction<T>, MapFunction<T, T | U>] {
    if (!f) {
      return [Utils.defaultCompareFn, Utils.id];
    }
    if (f.length === 2) { // f takes two arguments and is a CompareFunction
      return [f as CompareFunction<T>, Utils.id];
    } else {
      return [Utils.defaultCompareFn, f as MapFunction<T, U>];
    }
  }
}
