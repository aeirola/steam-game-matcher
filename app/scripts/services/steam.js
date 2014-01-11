/* jshint camelcase: false */
'use strict';

angular.module('steamGameMatcherApp')
.service('Steam', function Steam($http, $q) {
  // AngularJS will instantiate a singleton by calling "new" on this function
  var API_KEY='5CDDD4FC0E7A510C4480B310391B8D67';
  var API_URL='/web_api/IPlayerService/GetOwnedGames/v0001/';
  var ID_API_URL='/id_api/';
  var STORE_API_URL='/store_api/appdetails';
  var xmlParser = new DOMParser();

  var addGames = function(steamUser) {
    $http.get(API_URL+'?key='+API_KEY+'&steamid='+steamUser.steamId+'&include_appinfo=1&format=json')
    .success(function (data) {
      var gameData = data.response.games;
      var games = {};
      _.forEach(gameData, function(game) {
        games[game.appid] = game;
      });
      expandGameData(games);
      steamUser.gameCount = data.response.game_count;
      steamUser.games = games;
    });
  };

  var expandGameData = function(games) {
    var expand = function(data) {
      for (var appid in data) {
        angular.extend(games[appid], data[appid].data);
      }
    };

    for (var appid in games) {
      $http.get(STORE_API_URL+'?appids='+appid).success(expand);
    }
  };

  var getSteamId = function(user) {
    var deferred = $q.defer();
    var path;
    if (user.match(/^[0-9]{17}$/)) {
      path = 'profiles/';
    } else {
      path = 'id/';
    }
    $http.get(ID_API_URL + path + user + '?xml=1')
    .success(function (dataString) {
      try {
        var xmlDoc = xmlParser.parseFromString(dataString, 'text/xml');
        deferred.resolve({steamId: xmlDoc.getElementsByTagName('steamID64')[0].childNodes[0].nodeValue,
                          name: xmlDoc.getElementsByTagName('steamID')[0].childNodes[0].nodeValue});
      } catch (e) {
        console.log('Invalid user ' + user);
        deferred.reject();
      }
    });

    return deferred.promise;
  };

  this.getSteamUser = function(userName) {
    var deferred = $q.defer();

    // Get id
    getSteamId(userName)
    .then(function(steamUser) {
      addGames(steamUser);
      deferred.resolve(steamUser);
    });

    return deferred.promise;
  };
});
