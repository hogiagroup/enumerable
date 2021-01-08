import jsc from 'jsverify';
import { Utils } from '../utils';
import { Enumerable } from '../enumerable';

describe('Utils', () => {
  describe('disposeIterator', () => {
    it('should call return(), if present, on an Array iterator', () => {
      const sut = [][Symbol.iterator]();
      expectReturnToBeCalledIfPresent(sut);
    });

    it('should call return(), if present, on a Set iterator', () => {
      const sut = new Set([])[Symbol.iterator]();
      expectReturnToBeCalledIfPresent(sut);
    });

    it('should call return(), if present, on a Map iterator', () => {
      const sut = new Map()[Symbol.iterator]();
      expectReturnToBeCalledIfPresent(sut);
    });

    it('should call return(), if present, on an Enumerable iterator', () => {
      const sut = Enumerable.range(0)[Symbol.iterator]();
      expectReturnToBeCalledIfPresent(sut);
    });
  });

  describe('exhaustIterator', () => {
    it('should exhaust the iterator', () => {
      jsc.assertForall(
        jsc.array(jsc.nat),
        (xs: number[]) => {
          const sut = xs[Symbol.iterator]();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const _ of Utils.exhaustIterator(sut));
          return sut.next().done;
        });
    });

    it('should yield the rest of the iterator', () => {
      jsc.assertForall(
        jsc.array(jsc.nat), jsc.nat,
        (xs: number[], k: number) => {
          const sut = xs[Symbol.iterator]();
          for (let i = 0; i < k; i++) {
            sut.next();
          }
          const ys = Array.from(Utils.exhaustIterator(sut));
          return ys.length === Math.max(0, xs.length - k);
        });
    });
  });
});

const expectReturnToBeCalledIfPresent = (iterator: Iterator<unknown>): void => {
  if (iterator.return) {
    const spy = spyOn(iterator, 'return');
    Utils.disposeIterator(iterator);
    expect(spy).toHaveBeenCalled();
  } else {
    expect().nothing();
  }
};
