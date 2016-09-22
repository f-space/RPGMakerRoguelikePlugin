/*:
 * @plugindesc 八方向移動
 * @author F_
 * 
 * @param DelayTime
 * @desc 入力遅延フレーム数。
 * @default 5
 * 
 * @param SkewAngle
 * @desc 斜め方向を向いたときの画像を傾ける角度。
 * @default 15
 * 
 * @help
 * 八方向移動を可能にするプラグイン。
 * 
 * コアエンジンのAPI仕様を変更するため、
 * 他のプラグインと併用すると問題が発生する可能性あり。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

PluginSystem.validate(function (params) {
	return {
		delayTime: (Math.max(0, parseInt(params['DelayTime']))),
		skewAngle: (parseFloat(params['SkewAngle']) * Math.PI / 180),
	};
});

PluginSystem.ns(null, function (scope, params) {
	var Sqrt2 = Math.sqrt(2);

	var _Game_Map_xWithDirection = Game_Map.prototype.xWithDirection;
	Game_Map.prototype.xWithDirection = function (x, d) {
		return _Game_Map_xWithDirection.call(this, x, decomposeX(d));
	};

	var _Game_Map_yWithDirection = Game_Map.prototype.yWithDirection;
	Game_Map.prototype.yWithDirection = function (y, d) {
		return _Game_Map_yWithDirection.call(this, y, decomposeY(d));
	};

	var _Game_Map_roundXWithDirection = Game_Map.prototype.roundXWithDirection;
	Game_Map.prototype.roundXWithDirection = function (x, d) {
		return _Game_Map_roundXWithDirection.call(this, x, decomposeX(d));
	};

	var _Game_Map_roundYWithDirection = Game_Map.prototype.roundYWithDirection;
	Game_Map.prototype.roundYWithDirection = function (y, d) {
		return _Game_Map_roundYWithDirection.call(this, y, decomposeY(d));
	};

	Game_Map.prototype.doScroll = function (direction, distance) {
		switch (direction) {
			case 1:
				this.scrollDown(distance / Sqrt2);
				this.scrollLeft(distance / Sqrt2);
				break;
			case 2:
				this.scrollDown(distance);
				break;
			case 3:
				this.scrollDown(distance / Sqrt2);
				this.scrollRight(distance / Sqrt2);
				break;
			case 4:
				this.scrollLeft(distance);
				break;
			case 6:
				this.scrollRight(distance);
				break;
			case 7:
				this.scrollUp(distance / Sqrt2);
				this.scrollLeft(distance / Sqrt2);
				break;
			case 8:
				this.scrollUp(distance);
				break;
			case 9:
				this.scrollUp(distance / Sqrt2);
				this.scrollRight(distance / Sqrt2);
				break;
		}
	};

	var _Game_Map_isPassable = Game_Map.prototype.isPassable;
	Game_Map.prototype.isPassable = function (x, y, d) {
		if (isDir4(d)) {
			return _Game_Map_isPassable.call(this, x, y, d);
		} else {
			var horz = decomposeX(d);
			var vert = decomposeY(d);
			var x2 = this.roundXWithDirection(x, horz);
			var y2 = this.roundYWithDirection(y, vert);

			var h11 = this.getHeight(x, y);
			var h12 = this.getHeight(x, y2);
			var h21 = this.getHeight(x2, y);
			var h22 = this.getHeight(x2, y2);
			if (Math.max(h11, h22) <= Math.max(h12, h21)) {
				var hv1 = _Game_Map_isPassable.call(this, x, y, horz);
				var hv2 = _Game_Map_isPassable.call(this, x2, y, vert);
				var vh1 = _Game_Map_isPassable.call(this, x, y, vert);
				var vh2 = _Game_Map_isPassable.call(this, x, y2, horz);

				return ((hv1 && hv2) || (vh1 && vh2) || (hv1 && vh1));
			}

			return false;
		}
	};

	Game_Map.prototype.getHeight = function (x, y) {
		return this.isWater(x, y) ? -1 : this.isWall(x, y) ? 1 : 0;
	}

	Game_Map.prototype.isWater = function (x, y) {
		return this.isBoatPassable(x, y) || this.isShipPassable(x, y);
	}

	Game_Map.prototype.isWall = function (x, y) {
		var flags = this.tilesetFlags();
		var tiles = this.allTiles(x, y);
		for (var i = 0; i < tiles.length; i++) {
			var flag = flags[tiles[i]];
			if ((flag & 0x10) !== 0) continue;

			return Tilemap.isWallTile(tiles[i]);
		}
		return true;
	}

	Game_CharacterBase.prototype.toImageDirection = function (d) {
		return isDir4(d) ? d : decomposeX(d);
	};

	Game_CharacterBase.prototype.canPassDiagonally = function (x, y, horz, vert) {
		return this.canPass(x, y, compose(horz, vert));
	};

	Game_CharacterBase.prototype.moveDiagonally = function (horz, vert) {
		return this.moveStraight(compose(horz, vert));
	};

	Game_Character.prototype.turnTowardCharacter = function (character) {
		var sx = this.deltaXFrom(character.x);
		var sy = this.deltaYFrom(character.y);
		var theta = Math.abs(Math.atan2(sy, sx)) || Math.PI * 0.5;
		var phi = Math.PI * 0.5 - Math.abs(Math.PI * 0.5 - theta);
		var direction;
		if (phi < Math.PI * 0.125) {
			direction = (sx > 0 ? 4 : 6);
		} else if (theta < Math.PI * 0.375) {
			direction = (sx > 0 ? (sy > 0 ? 7 : 1) : (sy > 0 ? 9 : 3));
		} else {
			direction = (sy > 0 ? 8 : 2);
		}
		this.setDirection(direction);
	};

	Game_Character.prototype.turnAwayFromCharacter = function (character) {
		var sx = this.deltaXFrom(character.x);
		var sy = this.deltaYFrom(character.y);
		var theta = Math.abs(Math.atan2(sy, sx)) || Math.PI * 0.5;
		var phi = Math.PI * 0.5 - Math.abs(Math.PI * 0.5 - theta);
		var direction;
		if (phi < Math.PI * 0.125) {
			direction = (sx > 0 ? 6 : 4);
		} else if (theta < Math.PI * 0.375) {
			direction = (sx > 0 ? (sy > 0 ? 3 : 9) : (sy > 0 ? 1 : 7));
		} else {
			direction = (sy > 0 ? 2 : 8);
		}
		this.setDirection(direction);
	};

	Game_Character.prototype.turnRight90 = function () {
		switch (this.direction()) {
			case 1: this.setDirection(7); break;
			case 2: this.setDirection(4); break;
			case 3: this.setDirection(1); break;
			case 4: this.setDirection(8); break;
			case 6: this.setDirection(2); break;
			case 7: this.setDirection(9); break;
			case 8: this.setDirection(6); break;
			case 9: this.setDirection(3); break;
		}
	};

	Game_Character.prototype.turnLeft90 = function () {
		switch (this.direction()) {
			case 1: this.setDirection(3); break;
			case 2: this.setDirection(6); break;
			case 3: this.setDirection(9); break;
			case 4: this.setDirection(2); break;
			case 6: this.setDirection(8); break;
			case 7: this.setDirection(1); break;
			case 8: this.setDirection(4); break;
			case 9: this.setDirection(7); break;
		}
	};

	Game_Character.prototype.findDirectionTo = function (goalX, goalY) {
		var searchLimit = this.searchLimit();
		var mapWidth = $gameMap.width();
		var nodeList = [];
		var openList = [];
		var closedList = [];
		var start = {};
		var best = start;

		if (this.x === goalX && this.y === goalY) {
			return 0;
		}

		start.parent = null;
		start.x = this.x;
		start.y = this.y;
		start.g = 0;
		start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
		nodeList.push(start);
		openList.push(start.y * mapWidth + start.x);

		while (nodeList.length > 0) {
			var bestIndex = 0;
			for (var i = 0; i < nodeList.length; i++) {
				if (nodeList[i].f < nodeList[bestIndex].f) {
					bestIndex = i;
				}
			}

			var current = nodeList[bestIndex];
			var x1 = current.x;
			var y1 = current.y;
			var pos1 = y1 * mapWidth + x1;
			var g1 = current.g;

			nodeList.splice(bestIndex, 1);
			openList.splice(openList.indexOf(pos1), 1);
			closedList.push(pos1);

			if (current.x === goalX && current.y === goalY) {
				best = current;
				goaled = true;
				break;
			}

			if (g1 >= searchLimit) {
				continue;
			}

			for (var j = 0; j < 8; j++) {
				var direction = j + (j < 4 ? 1 : 2);
				var x2 = $gameMap.roundXWithDirection(x1, direction);
				var y2 = $gameMap.roundYWithDirection(y1, direction);
				var pos2 = y2 * mapWidth + x2;

				if (closedList.contains(pos2)) {
					continue;
				}
				if (!this.canPass(x1, y1, direction)) {
					continue;
				}

				var g2 = g1 + 1;
				var index2 = openList.indexOf(pos2);

				if (index2 < 0 || g2 < nodeList[index2].g) {
					var neighbor;
					if (index2 >= 0) {
						neighbor = nodeList[index2];
					} else {
						neighbor = {};
						nodeList.push(neighbor);
						openList.push(pos2);
					}
					neighbor.parent = current;
					neighbor.x = x2;
					neighbor.y = y2;
					neighbor.g = g2;
					neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
					if (!best || neighbor.f - neighbor.g < best.f - best.g) {
						best = neighbor;
					}
				}
			}
		}

		var node = best;
		while (node.parent && node.parent !== start) {
			node = node.parent;
		}

		var deltaX1 = $gameMap.deltaX(node.x, start.x);
		var deltaY1 = $gameMap.deltaY(node.y, start.y);
		if (deltaX1 < 0) {
			return (deltaY1 < 0 ? 7 : deltaY1 > 0 ? 1 : 4);
		} else if (deltaX1 > 0) {
			return (deltaY1 < 0 ? 9 : deltaY1 > 0 ? 3 : 6);
		} else if (deltaY1 !== 0) {
			return (deltaY1 < 0 ? 8 : 2);
		}

		var deltaX2 = $gameMap.deltaX(goalX, this.x);
		var deltaY2 = $gameMap.deltaY(goalY, this.y);
		if (deltaX2 < 0) {
			return (deltaY2 < 0 ? 7 : deltaY2 > 0 ? 1 : 4);
		} else if (deltaX2 > 0) {
			return (deltaY2 < 0 ? 9 : deltaY2 > 0 ? 3 : 6);
		} else if (deltaY2 !== 0) {
			return (deltaY2 < 0 ? 8 : 2);
		}

		return 0;
	};

	Game_Character.prototype.turnRandom = function () {
		var value = Math.randomInt(8);
		this.setDirection(value + (value < 4 ? 1 : 2));
	};

	Game_Player.prototype.getInputDirection = function () {
		var direction = Input.dir8;
		if (direction === 0) {
			this._InputDelay = params.delayTime;
		} else if (isDir4(direction)) {
			if (+this._InputDelay > 0) {
				this._InputDelay--;
				direction = 0;
			}
		}

		return direction;
	}

	var _Game_Vehicle_isMapPassable = Game_Vehicle.prototype.isMapPassable;
	Game_Vehicle.prototype.isMapPassable = function (x, y, d) {
		if (isDir4(d)) {
			return _Game_Vehicle_isMapPassable.call(this, x, y, d);
		} else {
			var x2 = $gameMap.roundXWithDirection(x, d);
			var y2 = $gameMap.roundYWithDirection(y, d);
			if (this.isBoat()) {
				return $gameMap.isBoatPassable(x2, y2)
					&& $gameMap.isBoatPassable(x2, y)
					&& $gameMap.isBoatPassable(x, y2);
			} else if (this.isShip()) {
				return $gameMap.isShipPassable(x2, y2)
					&& $gameMap.isShipPassable(x2, y)
					&& $gameMap.isShipPassable(x, y2);
			} else if (this.isAirship()) {
				return true;
			} else {
				return false;
			}
		}
	};

	Game_Event.prototype.setupPageSettings = function () {
		var page = this.page();
		var image = page.image;
		if (image.tileId > 0) {
			this.setTileImage(image.tileId);
		} else {
			this.setImage(image.characterName, image.characterIndex);
		}
		if (this.toImageDirection(this._originalDirection) !== image.direction) {
			this._originalDirection = image.direction;
			this._prelockDirection = 0;
			this.setDirectionFix(false);
			this.setDirection(image.direction);
		}
		if (this._originalPattern !== image.pattern) {
			this._originalPattern = image.pattern;
			this.setPattern(image.pattern);
		}
		this.setMoveSpeed(page.moveSpeed);
		this.setMoveFrequency(page.moveFrequency);
		this.setPriorityType(page.priorityType);
		this.setWalkAnime(page.walkAnime);
		this.setStepAnime(page.stepAnime);
		this.setDirectionFix(page.directionFix);
		this.setThrough(page.through);
		this.setMoveRoute(page.moveRoute);
		this._moveType = page.moveType;
		this._trigger = page.trigger;
		if (this._trigger === 4) {
			this._interpreter = new Game_Interpreter();
		} else {
			this._interpreter = null;
		}
	};

	Sprite_Character.prototype.characterPatternY = function () {
		return (this._character.toImageDirection(this._character.direction()) - 2) / 2;
	};

	if (params.skewAngle !== 0) {
		var _Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
		Sprite_Character.prototype.updateCharacterFrame = function () {
			_Sprite_Character_updateCharacterFrame.call(this);

			var direction = this._character.direction();
			if (direction === 3 || direction === 7) {
				this.skew.y = params.skewAngle;
			} else if (direction === 1 || direction === 9) {
				this.skew.y = -params.skewAngle;
			} else {
				this.skew.y = 0;
			}
		}
	}

	function isDir4(d) {
		return (d !== 0 && (d & 0x01) === 0);
	}

	function decomposeX(d) {
		return ((d === 1 || d === 7) ? 4 : (d === 3 || d === 9) ? 6 : d);
	}

	function decomposeY(d) {
		return ((d === 1 || d === 3) ? 2 : (d === 7 || d === 9) ? 8 : d);
	}

	function compose(horz, vert) {
		var d = (horz === 4 ? 1 : horz === 6 ? 3 : 2) + (vert === 2 ? 0 : vert === 8 ? 6 : 3);
		return (d !== 5 ? d : 0);
	}

});