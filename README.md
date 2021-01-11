# Introduction 
This library contains the utility class Enumerable<T>, which implements Iterable<T> and provides a number of methods for
operating on Iterables.

# Installation
The npm package is currently published only on the GitHub package registry, which requires authentication with a personal access token (PAT) (see https://docs.github.com/en/free-pro-team@latest/packages/guides/configuring-npm-for-use-with-github-packages#authenticating-to-github-packages). To install, create a new PAT with scope read:packages under Settings/Developer settings/Personal access tokens on your GitHub profile. Next, add the following lines in your .npmrc file (create one if it does not exist) in the root of your project, replacing TOKEN with your newly created token:

```
@hogiagroup:registry=https://npm.pkg.github.com/hogiagroup
//npm.pkg.github.com/:_authToken=TOKEN
```

You can now install Enumerable with `npm install @hogiagroup/enumerable`.

# Getting Started
The main class is Enumerable, which can be instantiated with an existing Iterable instance or as empty. Enumerables can then be built by successively chaining methods to the original instance; Enumerable objects themselves are immutable insofar as that all methods are pure (free from side effects), but care should be taken not to modify the source iterable.

Any generator function can be made to return an Enumerable by use of the @enumerable decorator. @enumerable accepts an optional argument validator, a callback which validates input to the decorated function immediately, rather than at evaluation time.

The class PivotSelectionStrategies contains predefined functions for selecting pivot elements for the quickSort function.

# Build and Test
To build, run 'npm run build'. Tests are run with 'npm run test' or 'npm run tdd' (auto-watch).

# Contribute
Submit a pull request.