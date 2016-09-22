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

if (Utils.isOptionValid('test')) {

	PluginSystem.require('DebugUtility');

	PluginSystem.ns(null, function (scope) {

		Debug.Command.register('reload', function () {
			if ($gamePlayer) {
				$gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
				$gamePlayer.requestMapReload();
			}
		});

		Debug.Command.register('nice', function (type) {
			if ($gameMap && $gamePlayer) {
				var vehicle = $gameMap.vehicle(type);
				if (vehicle) {
					var x = $gameMap.xWithDirection($gamePlayer.x, $gamePlayer.direction());
					var y = $gameMap.yWithDirection($gamePlayer.y, $gamePlayer.direction());
					vehicle.setLocation($gameMap.mapId(), x, y);
				}
			}
		});

		Debug.Command.register('weather', function (type, power, duration) {
			if ($gameScreen) {
				if (type === 'none') {
					$gameScreen.clearWeather();
				} else {
					$gameScreen.changeWeather(type, power || 5, duration || 0);
				}
			}
		});

	});
}