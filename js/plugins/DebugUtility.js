/*!
/*:
 * @plugindesc デバッグの支援
 * @author F_
 *
 * @param KeyCodeToToggleUI
 * @desc コマンドUIを表示・非表示にするためのキーコード。
 * @default 9
 *
 * @param MaxHistory
 * @desc 履歴の最大数。
 * @default 50
 *
 * @help
 * デバッグを支援するプラグイン。
 *
 * --- コマンド ---
 * 特定のキー（デフォルトはタブ）を押すとコマンド入力画面を表示。
 * 別のプラグインからコマンドを登録しておくと、実行時に呼び出せる。
 *
 * // デバッグコマンドの登録
 * Debug.Command.register('name', function (arg1, arg2, ...) {
 *     // process;
 *     return 'message';
 * }, true); // configurable (optional)
 *
 * # デフォルトコマンド
 * * exit ゲームを終了する。
 * * eval 入力した式を評価する。
 * * new 指定した名前と式で新たなコマンドを作成する。名前の後に@から始まる識別子を与えるとパラメータとして解釈する。
 * * delete 作成したコマンドを破棄する。
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
    var plugin, params, EnterKeyCode, UpKeyCode, DownKeyCode, Command;
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.validate(function ($) {
                return {
                    keycode: $.int('KeyCodeToToggleUI'),
                    maxHistory: Math.max(0, $.int('MaxHistory')),
                };
            });
            EnterKeyCode = 13;
            UpKeyCode = 38;
            DownKeyCode = 40;
            Command = (function () {
                function Command() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Object.defineProperty(Command, "isOpen", {
                    get: function () { return this.layer.style.display !== 'none'; },
                    enumerable: true,
                    configurable: true
                });
                Command.initialize = function () {
                    this.layer = this.createUILayer();
                    this.input = this.createInputArea();
                    this.layer.appendChild(this.input);
                    document.body.appendChild(this.layer);
                    document.addEventListener('keydown', this.onKeyDown.bind(this), true);
                    document.addEventListener('mousedown', this.discardInputIfOpen.bind(this), true);
                    document.addEventListener('wheel', this.discardInputIfOpen.bind(this), true);
                    document.addEventListener('touchstart', this.discardInputIfOpen.bind(this), true);
                };
                Command.register = function (name, command, configurable) {
                    this.checkCommandName(name);
                    var descriptor = Object.getOwnPropertyDescriptor(this.commands, name);
                    if (descriptor && !descriptor.configurable) {
                        this.throwUncofigurableError(name);
                    }
                    Object.defineProperty(this.commands, name, { value: command, configurable: !!configurable });
                };
                Command.unregister = function (name) {
                    this.checkCommandName(name);
                    var descriptor = Object.getOwnPropertyDescriptor(this.commands, name);
                    if (descriptor) {
                        if (!descriptor.configurable) {
                            this.throwUncofigurableError(name);
                        }
                        delete this.commands[name];
                    }
                    else {
                        throw new Error("'" + name + "' is not found.");
                    }
                };
                Command.createUILayer = function () {
                    var layer = document.createElement('div');
                    layer.style.display = 'none';
                    layer.style.position = 'fixed';
                    layer.style.left = '0px';
                    layer.style.right = '0px';
                    layer.style.top = '0px';
                    layer.style.bottom = '0px';
                    return layer;
                };
                Command.createInputArea = function () {
                    var input = document.createElement('input');
                    input.type = 'text';
                    input.style.display = 'block';
                    input.style.width = '90%';
                    input.style.margin = '10px auto';
                    input.style.padding = '5px 10px';
                    input.style.fontSize = '16px';
                    input.style.fontFamily = 'Consolas, monospace';
                    return input;
                };
                Command.onKeyDown = function (event) {
                    if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                        switch (event.keyCode) {
                            case params.keycode:
                                this.toggleVisibility();
                                break;
                            case EnterKeyCode:
                                if (this.isOpen)
                                    this.execute();
                                break;
                            case UpKeyCode:
                                if (this.isOpen)
                                    this.recallPreviousHistory();
                                break;
                            case DownKeyCode:
                                if (this.isOpen)
                                    this.recallNextHistory();
                                break;
                        }
                    }
                    if (this.isOpen) {
                        SceneManager.onKeyDown(event);
                        event.stopPropagation();
                    }
                };
                Command.discardInputIfOpen = function (event) {
                    if (this.isOpen)
                        event.stopPropagation();
                };
                Command.toggleVisibility = function () {
                    this.isOpen ? this.hide() : this.show();
                };
                Command.show = function () {
                    this.layer.style.display = 'block';
                    this.layer.style.zIndex = String(-1 >>> 0);
                    this.reset();
                    this.clear();
                };
                Command.hide = function () {
                    this.layer.style.display = 'none';
                    this.layer.style.zIndex = 'auto';
                };
                Command.execute = function () {
                    var command = this.input.value;
                    if (command) {
                        this.reset();
                        this.saveAsHistory();
                        try {
                            this.executeCommand(this.input.value);
                        }
                        catch (e) {
                            this.onError(e);
                        }
                        this.clear();
                    }
                };
                Command.executeCommand = function (command) {
                    var tokens = command.split(/\s+/);
                    var name = tokens[0];
                    var args = tokens.slice(1);
                    var commandFunction = this.commands[name];
                    if (commandFunction) {
                        var result = commandFunction.apply(Command, args);
                        if (result !== void 0) {
                            this.input.placeholder = String(result);
                        }
                    }
                    else {
                        throw new Error("'" + name + "' is not a command.");
                    }
                };
                Command.saveAsHistory = function () {
                    var history = this.history;
                    history.push(this.input.value);
                    if (history.length > params.maxHistory) {
                        history.shift();
                    }
                };
                Command.recallHistory = function (n) {
                    var history = this.history;
                    if (n === 0) {
                        this.input.value = '';
                    }
                    else if (n > 0 && n <= history.length) {
                        this.input.value = history[history.length - n];
                    }
                };
                Command.recallPreviousHistory = function () {
                    this.current = Math.min(this.history.length, this.current + 1);
                    this.recallHistory(this.current);
                };
                Command.recallNextHistory = function () {
                    this.current = Math.max(0, this.current - 1);
                    this.recallHistory(this.current);
                };
                Command.onError = function (e) {
                    console.error(e.stack);
                    this.input.placeholder = e.message;
                    this.input.style.borderColor = 'red';
                };
                Command.reset = function () {
                    this.input.placeholder = '';
                    this.input.style.background = 'dimgray';
                    this.input.style.borderColor = 'gray';
                    this.input.style.color = 'white';
                };
                Command.clear = function () {
                    this.current = 0;
                    this.input.value = '';
                };
                Command.checkCommandName = function (name) {
                    if (!this.commandRegex.test(name)) {
                        throw new Error("'" + name + "' is unacceptable.");
                    }
                };
                Command.throwUncofigurableError = function (name) {
                    throw new Error("'" + name + "' is unconfigurable.");
                };
                Command.commandRegex = /^[a-zA-Z0-9_$]+$/;
                Command.commands = {};
                Command.history = [];
                Command.current = 0;
                Command = __decorate([
                    plugin.type
                ], Command);
                return Command;
            }());
            exports_1("Command", Command);
            if (Utils.isOptionValid('test')) {
                var argumentRegex_1 = /^@[a-zA-Z_$][a-zA-Z0-9_$]*$/;
                Command.initialize();
                Command.register('exit', function () {
                    SceneManager.exit();
                });
                Command.register('eval', function () {
                    return (0, eval)(Array.prototype.slice.call(arguments).join(' '));
                });
                Command.register('new', function (name) {
                    var tokens = Array.prototype.slice.call(arguments, 1);
                    var args = [null];
                    var index = 0;
                    for (var length_1 = tokens.length; index < length_1; index++) {
                        if (!argumentRegex_1.test(tokens[index]))
                            break;
                        args.push(tokens[index].slice(1));
                    }
                    args.push('return (' + tokens.slice(index).join(' ') + ');');
                    var command = (new (Function.prototype.bind.apply(Function, args))());
                    this.register(name, command, true);
                });
                Command.register('delete', function (name) {
                    this.unregister(name);
                });
            }
        }
    }
});
