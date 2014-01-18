'use strict';

angular.module('steamGameMatcherApp')
  .controller('MainCtrl', function ($scope, Steam) {
    $scope.userInputString = 'spaceball\nksii';
    $scope.users = {};
    $scope.games = {};
    $scope.categories = {
      1: {name: 'Multi-player', icon: 'ico_multiPlayer.png', selected: true},
      9: {name: 'Co-op', icon: 'ico_coop.png', selected: false}
    };
    $scope.platforms = {
      'windows': {name: 'Windows', icon: 'platform_win.png', selected: false},
      'mac': {name: 'OS X', icon: 'platform_mac.png', selected: false},
      'linux': {name: 'Linux', icon: 'platform_linux.png', selected: false}
    };
    $scope.appsIconUrl = 'http://media.steampowered.com/steamcommunity/public/images/apps/';
    $scope.platformsIconUrl = 'http://store.steampowered.com/public/images/v5/platforms/';
    $scope.categoriesIconUrl = 'http://store.steampowered.com/public/images/ico/';

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

    $scope.appFilter = function(app) {
      if (!app.loaded) {
        return true;
      }

      if (app.type !== 'game') {
        return false;
      }

      var i;
      for (i in $scope.categories) {
        if ($scope.categories[i].selected && !app.categories[i]) {
          return false;
        }
      }

      for (i in $scope.platforms) {
        if ($scope.platforms[i].selected && !app.platforms[i]) {
          return false;
        }
      }

      return true;
    };

    $scope.appSort = function(app) {
      if (app.metacritic) {
        return app.metacritic.score;
      } else {
        return 0;
      }
    };
  });
