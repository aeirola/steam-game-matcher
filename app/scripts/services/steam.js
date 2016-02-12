/* jshint camelcase: false */
'use strict';

angular.module('steamGameMatcherApp')
.service('Steam', function Steam($http, $q) {
  // AngularJS will instantiate a singleton by calling "new" on this function
  var API_KEY='5CDDD4FC0E7A510C4480B310391B8D67';
  var API_URL='//crossorigin.me/http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/';
  var ID_API_URL='//crossorigin.me/http://steamcommunity.com/';
  var STORE_API_URL='//crossorigin.me/http://store.steampowered.com/api/appdetails';
  var APP_DATA_FIELDS = ['basic', 'price_overview', 'platforms', 'categories', 'metacritic'];

  var xmlParser = new DOMParser();
  var appCache = {}; // id -> promise
  var self = this;

  var convertCategories = function(appData) {
    var convertedCategories = {};
    _.forEach(appData.categories, function(category) {
      convertedCategories[category.id] = category;
    });

    appData.categories = convertedCategories;
    return appData;
  };

  var getApps = function(appids) {
    var deferred = $q.defer();
    var newAppids = _.filter(appids, function(appid) {
      return !(appid in appCache);
    });

    _.forEach(newAppids, function(appid) {
      appCache[appid] = $q.defer();
    });

    var resolveApps = function() {
      var returnValue = {};
      _.forEach(appids, function(appid) {
        returnValue[appid] = {};
        appCache[appid].promise.then(function(app) {
          angular.extend(returnValue[appid], app);
        });
      });
      deferred.resolve(returnValue);
    };

    if (newAppids) {
      $http.get(STORE_API_URL+'?filters='+APP_DATA_FIELDS.join(',')+'&appids='+newAppids.join(','))
      .success(function(data) {
        _.forIn(data, function(app, appid) {
          var appData = app.data;
          if (appData) {
            appData = convertCategories(appData);
          }
          if (!appCache[appid]) {
            appCache[appid] = $q.defer();
          }
          appCache[appid].resolve(appData);
        });

        resolveApps();
      });
    } else {
      resolveApps();
    }

    return deferred.promise;
  };

  var addApps = function(steamUser) {
    var deferred = $q.defer();

    $http.get(API_URL+'?key='+API_KEY+'&steamid='+steamUser.steamId+'&include_appinfo=1&format=json')
    .success(function (data) {
      var gameData = data.response.games;
      var games = {};
      _.forEach(gameData, function(game) {
        games[game.appid] = game;
      });
      expandAppData(games);
      steamUser.gameCount = data.response.game_count;
      steamUser.games = games;
      deferred.resolve(steamUser);
    });

    return deferred.promise;
  };

  var expandAppData = function(apps) {
    var expand = function(data) {
      for (var appid in data) {
        angular.extend(apps[appid], data[appid], {loaded: true});
        self.setAppScore(apps[appid]);
      }
    };

    var appidBuffer = [];
    var flushBuffer = function() {
      if (appidBuffer.length <= 0) {
        return;
      }
      getApps(appidBuffer).then(expand);
      appidBuffer = [];
    };

    _.forIn(apps, function(app, appid) {
      appidBuffer.push(appid);
      if (appidBuffer.length >= 1) {
        flushBuffer();
      }
    });
    flushBuffer();
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

        if (xmlDoc.getElementsByTagName('privacyState')[0].textContent === 'private') {
          deferred.reject({
            steamId: xmlDoc.getElementsByTagName('steamID64')[0].textContent,
            name: xmlDoc.getElementsByTagName('steamID')[0].textContent,
            reason: 'Private'
          });
        }

        deferred.resolve({steamId: xmlDoc.getElementsByTagName('steamID64')[0].textContent,
                          name: xmlDoc.getElementsByTagName('steamID')[0].textContent});
      } catch (e) {
        deferred.reject({
          steamId: user,
          name: user,
          reason: 'Invalid user'
        });
      }
    })
    .error(function() {
      deferred.reject({
        steamId: user,
        name: user,
        reason: 'Not found'
      });
    });

    return deferred.promise;
  };

  this.setAppScore = function(app) {
    app.score = 0;
  };

  this.getSteamUser = function(userName) {
    var deferred = $q.defer();

    // Get id
    getSteamId(userName)
    .then(function(steamUser) {
      addApps(steamUser).then(deferred.resolve, deferred.reject, deferred.notify);
      deferred.notify(steamUser);
    }, deferred.reject);

    return deferred.promise;
  };
});
