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

import { Command } from 'DebugUtility';

function getSavedJSON(value: any) {
	return JSON.stringify(JSON.parse(JsonEx.stringify(value)), null, 4);
}

function getReloadedJSON(value: any) {
	return JSON.stringify(JsonEx.parse(JsonEx.stringify(value)), null, 4);
}

if (Utils.isOptionValid('test')) {

	Command.register('reload', function () {
		if ($gamePlayer) {
			$gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, 2, 0);
			$gamePlayer.requestMapReload();
		}
	});

	Command.register('nice', function (type: string | number) {
		if ($gameMap && $gamePlayer) {
			var vehicle = $gameMap.vehicle(type);
			if (vehicle) {
				var x = $gameMap.xWithDirection($gamePlayer.x, $gamePlayer.direction());
				var y = $gameMap.yWithDirection($gamePlayer.y, $gamePlayer.direction());
				vehicle.setLocation($gameMap.mapId(), x, y);
			}
		}
	});

	Command.register('weather', function (type: string, power?: string, duration?: string) {
		if ($gameScreen) {
			if (type === 'none') {
				$gameScreen.clearWeather();
			} else {
				$gameScreen.changeWeather(type, +power || 5, +duration || 0);
			}
		}
	});

	Command.register('print', function (type: string) {
		var args = Array.prototype.slice.call(arguments, 1);
		switch (type) {
			case 'save':
				console.log(getSavedJSON(DataManager.makeSaveContents()));
				break;
			case 'reload':
				console.log(getReloadedJSON(DataManager.makeSaveContents()));
				break;
		}
	})
}