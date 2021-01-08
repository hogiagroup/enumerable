export type Predicate<T> = (x: T) => boolean;
export type MapFunction<T, U> = (x: T) => U;
export type CompareFunction<T> = (x: T, y: T) => number;
export type PivotSelector<T> = (xs: Iterable<T>, compareFn: CompareFunction<T>) => T;
