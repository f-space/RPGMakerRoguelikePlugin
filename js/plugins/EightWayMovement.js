/*!
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
System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var plugin, params, GameMapExtensions, GameCharacterBaseExtensions, GameCharacterExtensions, GamePlayerExtensions, GameVehicleExtensions, SpriteCharacterExtensions;
    function isDir4(d) {
        return ((d & 0x01) === 0);
    }
    function dirX(d) {
        return ((d === 1 || d === 7) ? 4 : (d === 3 || d === 9) ? 6 : d);
    }
    function dirY(d) {
        return ((d === 1 || d === 3) ? 2 : (d === 7 || d === 9) ? 8 : d);
    }
    function dir8(horz, vert) {
        var d = (horz === 4 ? 1 : horz === 6 ? 3 : 2) + (vert === 2 ? 0 : vert === 8 ? 6 : 3);
        return (d !== 5 ? d : 0);
    }
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.validate(function ($) {
                return {
                    delayTime: Math.max(0, $.int('DelayTime')),
                    skewAngle: $.float('SkewAngle') * Math.PI / 180,
                };
            });
            GameMapExtensions = (function () {
                function GameMapExtensions() {
                }
                GameMapExtensions.xWithDirection = function (base) {
                    return function (x, d) {
                        return base.call(this, x, dirX(d));
                    };
                };
                GameMapExtensions.yWithDirection = function (base) {
                    return function (y, d) {
                        return base.call(this, y, dirY(d));
                    };
                };
                GameMapExtensions.roundXWithDirection = function (base) {
                    return function (x, d) {
                        return base.call(this, x, dirX(d));
                    };
                };
                GameMapExtensions.roundYWithDirection = function (base) {
                    return function (y, d) {
                        return base.call(this, y, dirY(d));
                    };
                };
                GameMapExtensions.doScroll = function (base) {
                    return function (direction, distance) {
                        if (isDir4(direction)) {
                            base.call(this, direction, distance);
                        }
                        else {
                            var amount = distance / GameMapExtensions.SQRT_2;
                            base.call(this, dirY(direction), amount);
                            base.call(this, dirX(direction), amount);
                        }
                    };
                };
                GameMapExtensions.isPassable = function (base) {
                    return function (x, y, d) {
                        if (isDir4(d)) {
                            return base.call(this, x, y, d);
                        }
                        else {
                            var horz = dirX(d);
                            var vert = dirY(d);
                            var x2 = this.roundXWithDirection(x, horz);
                            var y2 = this.roundYWithDirection(y, vert);
                            var h11 = this.getHeight(x, y);
                            var h12 = this.getHeight(x, y2);
                            var h21 = this.getHeight(x2, y);
                            var h22 = this.getHeight(x2, y2);
                            if (Math.max(h11, h22) <= Math.max(h12, h21)) {
                                var hv1 = base.call(this, x, y, horz);
                                var hv2 = base.call(this, x2, y, vert);
                                var vh1 = base.call(this, x, y, vert);
                                var vh2 = base.call(this, x, y2, horz);
                                return ((hv1 && hv2) || (vh1 && vh2) || (hv1 && vh1));
                            }
                            return false;
                        }
                    };
                };
                GameMapExtensions.getHeight = function () {
                    return function (x, y) {
                        return this.isWater(x, y) ? -1 : this.isWall(x, y) ? 1 : 0;
                    };
                };
                GameMapExtensions.isWater = function () {
                    return function (x, y) {
                        return this.isBoatPassable(x, y) || this.isShipPassable(x, y);
                    };
                };
                GameMapExtensions.isWall = function () {
                    return function (x, y) {
                        var flags = this.tilesetFlags();
                        var tiles = this.allTiles(x, y);
                        for (var _i = 0, tiles_1 = tiles; _i < tiles_1.length; _i++) {
                            var tile = tiles_1[_i];
                            var flag = flags[tile];
                            if ((flag & 0x10) !== 0)
                                continue;
                            return Tilemap.isWallTile(tile);
                        }
                        return true;
                    };
                };
                GameMapExtensions.SQRT_2 = Math.sqrt(2);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "xWithDirection", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "yWithDirection", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "roundXWithDirection", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "roundYWithDirection", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "doScroll", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "isPassable", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "getHeight", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "isWater", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "isWall", null);
                GameMapExtensions = __decorate([
                    MVPlugin.extension(Game_Map)
                ], GameMapExtensions);
                return GameMapExtensions;
            }());
            exports_1("GameMapExtensions", GameMapExtensions);
            GameCharacterBaseExtensions = (function () {
                function GameCharacterBaseExtensions() {
                }
                GameCharacterBaseExtensions.toImageDirection = function () {
                    return function (d) {
                        return isDir4(d) ? d : dirX(d);
                    };
                };
                GameCharacterBaseExtensions.canPassDiagonally = function (base) {
                    return function (x, y, horz, vert) {
                        return this.canPass(x, y, dir8(horz, vert));
                    };
                };
                GameCharacterBaseExtensions.moveDiagonally = function (base) {
                    return function (horz, vert) {
                        this.moveStraight(dir8(horz, vert));
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameCharacterBaseExtensions, "toImageDirection", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterBaseExtensions, "canPassDiagonally", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterBaseExtensions, "moveDiagonally", null);
                GameCharacterBaseExtensions = __decorate([
                    MVPlugin.extension(Game_CharacterBase)
                ], GameCharacterBaseExtensions);
                return GameCharacterBaseExtensions;
            }());
            exports_1("GameCharacterBaseExtensions", GameCharacterBaseExtensions);
            GameCharacterExtensions = (function () {
                function GameCharacterExtensions() {
                }
                GameCharacterExtensions.moveRandom = function (base) {
                    return function () {
                        var value = Math.randomInt(8);
                        var direction = value + (value < 4 ? 1 : 2);
                        if (this.canPass(this.x, this.y, direction)) {
                            this.moveStraight(direction);
                        }
                    };
                };
                GameCharacterExtensions.moveTowardCharacter = function (base) {
                    return function (character) {
                        var direction = GameCharacterExtensions.directionFrom.call(this, character);
                        this.moveStraight(this.reverseDir(direction));
                        if (!this.isMovementSucceeded()) {
                            base.call(this, character);
                        }
                    };
                };
                GameCharacterExtensions.moveAwayFromCharacter = function (base) {
                    return function (character) {
                        var direction = GameCharacterExtensions.directionFrom.call(this, character);
                        this.moveStraight(direction);
                        if (!this.isMovementSucceeded()) {
                            base.call(this, character);
                        }
                    };
                };
                GameCharacterExtensions.turnTowardCharacter = function (base) {
                    return function (character) {
                        var direction = GameCharacterExtensions.directionFrom.call(this, character);
                        this.setDirection(this.reverseDir(direction));
                    };
                };
                GameCharacterExtensions.turnAwayFromCharacter = function (base) {
                    return function (character) {
                        var direction = GameCharacterExtensions.directionFrom.call(this, character);
                        this.setDirection(direction);
                    };
                };
                GameCharacterExtensions.turnRight90 = function (base) {
                    return function () {
                        this.setDirection(GameCharacterExtensions.TURN_RIGHT_TABLE[this.direction()]);
                    };
                };
                GameCharacterExtensions.turnLeft90 = function (base) {
                    return function () {
                        this.setDirection(GameCharacterExtensions.TURN_LEFT_TABLE[this.direction()]);
                    };
                };
                GameCharacterExtensions.turnRandom = function (base) {
                    return function () {
                        var value = Math.randomInt(8);
                        this.setDirection(value + (value < 4 ? 1 : 2));
                    };
                };
                GameCharacterExtensions.findDirectionTo = function (base) {
                    return function (goalX, goalY) {
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
                                    var neighbor = void 0;
                                    if (index2 >= 0) {
                                        neighbor = nodeList[index2];
                                    }
                                    else {
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
                        }
                        else if (deltaX1 > 0) {
                            return (deltaY1 < 0 ? 9 : deltaY1 > 0 ? 3 : 6);
                        }
                        else if (deltaY1 !== 0) {
                            return (deltaY1 < 0 ? 8 : 2);
                        }
                        var deltaX2 = $gameMap.deltaX(goalX, this.x);
                        var deltaY2 = $gameMap.deltaY(goalY, this.y);
                        if (deltaX2 < 0) {
                            return (deltaY2 < 0 ? 7 : deltaY2 > 0 ? 1 : 4);
                        }
                        else if (deltaX2 > 0) {
                            return (deltaY2 < 0 ? 9 : deltaY2 > 0 ? 3 : 6);
                        }
                        else if (deltaY2 !== 0) {
                            return (deltaY2 < 0 ? 8 : 2);
                        }
                        return 0;
                    };
                };
                GameCharacterExtensions.directionFrom = function (character) {
                    var dx = this.deltaXFrom(character.x);
                    var dy = this.deltaYFrom(character.y);
                    var s = Math.atan2(dy, dx) / (Math.PI * 2);
                    var t = (s + (1 + 1 / 16)) % 1;
                    var index = Math.floor(t * 8);
                    return GameCharacterExtensions.ANGLE_TO_DIRECTION[index];
                };
                GameCharacterExtensions.TURN_RIGHT_TABLE = [0, 4, 1, 2, 7, 0, 3, 8, 9, 6];
                GameCharacterExtensions.TURN_LEFT_TABLE = [0, 2, 3, 6, 1, 0, 9, 4, 7, 8];
                GameCharacterExtensions.ANGLE_TO_DIRECTION = [6, 3, 2, 1, 4, 7, 8, 9];
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "moveRandom", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "moveTowardCharacter", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "moveAwayFromCharacter", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "turnTowardCharacter", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "turnAwayFromCharacter", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "turnRight90", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "turnLeft90", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "turnRandom", null);
                __decorate([
                    MVPlugin.method
                ], GameCharacterExtensions, "findDirectionTo", null);
                GameCharacterExtensions = __decorate([
                    MVPlugin.extension(Game_Character)
                ], GameCharacterExtensions);
                return GameCharacterExtensions;
            }());
            exports_1("GameCharacterExtensions", GameCharacterExtensions);
            GamePlayerExtensions = (function () {
                function GamePlayerExtensions() {
                }
                GamePlayerExtensions.getInputDirection = function (base) {
                    return function () {
                        var direction = Input.dir8;
                        if (direction === 0) {
                            direction = +this._deferredInputDirection;
                            this._inputDelay = params.delayTime;
                            this._deferredInputDirection = 0;
                        }
                        else if (isDir4(direction) && this._inputDelay > 0) {
                            this._inputDelay--;
                            this._deferredInputDirection = direction;
                            direction = 0;
                        }
                        else {
                            this._inputDelay = 0;
                            this._deferredInputDirection = 0;
                        }
                        return direction;
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "getInputDirection", null);
                GamePlayerExtensions = __decorate([
                    MVPlugin.extension(Game_Player)
                ], GamePlayerExtensions);
                return GamePlayerExtensions;
            }());
            exports_1("GamePlayerExtensions", GamePlayerExtensions);
            GameVehicleExtensions = (function () {
                function GameVehicleExtensions() {
                }
                GameVehicleExtensions.isMapPassable = function (base) {
                    return function (x, y, d) {
                        if (isDir4(d)) {
                            return base.call(this, x, y, d);
                        }
                        else {
                            var x2 = $gameMap.roundXWithDirection(x, d);
                            var y2 = $gameMap.roundYWithDirection(y, d);
                            if (this.isBoat()) {
                                return $gameMap.isBoatPassable(x2, y2)
                                    && $gameMap.isBoatPassable(x2, y)
                                    && $gameMap.isBoatPassable(x, y2);
                            }
                            else if (this.isShip()) {
                                return $gameMap.isShipPassable(x2, y2)
                                    && $gameMap.isShipPassable(x2, y)
                                    && $gameMap.isShipPassable(x, y2);
                            }
                            else if (this.isAirship()) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameVehicleExtensions, "isMapPassable", null);
                GameVehicleExtensions = __decorate([
                    MVPlugin.extension(Game_Vehicle)
                ], GameVehicleExtensions);
                return GameVehicleExtensions;
            }());
            exports_1("GameVehicleExtensions", GameVehicleExtensions);
            SpriteCharacterExtensions = (function () {
                function SpriteCharacterExtensions() {
                }
                SpriteCharacterExtensions.characterPatternY = function (base) {
                    return function () {
                        return (this._character.toImageDirection(this._character.direction()) - 2) / 2;
                    };
                };
                SpriteCharacterExtensions.updateCharacterFrame = function (base) {
                    return function () {
                        base.call(this);
                        var direction = this._character.direction();
                        if (direction === 3 || direction === 7) {
                            this.skew.y = params.skewAngle;
                        }
                        else if (direction === 1 || direction === 9) {
                            this.skew.y = -params.skewAngle;
                        }
                        else {
                            this.skew.y = 0;
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], SpriteCharacterExtensions, "characterPatternY", null);
                __decorate([
                    MVPlugin.methodIf(params.skewAngle !== 0)
                ], SpriteCharacterExtensions, "updateCharacterFrame", null);
                SpriteCharacterExtensions = __decorate([
                    MVPlugin.extension(Sprite_Character)
                ], SpriteCharacterExtensions);
                return SpriteCharacterExtensions;
            }());
            exports_1("SpriteCharacterExtensions", SpriteCharacterExtensions);
        }
    }
});
