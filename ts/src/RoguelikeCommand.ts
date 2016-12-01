/*!
/*:
 * @plugindesc ローグライク：コマンド
 * @author F_
 * 
 * @param EnterDungeon
 * @desc EnterDungeonコマンドのコマンド名
 * @default EnterDungeon
 * 
 * @param ExitDungeon
 * @desc ExitDungeonコマンドのコマンド名
 * @default ExitDungeon
 * 
 * @param ToFloor
 * @desc ToFloorコマンドのコマンド名
 * @default ToFloor
 * 
 * @param ToPreviousFloor
 * @desc ToPreviousFloorコマンドのコマンド名
 * @default ToPreviousFloor
 * 
 * @param ToNextFloor
 * @desc ToNextFloorコマンドのコマンド名
 * @default ToNextFloor
 * 
 * @help
 * ローグライクなダンジョンを制御するコマンドの定義。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { EventCommandCode } from 'EventExtension';
import { DungeonManager, Dungeon } from 'Roguelike';
import { MapDungeonSource } from 'RoguelikeResource';

let plugin = MVPlugin.get(__moduleName);
let params = plugin.parameters.value;

export namespace CommandSet {
	export function EnterDungeon(this: Game_Interpreter, name: string, floor: string = ''): void {
		let mapID = findMap(name);
		let depth = parseInt(floor, 10) || 0;

		if (mapID) {
			DungeonSourceManager.load(mapID, source => {
				DungeonManager.createDungeon(source, depth);
				
				insertDungeonCallback(this);
			});

			this.setWaitMode('dungeon');
		}
	}

	export function ExitDungeon(this: Game_Interpreter): void {
		DungeonManager.deleteDungeon();
	}

	export function ToFloor(this: Game_Interpreter, expression: string): void {
		let dungeon = DungeonManager.dungeon;
		if (dungeon) {
			let evaluator = new Function('x', 'return (' + expression + ');');
			dungeon.depth = Math.max(1, evaluator(dungeon.depth) | 0);

			insertDungeonCallback(this);
		}
	}

	export function ToPreviousFloor(this: Game_Interpreter): void {
		let dungeon = DungeonManager.dungeon;
		if (dungeon) {
			dungeon.depth = Math.max(1, dungeon.depth - 1);

			insertDungeonCallback(this);
		}
	}

	export function ToNextFloor(this: Game_Interpreter): void {
		let dungeon = DungeonManager.dungeon;
		if (dungeon) {
			dungeon.depth = Math.max(1, dungeon.depth + 1);

			insertDungeonCallback(this);
		}
	}

	function findMap(name: string): number | null {
		let maps = $dataMapInfos;
		for (let i = 0, length = maps.length; i < length; i++) {
			let map = maps[i];
			if (map && map.name === name) {
				return i;
			}
		}
		return null;
	}

	function insertDungeonCallback(interpreter: Game_Interpreter): void {
		let dungeon = DungeonManager.dungeon;
		if (dungeon) {
			let callback = dungeon.spec.callbacks[dungeon.depth];
			if (callback) {
				insertCommands(interpreter, callback);
			}
		}
	}

	function insertCommands(interpreter: Game_Interpreter, commands: MV.EventCommand[]): void {
		let eventId = interpreter.isOnCurrentMap() ? interpreter.eventId() : 0;

		interpreter.setupChild(commands, eventId);
	}
}

@MVPlugin.extension(Game_Interpreter)
export class GameInterpreterExtensions {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static readonly TABLE: { [command: string]: ((...args: string[]) => void) | undefined } = (function () {
		let table: any = {};
		Object.keys(params).forEach(function (command) {
			Object.defineProperty(table, <string>params[command], { value: (<any>CommandSet)[command] });
		});

		return table;
	})();

	@MVPlugin.method
	public static pluginCommand(base: Function) {
		let table = this.TABLE;
		return function (this: Game_Interpreter, command: string, args: string[]): void {
			let process = table[command];
			if (process) {
				process.apply(this, args);
			} else {
				base.call(this, command, args);
			}
		}
	}

	@MVPlugin.method
	public static updateWaitMode(base: Function) {
		return function (this: Game_Interpreter): boolean {
			let handled = true, waiting = false;
			switch (this._waitMode) {
				case 'dungeon':
					waiting = !DungeonSourceManager.ready;
					break;
				default:
					handled = false;
					break;
			}

			if (handled) {
				if (!waiting) {
					this._waitMode = '';
				}

				return waiting;
			}

			return base.call(this);
		}
	}
}

type DungeonSourceLoaded = (source: MapDungeonSource) => void;
class DungeonSourceManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _source: MapDungeonSource | null = null;
	private static _callback: DungeonSourceLoaded | null = null;

	public static get ready(): boolean {
		let source = this._source;
		if (source && source.ready) {
			if (this._callback) this._callback(source);
			this._source = null;
			this._callback = null;
		}

		return !source;
	}

	public static load(mapID: number, callback: DungeonSourceLoaded): void {
		this._source = new MapDungeonSource(mapID);
		this._callback = callback;

		this._source.load();
	}
}