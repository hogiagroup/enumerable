/* eslint-disable @typescript-eslint/no-explicit-any */
import { Enumerable } from './enumerable';

/**
 * Wraps the decorated generator function and changes its return type to Enumerable<T>.
 * @param validator (optional) validates the arguments upon calling the decorated generator function.
 * Validation can be performed inside the generator as normal, but any error will not be thrown until
 * the generator is actually iterated over. If validation returns false, a generic error will be
 * thrown, but best practice is to throw a detailed error inside the validator.
 */
export function enumerable<T>(validator: (...args: never[]) => boolean = () => true): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => void {
  return (_target: never, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function(this: never, ...args: never[]): unknown {
      if (!validator(...args)) {
        throw new Error('invalid arguments');
      }
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const thisRef = this;
      const iterable = {
        [Symbol.iterator](): Iterator<T> {
          return originalMethod.apply(thisRef, args);
        }
      };
      return new Enumerable(iterable);
    };
  };
}

/**
 * Parses the arguments list before passing in the parsed arguments to the decorated function.
 * @param parser
 */
export function parse(parser: (this: any, ...args: never[]) => any[]): (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => void {
  return (_target: never, _propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function(this: never, ...args: never[]): any {
      const parsedArgs = parser(this, ...args);
      return originalMethod.apply(this, parsedArgs);
    };
  };
}
