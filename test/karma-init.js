// disable stacktrace limit so we do not lose any error information
Error.stackTraceLimit = Infinity;

const testsContext = require.context(
  // directory:
  '../src',
  // recursive:
  true,
  // test files regex:
  /.spec.ts$/
);
testsContext.keys().forEach(testsContext);
