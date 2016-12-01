/*!
/*:
 * @plugindesc 方向転換・横移動制限・連続移動制限
 * @author F_
 *
 * @param ChangeKeyMapper
 * @desc 自動的にキーの割り当てを変更するかどうか。
 * @default true
 *
 * @param Support8Way
 * @desc 八方向移動に対応するかどうか。
 * @default auto
 *
 * @help
 * 方向転換や斜め方向のみの移動、タッチによる連続移動の制限など、
 * 誤った操作をしづらくするためのプラグイン。
 *
 * 'pageup', 'pagedown'を修飾キーとして使うため注意。
 * また設定によってはコントロールキーも修飾キーとして再割り当てされる。
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
    var plugin, params, CW_TABLE, CCW_TABLE, rotateCW, rotateCCW, GameTempExtensions, GamePlayerExtensions;
    function toDirection(x, y) {
        if (x < 0) {
            return (y < 0 ? 7 : y > 0 ? 1 : 4);
        }
        else if (x > 0) {
            return (y < 0 ? 9 : y > 0 ? 3 : 6);
        }
        else {
            return (y < 0 ? 8 : y > 0 ? 2 : 0);
        }
    }
    function isPressed(buttons) {
        if (Array.isArray(buttons)) {
            return buttons.some(function (button) { return Input.isPressed(button); });
        }
        else {
            return Input.isPressed(buttons);
        }
    }
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.validate(function ($) {
                return {
                    changeKeyMapper: $.bool('ChangeKeyMapper'),
                    support8Way: $.lower('Support8Way') === 'auto'
                        ? MVPlugin.PluginManager.contains('EightWayMovement')
                        : $.bool('Support8Way'),
                };
            });
            CW_TABLE = [0, 4, 1, 2, 7, 0, 3, 8, 9, 6];
            CCW_TABLE = [0, 2, 3, 6, 1, 0, 9, 4, 7, 8];
            if (params.support8Way) {
                rotateCW = function (d) { return CW_TABLE[d]; };
                rotateCCW = function (d) { return CCW_TABLE[d]; };
            }
            else {
                rotateCW = function (d) { return CW_TABLE[CW_TABLE[d]]; };
                rotateCCW = function (d) { return CCW_TABLE[CCW_TABLE[d]]; };
            }
            GameTempExtensions = (function () {
                function GameTempExtensions() {
                }
                GameTempExtensions.setDestination = function (base) {
                    return function (x, y) {
                        if ($gamePlayer) {
                            var deltaX = Math.abs(x - $gamePlayer.x);
                            var deltaY = Math.abs(y - $gamePlayer.y);
                            if (params.support8Way ? (deltaX <= 1 && deltaY <= 1) : (deltaX + deltaY <= 1)) {
                                base.call(this, x, y);
                            }
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameTempExtensions, "setDestination", null);
                GameTempExtensions = __decorate([
                    MVPlugin.extension(Game_Temp)
                ], GameTempExtensions);
                return GameTempExtensions;
            }());
            exports_1("GameTempExtensions", GameTempExtensions);
            GamePlayerExtensions = (function () {
                function GamePlayerExtensions() {
                }
                GamePlayerExtensions.moveByInput = function (base) {
                    return function () {
                        var dontMove = isPressed(this.modifierButton) && !isPressed(this.dashButton);
                        var changeDirection = (TouchInput.wheelY !== 0);
                        if (dontMove || changeDirection) {
                            this.changeDirectionByInput();
                        }
                        else {
                            base.call(this);
                        }
                    };
                };
                GamePlayerExtensions.changeDirectionByInput = function () {
                    return function () {
                        if (!this.isMoving() && this.canMove()) {
                            var direction = this.getInputDirection();
                            if (direction === 0 && TouchInput.wheelY !== 0) {
                                var clockwise = (TouchInput.wheelY > 0);
                                direction = (clockwise ? rotateCW(this.direction()) : rotateCCW(this.direction()));
                            }
                            if (direction === 0 && $gameTemp.isDestinationValid()) {
                                var dstX = $gameTemp.destinationX();
                                var dstY = $gameTemp.destinationY();
                                var deltaX = $gameMap.deltaX(dstX, this.x);
                                var deltaY = $gameMap.deltaY(dstY, this.y);
                                direction = toDirection(deltaX, deltaY);
                            }
                            $gameTemp.clearDestination();
                            if (direction > 0) {
                                this.setDirection(direction);
                            }
                        }
                    };
                };
                GamePlayerExtensions.getInputDirection = function (base) {
                    return function () {
                        var direction = base.call(this);
                        var diagonalOnly = isPressed(this.dashButton) && isPressed(this.modifierButton);
                        if (diagonalOnly && direction % 2 === 0) {
                            direction = 0;
                        }
                        return direction;
                    };
                };
                GamePlayerExtensions.isDashButtonPressed = function (base) {
                    return function () {
                        var shift = isPressed(this.dashButton) && !isPressed(this.modifierButton);
                        if (ConfigManager.alwaysDash) {
                            return !shift;
                        }
                        else {
                            return shift;
                        }
                    };
                };
                Object.defineProperty(GamePlayerExtensions, "dashButton", {
                    get: function () { return ['dash', 'shift']; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(GamePlayerExtensions, "modifierButton", {
                    get: function () { return ['modifier', 'pageup', 'pagedown']; },
                    enumerable: true,
                    configurable: true
                });
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "moveByInput", null);
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "changeDirectionByInput", null);
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "getInputDirection", null);
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "isDashButtonPressed", null);
                __decorate([
                    MVPlugin.property
                ], GamePlayerExtensions, "dashButton", null);
                __decorate([
                    MVPlugin.property
                ], GamePlayerExtensions, "modifierButton", null);
                GamePlayerExtensions = __decorate([
                    MVPlugin.extension(Game_Player)
                ], GamePlayerExtensions);
                return GamePlayerExtensions;
            }());
            exports_1("GamePlayerExtensions", GamePlayerExtensions);
            if (params.changeKeyMapper) {
                Input.keyMapper[17] = 'modifier';
            }
        }
    }
});
