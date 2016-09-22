/*:
 * @plugindesc ローグライク：ダンジョン生成アルゴリズム
 * @author F_
 * 
 * @help
 * ダンジョン生成アルゴリズムの実装。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.require('Roguelike');

PluginSystem.ns('auto', function (scope) {
	scope.extract('Roguelike');

	this.define('DefaultAlgorithm', function () {
		function DefaultAlgorithm() {
			this.initialize.call(this, arguments);
		}

		DefaultAlgorithm.prototype = Object.create(scope.DungeonAlgorithm.prototype);
		DefaultAlgorithm.prototype.constructor = DefaultAlgorithm;

		var MinHallSize = 3;
		var MinLabyrinthSize = 8;

		var MinRegionSize = 6;
		var MinRoomSize = 4;
		var MinPathSize = 3;
		var MaxPathSize = 5;

		DefaultAlgorithm.prototype.initialize = function () { }

		DefaultAlgorithm.prototype.create = function (width, height, seed) {
			var random = new scope.Random(seed);

			var min = Math.min(width, height);
			if (min < MinHallSize) {
				return this.createSpace(width, height);
			} else if (min < MinLabyrinthSize) {
				return this.createHall(width, height);
			} else {
				return this.createLabyrinth(width, height, random);
			}
		}

		DefaultAlgorithm.prototype.createSpace = function (width, height) {
			var dungeon = new scope.Dungeon(width, height);

			var map = dungeon.map;
			var cells = map.cells;
			for (var i = 0, length = cells.length; i < length; i++) {
				cells[i].state = scope.CellState.Floor;
			}

			var room = new scope.Room(0, 0, width, height);
			map.rooms.push(room);

			return dungeon;
		}

		DefaultAlgorithm.prototype.createHall = function (width, height) {
			var dungeon = new scope.Dungeon(width, height);

			var map = dungeon.map;
			var cells = map.cells;
			for (var y = 1, endY = height - 1; y < endY; y++) {
				for (var x = 1, endX = width - 1; x < endX; x++) {
					cells[x + y * width].state = scope.CellState.Floor;
				}
			}

			var room = new scope.Room(1, 1, width - 2, height - 2);
			map.rooms.push(room);

			return dungeon;
		}

		DefaultAlgorithm.prototype.createLabyrinth = function (width, height, random) {
			var dungeon = new scope.Dungeon(this, width, height);

			var context = { dungeon: dungeon, random: random };
			var node = { x: 1, y: 1, width: width - 2, height: height - 2 };
			splitRegion.call(context, node);

			createMap.call(context, node);

			return dungeon;
		}

		function splitRegion(node) {
			var horizontal = node.parent ? !node.parent.splitter.horizontal : !!this.random.next(2);
			if (horizontal) {
				var space = node.height - MinRegionSize * 2 - MinPathSize;
				if (space >= 0) {
					var pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
					var region1Space = this.random.next(space - pathSpace + 1);
					var region2Space = space - (pathSpace + region1Space);
					var region1Size = MinRegionSize + region1Space;
					var region2Size = MinRegionSize + region2Space;
					var pathSize = MinPathSize + pathSpace;

					var position = region1Size + 1 + this.random.next(pathSize - 2);
					node.splitter = { horizontal: true, position: node.y + position };
					node.children = [
						{
							parent: node,
							x: node.x,
							y: node.y,
							width: node.width,
							height: region1Size,
						},
						{
							parent: node,
							x: node.x,
							y: node.y + region1Size + pathSize,
							width: node.width,
							height: region2Size,
						},
					];

					splitRegion.call(this, node.children[0]);
					splitRegion.call(this, node.children[1]);

					return;
				}
			} else {
				var space = node.width - MinRegionSize * 2 - MinPathSize;
				if (space >= 0) {
					var pathSpace = this.random.next(Math.min(MaxPathSize - MinPathSize, space) + 1);
					var region1Space = this.random.next(space - pathSpace + 1);
					var region2Space = space - (pathSpace + region1Space);
					var region1Size = MinRegionSize + region1Space;
					var region2Size = MinRegionSize + region2Space;
					var pathSize = MinPathSize + pathSpace;

					var position = region1Size + 1 + this.random.next(pathSize - 2);
					node.splitter = { horizontal: false, position: node.x + position };
					node.children = [
						{
							parent: node,
							x: node.x,
							y: node.y,
							width: region1Size,
							height: node.height,
						},
						{
							parent: node,
							x: node.x + region1Size + pathSize,
							y: node.y,
							width: region2Size,
							height: node.height,
						},
					];

					splitRegion.call(this, node.children[0]);
					splitRegion.call(this, node.children[1]);

					return;
				}
			}

			setRoom.call(this, node);
		}

		function setRoom(node) {
			var xrange = Math.max(0, node.width - (MinRoomSize + 2));
			var yrange = Math.max(0, node.height - (MinRoomSize + 2));
			var xsize = this.random.next(xrange + 1);
			var ysize = this.random.next(yrange + 1);
			var x = node.x + 1 + this.random.next(xrange - xsize + 1);
			var y = node.y + 1 + this.random.next(yrange - ysize + 1);
			var width = MinRoomSize + xsize;
			var height = MinRoomSize + ysize;

			var entry;
			if (node.parent.splitter.horizontal) {
				entry = x + this.random.next(width);
			} else {
				entry = y + this.random.next(height);
			}

			node.room = { x: x, y: y, width: width, height: height, entry: entry };
		}

		function createMap(node) {
			var map = this.dungeon.map;
			var cells = map.cells;
			var rooms = map.rooms;

			var stack = [node];
			while (stack.length !== 0) {
				var current = stack.pop();
				if (current.splitter) {
					var splitter = current.splitter;
					var path = current.children.concat(current.parent).reduce(function (result, value) {
						if (value) {
							var position = (value.splitter ? value.splitter.position : value.room.entry);
							result.min = Math.min(result.min, position);
							result.max = Math.max(result.max, position);
						}
						return result;
					}, { min: -1 >>> 0, max: 0 });

					if (splitter.horizontal) {
						var y = splitter.position;
						for (var x = path.min, endX = path.max + 1; x < endX; x++) {
							cells[x + y * map.width].state = scope.CellState.Floor;
						}

						var above = current.children[0];
						if (above.room) {
							var x = above.room.entry;
							var startY = above.room.y + above.room.height;
							for (var y = startY, endY = splitter.position; y < endY; y++) {
								cells[x + y * map.width].state = scope.CellState.Floor;
							}
						}

						var below = current.children[1];
						if (below.room) {
							var x = below.room.entry;
							var startY = below.room.y - 1;
							for (var y = startY, endY = splitter.position; y > endY; y--) {
								cells[x + y * map.width].state = scope.CellState.Floor;
							}
						}
					} else {
						var x = splitter.position;
						for (var y = path.min, endY = path.max + 1; y < endY; y++) {
							cells[x + y * map.width].state = scope.CellState.Floor;
						}

						var left = current.children[0];
						if (left.room) {
							var y = left.room.entry;
							var startX = left.room.x + left.room.width;
							for (var x = startX, endX = splitter.position; x < endX; x++) {
								cells[x + y * map.width].state = scope.CellState.Floor;
							}
						}

						var right = current.children[1];
						if (right.room) {
							var y = right.room.entry;
							var startX = right.room.x - 1;
							for (var x = startX, endX = splitter.position; x > endX; x--) {
								cells[x + y * map.width].state = scope.CellState.Floor;
							}
						}
					}

					current.children.forEach(function (child) { stack.push(child) });
				} else if (current.room) {
					var room = current.room;
					var roomModel = new scope.Room(room.x, room.y, room.width, room.height);

					for (var y = room.y, endY = room.y + room.height; y < endY; y++) {
						for (var x = room.x, endX = room.x + room.width; x < endX; x++) {
							cells[x + y * map.width].state = scope.CellState.Floor;
						}
					}
					rooms.push(roomModel);
				}
			}
		}

		return DefaultAlgorithm;
	});

	scope.DungeonAlgorithm.set('default', new scope.DefaultAlgorithm());
});