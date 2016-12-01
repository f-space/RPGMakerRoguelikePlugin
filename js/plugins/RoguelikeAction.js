/*!
/*:
 * @plugindesc ローグライク：アクション
 * @author F_
 *
 * @help
 * ローグライクにおけるアクションの検出および定義。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['Roguelike', 'RoguelikeCore'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var Roguelike_1, RoguelikeCore_1;
    var plugin, GamePlayerExtensions, GameEventExtensions;
    return {
        setters:[
            function (Roguelike_1_1) {
                Roguelike_1 = Roguelike_1_1;
            },
            function (RoguelikeCore_1_1) {
                RoguelikeCore_1 = RoguelikeCore_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            GamePlayerExtensions = (function () {
                function GamePlayerExtensions() {
                }
                GamePlayerExtensions.moveStraight = function (base) {
                    return function (d) {
                        if (Roguelike_1.DungeonManager.inFloor) {
                            RoguelikeCore_1.PlayerAction.set(Roguelike_1.ActionType.Move, Function.prototype.apply.bind(base, this, arguments));
                        }
                        else {
                            base.apply(this, arguments);
                        }
                    };
                };
                GamePlayerExtensions.moveDiagonally = function (base) {
                    return function (horz, vert) {
                        if (Roguelike_1.DungeonManager.inFloor) {
                            RoguelikeCore_1.PlayerAction.set(Roguelike_1.ActionType.Move, Function.prototype.apply.bind(base, this, arguments));
                        }
                        else {
                            base.apply(this, arguments);
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "moveStraight", null);
                __decorate([
                    MVPlugin.method
                ], GamePlayerExtensions, "moveDiagonally", null);
                GamePlayerExtensions = __decorate([
                    MVPlugin.extension(Game_Player)
                ], GamePlayerExtensions);
                return GamePlayerExtensions;
            }());
            exports_1("GamePlayerExtensions", GamePlayerExtensions);
            GameEventExtensions = (function () {
                function GameEventExtensions() {
                }
                GameEventExtensions.distancePerFrame = function (base) {
                    return function () {
                        if (Roguelike_1.DungeonManager.inFloor) {
                            return $gamePlayer.distancePerFrame();
                        }
                        else {
                            return base.apply(this, arguments);
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameEventExtensions, "distancePerFrame", null);
                GameEventExtensions = __decorate([
                    MVPlugin.extension(Game_Event)
                ], GameEventExtensions);
                return GameEventExtensions;
            }());
            exports_1("GameEventExtensions", GameEventExtensions);
        }
    }
});
