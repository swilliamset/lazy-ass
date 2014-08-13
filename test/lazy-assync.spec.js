/* global lazyAssync, lac */
if (typeof window === 'undefined') {
  require('..'); // Node
}
if (typeof lazyAssync === 'undefined') {
  throw new Error('Cannot find lazyAssync global varible');
}
if (typeof expect === 'undefined') {
  var expect = require('expect.js');
}

describe('lazyAssync', function () {
  describe('lazyAssync function itself', function () {
    it('is a function', function () {
      expect(lazyAssync).not.to.be(undefined);
      expect(lazyAssync).to.be.a('function');
    });

    it('has alias', function () {
      expect(lac).to.be.a('function');
    });

    it('does not throw if condition is true', function () {
      expect(function () {
        lazyAssync(true);
      }).not.to.throwError();
    });

    it('does not evaluate function if condition is true', function () {
      function foo() {
        throw new Error('Foo has been called');
      }
      lazyAssync(true, foo);
    });
  });
});
