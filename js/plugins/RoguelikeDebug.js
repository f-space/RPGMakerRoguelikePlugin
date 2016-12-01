/*!
/*:
 * @plugindesc ローグライク：デバッグ
 * @author F_
 *
 * @help
 * デバッグ用のコマンド定義。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['DebugUtility'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var DebugUtility_1;
    function getSavedJSON(value) {
        return JSON.stringify(JSON.parse(JsonEx.stringify(value)), null, 4);
    }
    function getReloadedJSON(value) {
        return JSON.stringify(JsonEx.parse(JsonEx.stringify(value)), null, 4);
    }
    return {
        setters:[
            function (DebugUtility_1_1) {
                DebugUtility_1 = DebugUtility_1_1;
            }],
        execute: function() {
            if (Utils.isOptionValid('test')) {
                DebugUtility_1.Command.register('reload', function () {
                    if ($gamePlayer) {
                        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, 2, 0);
                        $gamePlayer.requestMapReload();
                    }
                });
                DebugUtility_1.Command.register('nice', function (type) {
                    if ($gameMap && $gamePlayer) {
                        var vehicle = $gameMap.vehicle(type);
                        if (vehicle) {
                            var x = $gameMap.xWithDirection($gamePlayer.x, $gamePlayer.direction());
                            var y = $gameMap.yWithDirection($gamePlayer.y, $gamePlayer.direction());
                            vehicle.setLocation($gameMap.mapId(), x, y);
                        }
                    }
                });
                DebugUtility_1.Command.register('weather', function (type, power, duration) {
                    if ($gameScreen) {
                        if (type === 'none') {
                            $gameScreen.clearWeather();
                        }
                        else {
                            $gameScreen.changeWeather(type, +power || 5, +duration || 0);
                        }
                    }
                });
                DebugUtility_1.Command.register('print', function (type) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    switch (type) {
                        case 'save':
                            console.log(getSavedJSON(DataManager.makeSaveContents()));
                            break;
                        case 'reload':
                            console.log(getReloadedJSON(DataManager.makeSaveContents()));
                            break;
                    }
                });
            }
        }
    }
});
