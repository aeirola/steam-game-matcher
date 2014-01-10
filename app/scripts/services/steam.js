'use strict';

angular.module('steamGameMatcherApp')
.service('Steam', function Steam($http, $q) {
  // AngularJS will instantiate a singleton by calling "new" on this function
  var API_KEY='5CDDD4FC0E7A510C4480B310391B8D67';
  var API_URL='/api/IPlayerService/GetOwnedGames/v0001/';
  var ID_API_URL='/id_api/id/';
  var x2js = new X2JS();
  var GAME_CACHE = {};

  var getGameIds = function(steamId) {
    var deferred = $q.defer();
    $http.get(API_URL+'?key='+API_KEY+'&steamid='+steamId+'&format=json')
    .then(function (response) {
      var gameIds = _.map(response.data.response.games, function(game) {return game.appid;});
      deferred.resolve(gameIds);
    });
    return deferred.promise;
  };

  var getSteamId = function(user) {
    var deferred = $q.defer();
    if (user.match(/^[0-9]{17}$/)) {
      deferred.resolve(user);
    } else {
      $http.get(ID_API_URL + user + '?xml=1').success(function (dataString) {
        try {
          var data = x2js.xml_str2json(dataString);
          deferred.resolve({steamId: data.profile.steamID64,
                            name: data.profile.steamID.__cdata});
        } catch (e) {
          console.log('Invalid user ' + user + e);
          deferred.reject();
        }
      });
    }

    return deferred.promise;
  };

  this.getSteamUser = function(userName) {
    var deferred = $q.defer();

    // Get id
    getSteamId(userName)
    .then(function(steamUser) {
      getGameIds(steamUser.steamId)
      .then(function(gameIds) {
        steamUser.gameIds = gameIds;
        deferred.resolve(steamUser);
      });
    });

    return deferred.promise;
  };
});
