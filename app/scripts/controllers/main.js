'use strict';

angular.module('steamGameMatcherApp')
  .controller('MainCtrl', function ($scope, Steam) {
    $scope.userInputString = 'spaceball\nksii';
    $scope.users = {};
    $scope.games = {};

    var addUser = function(user) {
      $scope.users[user.steamId] = user;
    };

    $scope.search = function(userInputString) {
      $scope.users = {};
      var userInputs = userInputString.split('\n');
      for (var i in userInputs) {
        var userInput = userInputs[i];
        Steam.getSteamUser(userInput).then(addUser);
      }
    };

    $scope.$watch('users', function(users) {
      var gameIds = _.intersection.apply({}, _.map(users, function(user) {
        return _.map(user.games, 'appid');
      }));
      var allGames = {};
      angular.extend.apply({}, _.union([allGames], _.map(users, 'games')));
      $scope.games = _.map(gameIds, function(gameId) {return allGames[gameId];});
    }, true);
  });
