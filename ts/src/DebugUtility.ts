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

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	return {
		keycode: $.int('KeyCodeToToggleUI'),
		maxHistory: Math.max(0, $.int('MaxHistory')),
	}
});

const EnterKeyCode = 13;
const UpKeyCode = 38;
const DownKeyCode = 40;

type CommandFunction = (...args: string[]) => string | void;

@plugin.type
export class Command {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static readonly commandRegex: RegExp = /^[a-zA-Z0-9_$]+$/;

	private static commands: { [name: string]: CommandFunction | undefined } = {};
	private static history: string[] = [];
	private static current: number = 0;

	private static layer: HTMLDivElement;
	private static input: HTMLInputElement;

	public static get isOpen() { return this.layer.style.display !== 'none'; }

	public static initialize(): void {
		this.layer = this.createUILayer();
		this.input = this.createInputArea();

		this.layer.appendChild(this.input);
		document.body.appendChild(this.layer);

		document.addEventListener('keydown', this.onKeyDown.bind(this), true);
		document.addEventListener('mousedown', this.discardInputIfOpen.bind(this), true);
		document.addEventListener('wheel', this.discardInputIfOpen.bind(this), true);
		document.addEventListener('touchstart', this.discardInputIfOpen.bind(this), true);
	}

	public static register(name: string, command: CommandFunction, configurable?: boolean): void {
		this.checkCommandName(name);

		let descriptor = Object.getOwnPropertyDescriptor(this.commands, name);
		if (descriptor && !descriptor.configurable) {
			this.throwUncofigurableError(name);
		}

		Object.defineProperty(this.commands, name, { value: command, configurable: !!configurable });
	}

	public static unregister(name: string): void {
		this.checkCommandName(name);

		let descriptor = Object.getOwnPropertyDescriptor(this.commands, name);
		if (descriptor) {
			if (!descriptor.configurable) {
				this.throwUncofigurableError(name);
			}

			delete this.commands[name];
		} else {
			throw new Error(`'${name}' is not found.`);
		}
	}

	private static createUILayer(): HTMLDivElement {
		let layer = document.createElement('div');
		layer.style.display = 'none';
		layer.style.position = 'fixed';
		layer.style.left = '0px';
		layer.style.right = '0px';
		layer.style.top = '0px';
		layer.style.bottom = '0px';
		return layer;
	}

	private static createInputArea(): HTMLInputElement {
		let input = document.createElement('input');
		input.type = 'text';
		input.style.display = 'block';
		input.style.width = '90%';
		input.style.margin = '10px auto';
		input.style.padding = '5px 10px';
		input.style.fontSize = '16px';
		input.style.fontFamily = 'Consolas, monospace';
		return input;
	}

	private static onKeyDown(event: KeyboardEvent) {
		if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
			switch (event.keyCode) {
				case params.keycode:
					this.toggleVisibility();
					break;
				case EnterKeyCode:
					if (this.isOpen) this.execute();
					break;
				case UpKeyCode:
					if (this.isOpen) this.recallPreviousHistory();
					break;
				case DownKeyCode:
					if (this.isOpen) this.recallNextHistory();
					break;
			}
		}

		if (this.isOpen) {
			SceneManager.onKeyDown(event);

			event.stopPropagation();
		}
	}

	private static discardInputIfOpen(event: Event) {
		if (this.isOpen) event.stopPropagation();
	}

	private static toggleVisibility() {
		this.isOpen ? this.hide() : this.show();
	}

	private static show() {
		this.layer.style.display = 'block';
		this.layer.style.zIndex = String(-1 >>> 0);

		this.reset();
		this.clear();
	}

	private static hide() {
		this.layer.style.display = 'none';
		this.layer.style.zIndex = 'auto';
	}

	private static execute() {
		let command = this.input.value;
		if (command) {
			this.reset();
			this.saveAsHistory();

			try {
				this.executeCommand(this.input.value);
			} catch (e) {
				this.onError(e);
			}

			this.clear();
		}
	}

	private static executeCommand(command: string) {
		let tokens = command.split(/\s+/);
		let name = tokens[0];
		let args = tokens.slice(1);

		let commandFunction = this.commands[name];
		if (commandFunction) {
			let result = commandFunction.apply(Command, args);
			if (result !== void 0) {
				this.input.placeholder = String(result);
			}
		} else {
			throw new Error(`'${name}' is not a command.`);
		}
	}

	private static saveAsHistory() {
		let history = this.history;
		history.push(this.input.value);
		if (history.length > params.maxHistory) {
			history.shift();
		}
	}

	private static recallHistory(n: number) {
		let history = this.history;
		if (n === 0) {
			this.input.value = '';
		} else if (n > 0 && n <= history.length) {
			this.input.value = history[history.length - n];
		}
	}

	private static recallPreviousHistory() {
		this.current = Math.min(this.history.length, this.current + 1);
		this.recallHistory(this.current);
	}

	private static recallNextHistory() {
		this.current = Math.max(0, this.current - 1);
		this.recallHistory(this.current);
	}

	private static onError(e: Error) {
		console.error(e.stack);

		this.input.placeholder = e.message;
		this.input.style.borderColor = 'red';
	}

	private static reset() {
		this.input.placeholder = '';
		this.input.style.background = 'dimgray';
		this.input.style.borderColor = 'gray';
		this.input.style.color = 'white';
	}

	private static clear() {
		this.current = 0;
		this.input.value = '';
	}

	private static checkCommandName(name: string): void {
		if (!this.commandRegex.test(name)) {
			throw new Error(`'${name}' is unacceptable.`);
		}
	}

	private static throwUncofigurableError(name: string): never {
		throw new Error(`'${name}' is unconfigurable.`);
	}
}

if (Utils.isOptionValid('test')) {
	const argumentRegex = /^@[a-zA-Z_$][a-zA-Z0-9_$]*$/;

	Command.initialize();

	Command.register('exit', function () {
		SceneManager.exit();
	})

	Command.register('eval', function () {
		return (0, eval)(Array.prototype.slice.call(arguments).join(' '));
	})

	Command.register('new', function (this: typeof Command, name: string) {
		let tokens = Array.prototype.slice.call(arguments, 1);

		let args = <any[]>[null];
		let index = 0;
		for (let length = tokens.length; index < length; index++) {
			if (!argumentRegex.test(tokens[index])) break;
			args.push(tokens[index].slice(1));
		}
		args.push('return (' + tokens.slice(index).join(' ') + ');');

		let command = <CommandFunction>(new (Function.prototype.bind.apply(Function, args))());

		this.register(name, command, true);
	});

	Command.register('delete', function (this: typeof Command, name: string) {
		this.unregister(name);
	});
}