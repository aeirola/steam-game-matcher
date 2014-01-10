'use strict';

angular.module('steamGameMatcherApp')
  .controller('MainCtrl', function ($scope, Steam) {
    $scope.userInputString = 'spaceball\nksii';
    $scope.users = {};
    $scope.games = {};

    var addUser = function(user) {
      $scope.users[user.steamId] = user;
    };

    $scope.search = function() {
      $scope.users = {};
      var userInputs = $scope.userInputString.split('\n');
      for (var i in userInputs) {
        var userInput = userInputs[i];
        Steam.getSteamUser(userInput).then(addUser);
      }
    };

    $scope.$watchCollection('users', function(users) {
      var gameIdArrays = _.map(users, function(user) {
        return user.gameIds;
      });

      $scope.games = _.intersection.apply({}, gameIdArrays);
    });
  });
