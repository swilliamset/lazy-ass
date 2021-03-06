/* global lazyAss, la */
(function (root) {
  var expect = root.expect;

  function hasPromises() {
    return typeof Promise !== 'undefined';
  }

  function noop() {}

  describe('lazyAss', function () {
    beforeEach(function () {
      if (typeof window === 'undefined') {
        require('..').globalRegister(); // Node
      }
      if (typeof lazyAss === 'undefined') {
        throw new Error('Cannot find lazyAss global varible');
      }
      if (typeof root.expect === 'undefined') {
        root.expect = require('expect.js');
        expect = root.expect;
      }
    });

    describe('just an error', function () {
      it('rethrows instance of Error as condition', function () {
        expect(function () {
          lazyAss(new Error('foo'));
        }).to.throwException(/^foo$/);
      });

      if (hasPromises()) {
        /* global Promise */
        it('rethrows promise errors', function (done) {
          var p = new Promise(function (resolve, reject) {
            reject(new Error('foo'));
          });
          p.then(noop, lazyAss).catch(function (err) {
            expect(err.message).to.be('foo');
            done();
          });
        });

        // really hard to make this test fail, yet pass
        // comment out, but leaving it in the code for future
        // it('rethrows promise errors', function (done) {
        //   var p = new Promise(function (resolve, reject) {
        //     reject(new Error('foo'));
        //   });
        //   p.then(noop, lazyAssync);
        // });
      }
    });

    describe('lazyAss function itself', function () {
      it('is a function', function () {
        expect(lazyAss).not.to.be(undefined);
        expect(lazyAss).to.be.a('function');
      });

      it('has alias', function () {
        expect(la).to.be.a('function');
      });

      it('does not throw if condition is true', function () {
        expect(function () {
          lazyAss(true);
        }).not.to.throwError();
      });

      it('does not evaluate function if condition is true', function () {
        function foo() {
          throw new Error('Foo has been called');
        }
        lazyAss(true, foo);
      });

      it('throws error with string', function () {
        expect(function () {
          lazyAss(false, 'foo');
        }).to.throwException(/^foo$/);
      });

      it('adds spaces', function () {
        expect(function () {
          lazyAss(false, 'foo', 'bar');
        }).to.throwException(/^foo bar$/);
      });

      it('calls functions to form message', function () {
        var called = 0;
        function foo() {
          called += 1;
          return 'foo';
        }
        expect(function () {
          lazyAss(false, foo, 'bar', foo);
        }).to.throwException(/^foo bar foo$/);
      });

      it('calls function each time', function () {
        var called = 0;
        function foo() {
          called += 1;
          return 'foo';
        }
        expect(function () {
          lazyAss(false, foo, 'bar', foo);
        }).to.throwException(function () {
          expect(called).to.equal(2);
        });
      });

      it('handles exception if thrown from function', function () {
        var called = 0;
        function foo() {
          called += 1;
          throw new Error('Oh no!');
        }
        expect(function () {
          lazyAss(false, foo, 'bar', foo);
        }).to.throwException(function (err) {
          expect(called).to.equal(2);
          expect(err.message).to.contain('bar');
        });
      });

      it('JSON stringifies arrays', function () {
        expect(function () {
          lazyAss(false, [1, 2, 3]);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('1,2,3');
        });
      });

      it('JSON stringifies objects', function () {
        var obj = { foo: 'foo' };
        expect(function () {
          lazyAss(false, obj);
        }).to.throwException(JSON.stringify(obj, null, 2));
      });

      it('JSON.stringify skip undefined property', function () {
        var obj = {
          foo: 'foo',
          bad: undefined
        };
        var str = JSON.stringify(obj);
        expect(str).not.to.contain('bad', str);
      });

      it('JSON.stringify with custom replacer', function () {
        var obj = {
          foo: 'foo',
          bad: undefined
        };
        function replacer(key, value) {
          if (value === undefined) {
            return 'null';
          }
          return value;
        }
        var str = JSON.stringify(obj, replacer);
        expect(str).to.contain('foo', str);
        expect(str).to.contain('bad', str);
      });

      it('nested JSON.stringify with custom replacer', function () {
        var obj = {
          foo: 'foo',
          bar: {
            baz: 'value'
          }
        };
        function replacer(key, value) {
          if (value === undefined) {
            return null;
          }
          return value;
        }
        var str = JSON.stringify(obj, replacer);
        expect(str).to.contain('foo', str);
        expect(str).to.contain('bar', str);
        expect(str).to.contain('baz', str);
        expect(str).to.contain('value', str);
      });

      it('JSON stringifies undefined value of a property', function () {
        var obj = {
          foo: 'foo',
          bad: undefined
        };
        expect(function () {
          lazyAss(false, obj);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('foo', err.message);
          expect(err.message).to.contain('bad', err.message);
        });
      });

      it('takes error name and message', function () {
        expect(function () {
          lazyAss(false, new Error('hi there'));
        }).to.throwException(function (err) {
          expect(err.message).to.contain('Error');
          expect(err.message).to.contain('hi there');
        });
      });

      it('does adds spaces between arguments', function () {
        expect(function () {
          lazyAss(false, 'foo', 'bar', 42);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('foo bar 42');
        });
      });

      it('does not add space if previous one has newline', function () {
        expect(function () {
          lazyAss(false, 'foo\n', 'bar', 42);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('foo\nbar 42');
        });
      });
    });

    describe('function as condition', function () {
      it('evaluates the function', function () {
        var called;
        function condition() { called = true; return true; }

        lazyAss(condition);
        expect(called).to.be(true);
      });

      it('no result is failure', function () {
        function noreturn() {}

        expect(function () {
          lazyAss(noreturn);
        }).to.throwError();
      });

      it('adds condition function source to message', function () {
        function myCondition() {}
        expect(function () {
          lazyAss(myCondition);
        }).to.throwException(/myCondition/);
      });

      it('allows anonymous functions', function () {
        var called;
        lazyAss(function() { return true; });
        lazyAss(function() { return true; }, 'everything is ok');
        lazyAss(function() { called = true; return true; }, 'everything is ok');
        expect(called).to.be(true);

        expect(function () {
          lazyAss(function () {});
        }).to.throwError();
      });

      it('has access via closure', function () {
        var foo = 2, bar = 3;
        expect(function () {
          lazyAss(function () { return foo + bar === 6; }, 'addition');
        }).to.throwException(function (err) {
          expect(err.message).to.contain('foo + bar');
          expect(err.message).to.contain('addition');
        });
      });

      it('example', function () {
        var foo = 2, bar = 2;
        function isValidPair() {
          return foo + bar === 4;
        }
        lazyAss(isValidPair, 'foo', foo, 'bar', bar);
      });
    });

    describe('serializes circular objects', function () {
      var foo = {
        bar: 'bar'
      };
      foo.foo = foo;

      it('can handle one circular object', function () {
        var msg = 'foo has circular reference';
        expect(function () {
          lazyAss(false, msg, foo);
        }).to.throwException(function (err) {
          expect(err.message).to.contain(msg);
        });
      });
    });

    describe('serialize arguments', function () {
      function foo() {
        la(false, arguments);
      }
      it('serializes arguments object', function () {
        expect(function () {
          foo('something');
        }).to.throwException(function (err) {
          expect(err.message).to.contain('something');
        });
      });
    });

    describe('gives context to non-serializable objects', function () {

      it('prints keys in non-serializable objects', function () {
        var foo = {
          bar: 'bar'
        };
        foo.foo = foo;
        expect(function () {
          lazyAss(false, foo);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('type "object"');
          expect(err.message).to.contain('foo');
          expect(err.message).to.contain('bar');
        });
      });

      it('handles several objects', function () {
        var foo = {
          bar: 'bar'
        };
        foo.foo = foo;

        var bar = {
          foo: foo
        };

        expect(function () {
          lazyAss(false, foo, bar);
        }).to.throwException(function (err) {
          expect(err.message).to.contain('arg 0');
          expect(err.message).to.contain('arg 1');
        });
      });

      it('can handle array with circular objects', function () {
        var foo = {
          bar: 'bar'
        };
        foo.foo = foo;

        expect(function () {
          lazyAss(false, 'problem with foo', [foo]);
        }).to.throwException(function (err) {
          // console.log(err.message);
          expect(err.message).to.contain('problem with foo');
          expect(err.message).to.contain('bar');
        });
      });

    });

  });
}(this));
