export class TestUtils {
  public static flatten<T>(arrays: T[][]): T[] {
    return new Array<T>().concat(...arrays);
  }

  public static isSortedAsc<T>(xs: Iterable<T>): boolean {
    let prev = null;
    for (const x of xs) {
      if (prev !== null && x < prev) {
        return false;
      }
      prev = x;
    }
    return true;
  }

  public static isSortedDesc<T>(xs: Iterable<T>): boolean {
    let prev = null;
    for (const x of xs) {
      if (prev !== null && x > prev) {
        return false;
      }
      prev = x;
    }
    return true;
  }
}

export type TestRecord = Record<string, number>;
