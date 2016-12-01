/*!
/*:
 * @plugindesc シーンのリダイレクト
 * @author F_
 *
 * @help
 * 特定のシーンに対する操作を別のシーンへの操作に差し替えるプラグイン。
 *
 * 単体使用不可。
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
    var plugin, SceneRedirection;
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            SceneRedirection = (function () {
                function SceneRedirection() {
                }
                SceneRedirection.initialize = function () {
                    this.TARGET_METHODS.forEach(function (method) {
                        this.redirect(method);
                    }, this);
                };
                SceneRedirection.get = function (from) {
                    var name = System.Utility.getFunctionName(from);
                    return this.dict[name] || from;
                };
                SceneRedirection.set = function (from, to) {
                    var name = System.Utility.getFunctionName(from);
                    this.dict[name] = to;
                };
                SceneRedirection.redirect = function (method) {
                    var manager = SceneManager;
                    var baseMethod = manager[method];
                    if (System.Utility.isFunction(baseMethod)) {
                        var isSceneCtor_1 = this.isSceneConstructor;
                        manager[method] = function () {
                            var args = Array.prototype.slice.call(arguments).map(function (x) {
                                return (isSceneCtor_1(x) ? SceneRedirection.get(x) : x);
                            });
                            return baseMethod.apply(this, args);
                        };
                    }
                };
                SceneRedirection.isSceneConstructor = function (value) {
                    return System.Utility.isFunction(value) && value.prototype instanceof Scene_Base;
                };
                SceneRedirection.TARGET_METHODS = ['run', 'isNextScene', 'isPreviousScene', 'goto', 'push'];
                SceneRedirection.dict = {};
                SceneRedirection = __decorate([
                    plugin.type
                ], SceneRedirection);
                return SceneRedirection;
            }());
            exports_1("SceneRedirection", SceneRedirection);
            SceneRedirection.initialize();
        }
    }
});
