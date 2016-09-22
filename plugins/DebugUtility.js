/*:
 * @plugindesc デバッグの支援
 * @author F_
 * 
 * @param KeyCodeToToggleCommandUI
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

if (Utils.isOptionValid('test')) {

	PluginSystem.validate(function (params) {
		return {
			keycode: parseInt(params['KeyCodeToToggleCommandUI'], 10),
			maxHistory: Math.max(0, parseInt(params['MaxHistory'], 10)),
		};
	});

	PluginSystem.ns('Debug', function (scope, params) {

		this.define('Command', function () {
			function Command() {
				throw new Error('This is a static class.');
			}

			var EnterKeyCode = 13;
			var UpKeyCode = 38;
			var DownKeyCode = 40;

			var ui = document.createElement('div');
			ui.style.display = 'none';
			ui.style.position = 'fixed';
			ui.style.left = '0px';
			ui.style.right = '0px';
			ui.style.top = '0px';
			ui.style.bottom = '0px';
			document.body.appendChild(ui);

			var input = document.createElement('input');
			input.type = 'text';
			input.style.display = 'block';
			input.style.width = '90%';
			input.style.margin = '10px auto';
			input.style.padding = '5px 10px';
			input.style.fontSize = '16px';
			input.style.fontFamily = 'consolas';
			ui.appendChild(input);

			document.addEventListener('keydown', onKeyDown, true);
			document.addEventListener('mousedown', onMouseDown, true);
			document.addEventListener('wheel', onWheel, true);
			document.addEventListener('touchstart', onTouchStart, true);

			var commands = {};
			var commandRegex = /^[a-zA-Z0-9_$]+$/;

			var history = [];
			var current = 0;

			function register(name, command, configurable) {
				checkCommandName(name);
				checkCommandFunction(command);

				var descriptor = Object.getOwnPropertyDescriptor(commands, name);
				if (descriptor && !descriptor.configurable) {
					throwUncofigurableError(name);
				}

				Object.defineProperty(commands, name, { value: command, configurable: !!configurable });
			}

			function unregister(name) {
				checkCommandName(name);

				var descriptor = Object.getOwnPropertyDescriptor(commands, name);
				if (descriptor) {
					if (!descriptor.configurable) throwUncofigurableError(name);

					delete commands[name];
				} else {
					throw new Error("'" + name + "' is not found.");
				}
			}

			function checkCommandName(name) {
				if (typeof name !== 'string' && !(name instanceof String)) {
					throw new Error("'name' is not String.");
				}
				if (!commandRegex.test(name)) {
					throw new Error("'" + name + "' is unacceptable.");
				}
			}

			function checkCommandFunction(command) {
				if (typeof command !== 'function') {
					throw new Error('Command is not a function.');
				}
			}

			function throwUncofigurableError(name) {
				throw new Error("'" + name + "' is unconfigurable.");
			}

			function onKeyDown(event) {
				if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
					switch (event.keyCode) {
						case params.keycode:
							toggleCommandUI();
							break;
						case EnterKeyCode:
							execute();
							break;
						case UpKeyCode:
							current = Math.min(history.length, current + 1);
							recallHistory(current);
							break;
						case DownKeyCode:
							current = Math.max(0, current - 1);
							recallHistory(current);
							break;
					}
				}

				if (isOpen()) {
					SceneManager.onKeyDown(event);

					event.stopPropagation();
				}
			}

			function onMouseDown(event) {
				if (isOpen()) event.stopPropagation();
			}

			function onWheel(event) {
				if (isOpen()) event.stopPropagation();
			}

			function onTouchStart(event) {
				if (isOpen()) event.stopPropagation();
			}

			function toggleCommandUI() {
				if (isOpen()) {
					hide();
				} else {
					show();
				}
			}

			function execute() {
				reset();
				saveAsHistory();

				try {
					var command = input.value;
					if (command) {
						executeCommand(input.value);
					}
				} catch (e) {
					onError(e);
				}

				clear();
			}

			function executeCommand(command) {
				var tokens = command.split(/\s+/);
				var name = tokens[0];
				var args = tokens.slice(1);

				var commandFunction = commands[name];
				if (commandFunction) {
					var result = commandFunction.apply(Command, args);
					if (typeof result !== 'undefined') {
						input.placeholder = String(result);
					}
				} else {
					throw new Error("'" + name + "' is not a command.");
				}
			}

			function saveAsHistory() {
				history.push(input.value);
				if (history.length > params.maxHistory) {
					history.shift();
				}
			}

			function recallHistory(n) {
				if (n === 0) {
					input.value = '';
				} else if (n > 0 && n <= history.length) {
					input.value = history[history.length - n];
				}
			}

			function show() {
				ui.style.display = 'block';
				ui.style.zIndex = -1 >>> 0;

				reset();
				clear();
			}

			function hide() {
				ui.style.display = 'none';
				ui.style.zIndex = 'auto';
			}

			function isOpen() {
				return ui.style.display !== 'none';
			}

			function onError(e) {
				console.error(e.stack);

				input.placeholder = e.message;
				input.style.borderColor = 'red';
			}

			function reset() {
				input.placeholder = '';
				input.style.background = 'dimgray';
				input.style.borderColor = 'gray';
				input.style.color = 'white';
			}

			function clear() {
				current = 0;
				input.value = '';
			}

			return Object.defineProperties(Command, {
				register: { value: register },
				unregister: { value: unregister },
			});
		});

		(function () {
			var argumentRegex = /^@[a-zA-Z_$][a-zA-Z0-9_$]*$/;

			scope.Command.register('exit', function () {
				SceneManager.exit();
			})

			scope.Command.register('eval', function () {
				return (0, eval)(Array.prototype.slice.call(arguments).join(' '));
			})

			scope.Command.register('new', function (name) {
				var tokens = Array.prototype.slice.call(arguments, 1);

				var args = [null];
				for (var i = 0, length = tokens.length; i < length; i++) {
					if (!argumentRegex.test(tokens[i])) break;
					args.push(tokens[i].slice(1));
				}
				args.push('return (' + tokens.slice(i).join(' ') + ');');
				
				var command = new (Function.prototype.bind.apply(Function, args))();

				this.register(name, command, true);
			});

			scope.Command.register('delete', function (name) {
				this.unregister(name);
			});
		})();
	})
}