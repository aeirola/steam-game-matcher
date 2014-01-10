'use strict';

describe('Service: Steam', function () {

  // load the service's module
  beforeEach(module('steamGameMatcherApp'));

  // instantiate service
  var Steam;
  beforeEach(inject(function (_Steam_) {
    Steam = _Steam_;
  }));

  it('should do something', function () {
    expect(!!Steam).toBe(true);
  });

});
