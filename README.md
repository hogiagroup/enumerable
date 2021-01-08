# Introduction 
This library contains the utility class Enumerable<T>, which implements Iterable<T> and provides a number of methods for
operating on Iterables.

# Getting Started
The main class is Enumerable, which can be initialised with an existing Iterable instance or as empty. Enumerables can then be
built by successively chaining methods to the original instance; Enumerable objects themselves are immutable insofar as that
all methods are pure (free from side effects), but care should be taken not to modify the source iterable.

Any generator function can be made to return an Enumerable by use of the @enumerable decorator. @enumerable accepts an optional
argument validator, a callback which validates input to the decorated function immediately, rather than at evaluation time.

The class PivotSelectionStrategies contains predefined functions for selecting pivot elements for the quickSort function.

# Build and Test
To build, run 'npm run build'. Tests are run with 'npm run test' or 'npm run tdd' (auto-watch).

# Contribute
Submit a pull request.