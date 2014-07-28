/* jshint camelcase: false */
'use strict';

angular.module('steamGameMatcherApp')
  .controller('MainCtrl', function ($scope, Steam) {
    $scope.userInputString = 'spaceball\nksii';
    $scope.users = {};
    $scope.invalidUsers = {};
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

    var addInvalidUser = function(user) {
      $scope.invalidUsers[user.steamId] = user;
    };

    $scope.search = function(userInputString) {
      $scope.users = {};
      var userInputs = userInputString.split('\n');
      for (var i in userInputs) {
        var userInput = userInputs[i];
        Steam.getSteamUser(userInput).then(addUser, addInvalidUser);
      }
    };

    $scope.$watch('users', function(users) {
      var apps = {};
      _.forEach(users, function(user) {
        _.forEach(user.games, function(app) {
          var appid = app.steam_appid || app.appid;
          if (apps[appid]) {
            app = apps[appid];
          } else {
            app.owners = {};
            apps[appid] = app;
          }
          app.owners[user.steamId] = user.name;
          app.missingCopies = Object.keys($scope.users).length - Object.keys(app.owners).length;
        });
      });
      $scope.games = _.toArray(apps);
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
      var metascore = 50;
      var price = 0;
      if (app.metacritic) {
        metascore = app.metacritic.score;
      }
      if (app.price_overview) {
        price = app.price_overview.final;
      }

      var cost = app.missingCopies*price || 0.01;
      var score = metascore/cost;
      return score;
    };
  });
