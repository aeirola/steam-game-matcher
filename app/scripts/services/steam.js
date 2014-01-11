'use strict';

angular.module('steamGameMatcherApp')
.service('Steam', function Steam($http, $q) {
  // AngularJS will instantiate a singleton by calling "new" on this function
  var API_KEY='5CDDD4FC0E7A510C4480B310391B8D67';
  var API_URL='/api/IPlayerService/GetOwnedGames/v0001/';
  var ID_API_URL='/id_api/';
  var x2js = new X2JS();
  var GAME_CACHE = {};

  var addGames = function(steamUser) {
    $http.get(API_URL+'?key='+API_KEY+'&steamid='+steamUser.steamId+'&include_appinfo=1&format=json')
    .success(function (data) {
      var gameData = data.response.games;
      var games = {};
      for (var i in gameData) {
        var game = gameData[i];
        games[game.appid] = game;
      }
      steamUser.game_count = data.response.game_count;
      steamUser.games = games;
    });
  };

  var getSteamId = function(user) {
    var deferred = $q.defer();
    var path;
    if (user.match(/^[0-9]{17}$/)) {
      path = '/profiles/';
    } else {
      path = '/id/';
    }
    $http.get(ID_API_URL + path + user + '?xml=1')
    .success(function (dataString) {
      try {
        var data = x2js.xml_str2json(dataString);
        deferred.resolve({steamId: data.profile.steamID64,
                          name: data.profile.steamID.__cdata});
      } catch (e) {
        console.log('Invalid user ' + user + e);
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
