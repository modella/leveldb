REPORTER = spec
UI = bdd

test:
	@NODE_ENV=test ./node_modules/.bin/mocha -u $(UI) -R $(REPORTER) -c -G -b

lib-cov:
	./node_modules/jscoverage/bin/jscoverage src lib-cov

test-cov: lib-cov
	@LEVEL_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@LEVEL_COV=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

clean:
	@rm -rf node_modules components build

.PHONY: test