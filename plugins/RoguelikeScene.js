/*:
 * @plugindesc ローグライク：シーン
 * @author F_
 * 
 * @help
 * マップ画面をローグライクに変更するプラグイン。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.require('DarknessEffect');
PluginSystem.require('SceneRedirection');
PluginSystem.require('Roguelike');
PluginSystem.require('RoguelikeLayout')
PluginSystem.require('RoguelikeUI');

PluginSystem.ns('auto', function (scope, params) {
	scope.extract('DarknessEffect');
	scope.extract('Roguelike');
	scope.extract('Roguelike.Layout');
	scope.extract('Roguelike.UI');

	this.define('DungeonContext', function () {
		function DungeonContext() {
			this.initialize.apply(this, arguments);
		}

		DungeonContext.prototype.initialize = function (seed) {
			this.setup(seed);
		}

		DungeonContext.prototype.onDeserialize = function () {
			this.setup(this.seed);
		}

		DungeonContext.prototype.setup = function (seed) {
			var random = new scope.Random(seed);
			Object.defineProperties(this, {
				seed: { value: seed, enumerable: true },
				random: { value: random },
				dungeonSeed: { value: random.next() },
				dungeon: { value: null, writable: true },
			});
		}

		return DungeonContext;
	}, true);

	this.define('DungeonSpriteset', function () {
		function DungeonSpriteset() {
			this.initialize.apply(this, arguments);
		}

		DungeonSpriteset.prototype = Object.create(scope.DarkMapSpriteset.prototype);
		DungeonSpriteset.prototype.constructor = DungeonSpriteset;

		DungeonSpriteset.prototype.initialize = function () {
			scope.DarkMapSpriteset.prototype.initialize.call(this);
		}

		DungeonSpriteset.prototype.createDarknessEffect = function () {
			scope.DarkMapSpriteset.prototype.createDarknessEffect.call(this);

			this.darknessColor = 'rgba(0,0,0,0.75)';
		}

		DungeonSpriteset.prototype.updateDarknessEffect = function () {
			var context = $gameMap.dungeonContext;
			if (context) {
				var room = this.getCurrentRoom(context.dungeon);
				if (room) {
					var area = this.getRoomArea(room);
					this.switchToAreaSight(area);
				} else {
					this.switchToCircleSight();
				}
			} else {
				this.switchToClearSight();
			}

			scope.DarkMapSpriteset.prototype.updateDarknessEffect.call(this);
		}

		DungeonSpriteset.prototype.getCurrentRoom = function (dungeon) {
			var rooms = dungeon.map.rooms;
			var x = $gamePlayer.x;
			var y = $gamePlayer.y;
			for (var i = 0, length = rooms.length; i < length; i++) {
				var room = rooms[i];
				if (x >= room.minX && x < room.maxX && y >= room.minY && y < room.maxY) {
					return room;
				}
			}

			return null;
		}

		DungeonSpriteset.prototype.getRoomArea = function (room) {
			var tileWidth = $gameMap.tileWidth();
			var tileHeight = $gameMap.tileHeight();

			return {
				x: Math.round($gameMap.adjustX(room.x - 0.75) * tileWidth),
				y: Math.round($gameMap.adjustY(room.y - 0.75) * tileHeight),
				width: (room.width + 1.5) * tileWidth,
				height: (room.height + 1.5) * tileHeight,
			}
		}

		return DungeonSpriteset;
	});

	this.define('DungeonScene', function () {
		function DungeonScene() {
			this.initialize.apply(this, arguments);
		}

		DungeonScene.prototype = Object.create(Scene_Map.prototype);
		DungeonScene.prototype.constructor = DungeonScene;

		DungeonScene.prototype.initialize = function () {
			Scene_Map.prototype.initialize.call(this);
		}

		DungeonScene.prototype.dungeonContext = function () {
			return $gameMap.dungeonContext;
		}

		DungeonScene.prototype.createSpriteset = function () {
			this._spriteset = new scope.DungeonSpriteset();
			this.addChild(this._spriteset);
		}

		DungeonScene.prototype.createAllWindows = function () {
			Scene_Map.prototype.createAllWindows.call(this);

			this.createInfoWindow();
		}

		DungeonScene.prototype.createInfoWindow = function () {
			this._infoWindow = new scope.InfoWindow();
			this.addWindow(this._infoWindow);
		}

		DungeonScene.prototype.createMapNameWindow = function () {
			Scene_Map.prototype.createMapNameWindow.call(this);

			var width = this._mapNameWindow.width;
			var height = this._mapNameWindow.height;
			var x = Graphics.boxWidth - width;
			var y = Graphics.boxHeight - height;
			this._mapNameWindow.move(x, y, width, height);
		}

		DungeonScene.prototype.onMapLoaded = function () {
			var map = $dataMap;
			if (map && map.meta.dungeon) {
				if (this._transfer) {
					this.deleteDungeonContext();
					this.setupDungeonContext();
				}

				this.onDungeonMapLoaded();
			} else {
				this.deleteDungeonContext();
				this.onNormalMapLoaded();
			}
		}

		DungeonScene.prototype.setupDungeonContext = function () {
			var context = $gameMap.dungeonContext;
			if (!context) {
				var seed = Graphics.frameCount;
				context = new scope.DungeonContext(seed);

				$gameMap.dungeonContext = context;
			}

			return context;
		}

		DungeonScene.prototype.deleteDungeonContext = function () {
			delete $gameMap.dungeonContext;
		}

		DungeonScene.prototype.onNormalMapLoaded = function () {
			Scene_Map.prototype.onMapLoaded.call(this);
		}

		DungeonScene.prototype.onDungeonMapLoaded = function () {
			var map = $dataMap;
			var context = this.dungeonContext();

			context.dungeon = this.createDungeon(map, context);
			$dataMap = this.reformMap(map, context);

			if (this._transfer) {
				$gamePlayer.performTransfer();

				this.locatePlayer($gamePlayer, context);
			}

			// TODO: move refactoring
			$gameScreen.setCamera('player', 2, true);

			this.createDisplayObjects();
		}

		DungeonScene.prototype.selectAlgorithm = function (name) {
			if (Object.prototype.toString.call(name) !== '[object String]') {
				name = 'default';
			}
			return scope.DungeonAlgorithm.get(name);
		}

		DungeonScene.prototype.createDungeon = function (map, context) {
			var algorithm = this.selectAlgorithm(map.meta.dungeon);
			var width = map.width;
			var height = map.height;
			var seed = context.dungeonSeed;
			var args = map.meta;

			return algorithm.create(width, height, seed, args);
		}

		DungeonScene.prototype.reformMap = function (map, context) {
			var generator = new scope.MapGenerator();

			return generator.generate(map, context.dungeon);
		}

		DungeonScene.prototype.locatePlayer = function (player, context) {
			var rooms = context.dungeon.map.rooms;
			var roomIndex = context.random.next(rooms.length);
			var room = rooms[roomIndex];

			var offsetX = context.random.next(room.width);
			var offsetY = context.random.next(room.height);
			var x = room.x + offsetX;
			var y = room.y + offsetY;

			player.locate(x, y);
		}

		return DungeonScene;
	});

	SceneRedirection.set(Scene_Map, scope.DungeonScene);
});