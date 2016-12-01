/*!
/*:
 * @plugindesc ズーム機能の拡張
 * @author F_
 *
 * @help
 * カメラを設定することによるズーム機能の拡張。
 *
 * 基本的に単体使用不可。
 * どうしても使用したい場合にはスクリプトイベントを設定して以下のコマンドのいずれかを実行。
 *
 * // 特定位置へのズーム
 * $gameScreen.setCamera('fixed', x, y, scale, bounded);
 *
 * // プレイヤー位置へのズーム
 * $gameScreen.setCamera('player', scale, bounded);
 *
 * // ズーム状態のリセット
 * $gameScreen.setCamera(null);
 *
 * ただし、以下の単語の部分は対応する値で置き換えること。
 * x: スクリーン上のx座標
 * y: スクリーン上のy座標
 * scale: 拡大率
 * bounded: ステージ外を表示するならfalse、表示しないならtrue
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
    var plugin, Camera, FixedTarget, TileTarget, PlayerTarget, Zoom, GameScreenExtensions, GameMapExtensions, GameCharacterBaseExtensions, SpritesetMapExtensions;
    function screenCenterX() {
        return Graphics.width * 0.5;
    }
    function screenCenterY() {
        return Graphics.height * 0.5;
    }
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            Camera = (function () {
                function Camera(target, offsetX, offsetY, scale, bounded) {
                    this.target = target || null;
                    this.offsetX = offsetX || 0;
                    this.offsetY = offsetY || 0;
                    this.scale = scale || 1;
                    this.bounded = !!bounded;
                }
                Object.defineProperty(Camera.prototype, "x", {
                    get: function () { return (this.target ? this.target.x : 0) + this.offsetX; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Camera.prototype, "y", {
                    get: function () { return (this.target ? this.target.y : 0) + this.offsetY; },
                    enumerable: true,
                    configurable: true
                });
                Camera.prototype.toJSON = function () {
                    return {
                        target: this.target,
                        offsetX: this.offsetX,
                        offsetY: this.offsetY,
                        scale: this.scale,
                        bounded: this.bounded,
                    };
                };
                Camera.prototype.fromJSON = function (data) {
                    this.target = data.target;
                    this.offsetX = data.offsetX;
                    this.offsetY = data.offsetY;
                    this.scale = data.scale;
                    this.bounded = data.bounded;
                };
                Camera = __decorate([
                    plugin.type
                ], Camera);
                return Camera;
            }());
            exports_1("Camera", Camera);
            FixedTarget = (function () {
                function FixedTarget(x, y) {
                    this.x = x;
                    this.y = y;
                }
                FixedTarget.prototype.toJSON = function () {
                    return { x: this.x, y: this.y };
                };
                FixedTarget.prototype.fromJSON = function (data) {
                    this.x = data.x;
                    this.y = data.y;
                };
                FixedTarget = __decorate([
                    plugin.type
                ], FixedTarget);
                return FixedTarget;
            }());
            exports_1("FixedTarget", FixedTarget);
            TileTarget = (function () {
                function TileTarget(tileX, tileY) {
                    this.tileX = tileX;
                    this.tileY = tileY;
                }
                Object.defineProperty(TileTarget.prototype, "x", {
                    get: function () {
                        var x = $gameMap.adjustX(this.tileX);
                        var w = $gameMap.tileWidth();
                        return Math.round((x + 0.5) * w);
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TileTarget.prototype, "y", {
                    get: function () {
                        var y = $gameMap.adjustY(this.tileY);
                        var h = $gameMap.tileHeight();
                        return Math.round((y + 0.5) * h);
                    },
                    enumerable: true,
                    configurable: true
                });
                TileTarget = __decorate([
                    plugin.type
                ], TileTarget);
                return TileTarget;
            }());
            exports_1("TileTarget", TileTarget);
            PlayerTarget = (function () {
                function PlayerTarget() {
                }
                Object.defineProperty(PlayerTarget.prototype, "x", {
                    get: function () { return $gamePlayer.screenX(); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(PlayerTarget.prototype, "y", {
                    get: function () { return $gamePlayer.screenY(); },
                    enumerable: true,
                    configurable: true
                });
                PlayerTarget.prototype.toJSON = function () { return {}; };
                PlayerTarget.prototype.fromJSON = function (data) { };
                PlayerTarget = __decorate([
                    plugin.type
                ], PlayerTarget);
                return PlayerTarget;
            }());
            exports_1("PlayerTarget", PlayerTarget);
            Zoom = (function () {
                function Zoom(x, y, scale, bounded) {
                    this.x = x;
                    this.y = y;
                    this.scale = scale;
                    if (bounded)
                        this.adjust();
                }
                Object.defineProperty(Zoom, "normal", {
                    get: function () {
                        var x = $gameScreen.zoomX();
                        var y = $gameScreen.zoomY();
                        var scale = $gameScreen.zoomScale();
                        return new Zoom(x, y, scale);
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Zoom, "camera", {
                    get: function () {
                        var camera = $gameScreen.camera;
                        return (camera ? new Zoom(camera.x, camera.y, camera.scale, camera.bounded) : null);
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(Zoom, "complex", {
                    get: function () {
                        var normalZoom = Zoom.normal;
                        var cameraZoom = Zoom.camera;
                        var scale = normalZoom.scale;
                        var x = normalZoom.x * (1 - scale);
                        var y = normalZoom.y * (1 - scale);
                        if (cameraZoom) {
                            var cscale = cameraZoom.scale;
                            var cx = screenCenterX() - cameraZoom.x * cscale;
                            var cy = screenCenterY() - cameraZoom.y * cscale;
                            scale = scale * cscale;
                            x = x * cscale + cx;
                            y = y * cscale + cy;
                        }
                        return new Zoom(x, y, scale);
                    },
                    enumerable: true,
                    configurable: true
                });
                Zoom.prototype.adjust = function () {
                    if (this.scale < 1) {
                        this.x = screenCenterX();
                        this.y = screenCenterY();
                    }
                    else {
                        var map = $gameMap;
                        var halfScreenWidth = screenCenterX() / this.scale;
                        var halfScreenHeight = screenCenterY() / this.scale;
                        var displayX = map.displayX();
                        var displayY = map.displayY();
                        var tileWidth = map.tileWidth();
                        var tileHeight = map.tileHeight();
                        var left = displayX + (this.x - halfScreenWidth) / tileWidth;
                        if (left <= 0) {
                            this.x = halfScreenWidth;
                        }
                        else {
                            var right = displayX + (this.x + halfScreenWidth) / tileWidth;
                            if (right >= map.width()) {
                                this.x = screenCenterX() * 2 - halfScreenWidth;
                            }
                        }
                        var top_1 = displayY + (this.y - halfScreenHeight) / tileHeight;
                        if (top_1 <= 0) {
                            this.y = halfScreenHeight;
                        }
                        else {
                            var bottom = displayY + (this.y + halfScreenHeight) / tileHeight;
                            if (bottom >= map.height()) {
                                this.y = screenCenterY() * 2 - halfScreenHeight;
                            }
                        }
                    }
                };
                return Zoom;
            }());
            GameScreenExtensions = (function () {
                function GameScreenExtensions() {
                }
                Object.defineProperty(GameScreenExtensions, "camera", {
                    get: function () { return this._camera || null; },
                    set: function (value) { this._camera = value; },
                    enumerable: true,
                    configurable: true
                });
                __decorate([
                    MVPlugin.property
                ], GameScreenExtensions, "camera", null);
                GameScreenExtensions = __decorate([
                    MVPlugin.extension(Game_Screen)
                ], GameScreenExtensions);
                return GameScreenExtensions;
            }());
            exports_1("GameScreenExtensions", GameScreenExtensions);
            GameMapExtensions = (function () {
                function GameMapExtensions() {
                }
                GameMapExtensions.canvasToMapX = function (base) {
                    return function (x) {
                        var zoom = Zoom.camera;
                        if (zoom) {
                            x = zoom.x + (x - screenCenterX()) / zoom.scale;
                        }
                        return base.call(this, x);
                    };
                };
                GameMapExtensions.canvasToMapY = function (base) {
                    return function (y) {
                        var zoom = Zoom.camera;
                        if (zoom) {
                            y = zoom.y + (y - screenCenterY()) / zoom.scale;
                        }
                        return base.call(this, y);
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "canvasToMapX", null);
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "canvasToMapY", null);
                GameMapExtensions = __decorate([
                    MVPlugin.extension(Game_Map)
                ], GameMapExtensions);
                return GameMapExtensions;
            }());
            exports_1("GameMapExtensions", GameMapExtensions);
            GameCharacterBaseExtensions = (function () {
                function GameCharacterBaseExtensions() {
                }
                GameCharacterBaseExtensions.isNearTheScreen = function (base) {
                    return function () {
                        var camera = $gameScreen.camera;
                        var scale = camera ? camera.scale : 1;
                        var gw = Graphics.width / scale;
                        var gh = Graphics.height / scale;
                        var tw = $gameMap.tileWidth();
                        var th = $gameMap.tileHeight();
                        var px = this.scrolledX() * tw + tw / 2 - gw / 2;
                        var py = this.scrolledY() * th + th / 2 - gh / 2;
                        return px >= -gw && px <= gw && py >= -gh && py <= gh;
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameCharacterBaseExtensions, "isNearTheScreen", null);
                GameCharacterBaseExtensions = __decorate([
                    MVPlugin.extension(Game_CharacterBase)
                ], GameCharacterBaseExtensions);
                return GameCharacterBaseExtensions;
            }());
            exports_1("GameCharacterBaseExtensions", GameCharacterBaseExtensions);
            SpritesetMapExtensions = (function () {
                function SpritesetMapExtensions() {
                }
                SpritesetMapExtensions.updatePosition = function (base) {
                    return function () {
                        var zoom = Zoom.complex;
                        this.scale.x = zoom.scale;
                        this.scale.y = zoom.scale;
                        this.x = Math.round(zoom.x);
                        this.y = Math.round(zoom.y);
                        this.x += Math.round($gameScreen.shake());
                    };
                };
                __decorate([
                    MVPlugin.method
                ], SpritesetMapExtensions, "updatePosition", null);
                SpritesetMapExtensions = __decorate([
                    MVPlugin.extension(Spriteset_Map)
                ], SpritesetMapExtensions);
                return SpritesetMapExtensions;
            }());
            exports_1("SpritesetMapExtensions", SpritesetMapExtensions);
        }
    }
});
