/*!
/*:
 * @plugindesc ローグライク：コア実装
 * @author F_
 * 
 * @help
 * ローグライクモデルのツクールへの適用。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { DynamicEvent, EventManager } from 'EventExtension';
import {
	DungeonManager, Context, Dungeon, Floor,
	DungeonObjectType, DungeonObject, Character, Player, Enemy, Stairs, ActionEntry, ActionType, Action, TurnManager, Random, Service
} from 'Roguelike';
import * as rl from 'Roguelike';

let plugin = MVPlugin.get(__moduleName);

declare global {
	namespace DataManager {
		interface SaveContents {
			roguelike: Context;
		}
	}

	interface Game_Map {
		_dungeon?: Dungeon | null;
	}
}

@MVPlugin.extension(DataManager, true)
export class DataManagerExtensions {
	@MVPlugin.method
	public static createGameObjects(base: Function) {
		return function (this: typeof DataManager): void {
			base.call(this);

			DungeonManager.context = new Context();
		}
	}

	@MVPlugin.method
	public static makeSaveContents(base: Function) {
		return function (this: typeof DataManager): DataManager.SaveContents {
			let contents = base.call(this);
			contents.roguelike = DungeonManager.context;
			return contents;
		}
	}

	@MVPlugin.method
	public static extractSaveContents(base: Function) {
		return function (this: typeof DataManager, contents: DataManager.SaveContents) {
			base.call(this, contents);

			DungeonManager.context = contents.roguelike;
		}
	}
}

@plugin.type
export class PlayerAction implements Action {
	public constructor(public readonly entry: ActionEntry) { }

	public static node: PlayerActionNode | null = null;

	public static get ready(): boolean { return (PlayerAction.node !== null); }

	public get type(): ActionType { return (PlayerAction.node ? PlayerAction.node.type : ActionType.None); }
	public get priority(): number { return 0; }

	public static set(type: ActionType, body: () => void): void {
		PlayerAction.node = new PlayerActionNode(PlayerAction.node, type, body);
	}

	public perform(): void {
		let node: PlayerActionNode | null;
		while (node = PlayerAction.node) {
			PlayerAction.node = null;
			node.body();
		}
	}
}

class PlayerActionNode {
	public constructor(
		public readonly parent: PlayerActionNode | null,
		public readonly type: ActionType,
		public readonly body: () => void) { }
}

@plugin.type
export class DungeonPlayer implements Player {
	public get type(): DungeonObjectType.Player { return DungeonObjectType.Player; }
	public get x(): number { return $gamePlayer.x; }
	public get y(): number { return $gamePlayer.y; }
	public get direction(): number { return $gamePlayer.direction(); }
	public set direction(value: number) { $gamePlayer.setDirection(value); }

	public locate(x: number, y: number): void {
		$gamePlayer.locate(x, y);
	}

	public requestActions(): void {
		// TODO: test code
		TurnManager.request(new ActionEntry(this, 1, 1));
	}

	public decideAction(entry: ActionEntry): Action | null {
		return (PlayerAction.ready ? new PlayerAction(entry) : null);
	}
}

@plugin.type
export class DungeonEnemy implements Enemy {
	public constructor(event: MV.Event) {
		this._event = EventManager.create(event);
	}

	private _event: DynamicEvent;

	public get type(): DungeonObjectType.Enemy { return DungeonObjectType.Enemy; }
	public get event(): Game_Event { return <Game_Event>this._event.model; }
	public get x(): number { return this.event.x; }
	public get y(): number { return this.event.y; }
	public get direction(): number { return this.event.direction(); }
	public set direction(value: number) { this.event.setDirection(value); }

	public locate(x: number, y: number): void {
		this.event.locate(x, y);
	}

	public requestActions(): void {
		// TODO: test code
		TurnManager.request(new ActionEntry(this, 1, 1));
	}

	public decideAction(entry: ActionEntry): Action | null {
		// TODO: test code
		let event = this.event;
		let dx = Math.abs(event.deltaXFrom($gamePlayer.x));
		let dy = Math.abs(event.deltaYFrom($gamePlayer.y));
		if (dx + dy <= 3) {
			return {
				entry: entry,
				type: ActionType.Move,
				priority: 0,
				perform: () => {
					this.event.moveTowardPlayer();
				}
			};
		} else {
			return {
				entry: entry,
				type: ActionType.None,
				priority: 0,
				perform: () => { },
			}
		}
	}
}

@plugin.type
export class DungeonStairs implements Stairs {
	public constructor(event: MV.Event) {
		this._event = EventManager.create(event);
	}

	private _event: DynamicEvent;

	public get type(): DungeonObjectType.Stairs { return DungeonObjectType.Stairs; }
	public get event(): Game_Event { return <Game_Event>this._event.model; }
	public get x(): number { return this.event.x; }
	public get y(): number { return this.event.y; }

	public locate(x: number, y: number): void {
		this.event.locate(x, y);
	}

	public requestActions(): void { }

	public decideAction(entry: ActionEntry): Action | null {
		throw new Error(System.ErrorMessages.NOT_SUPPORTED);
	}
}

@plugin.type
export class DefaultDungeonObjectFactory implements rl.DungeonObjectFactory {
	private _floor: Floor | null = null;

	public bind(floor: Floor): void { this._floor = floor; }
	public unbind(): void { this._floor = null; }

	public create(type: DungeonObjectType): DungeonObject {
		let args = Array.prototype.slice.call(arguments, 1);
		switch (type) {
			case DungeonObjectType.Player:
				return this.createPlayer.apply(this, args);
			case DungeonObjectType.Enemy:
				return this.createEnemy.apply(this, args);
			case DungeonObjectType.Stairs:
				return this.createStairs.apply(this, args);
			default:
				throw new Error(System.ErrorMessages.NOT_SUPPORTED);
		}
	}

	public createPlayer(): DungeonPlayer {
		return new DungeonPlayer();
	}

	public createEnemy(): DungeonEnemy {
		return new DungeonEnemy(this.events().enemies[0]);
	}

	public createStairs(): DungeonStairs {
		return new DungeonStairs(this.events().stairs);
	}

	private events(): rl.DungeonEvents {
		if (!this._floor) {
			throw new Error('Floor is not bound.');
		}

		return this._floor.spec.events;
	}
}

@plugin.type
export class DefaultDungeonStrategy implements DefaultDungeonStrategy {
	public start(floor: Floor, factory: DefaultDungeonObjectFactory): void {
		let player = factory.createPlayer();
		let stairs = factory.createStairs();

		let playerPosition = this.getRandomPosition(floor);
		let stairsPosition = this.getRandomPosition(floor);
		player.locate(playerPosition.x, playerPosition.y);
		stairs.locate(stairsPosition.x, stairsPosition.y);

		for (let i = 0; i < 10; i++) {
			let enemy = factory.createEnemy();
			let enemyPosition = this.getRandomPosition(floor);
			enemy.locate(enemyPosition.x, enemyPosition.y);
			floor.objects.enemies.push(enemy);
		}

		floor.objects.player = player;
		floor.objects.stairs = stairs;
	}

	public update(floor: Floor, factory: DefaultDungeonObjectFactory): void {

	}

	private getRandomPosition(floor: Floor): { x: number; y: number; } {
		let map = <rl.Map>floor.map;
		let random = floor.random;

		let rooms = map.rooms;
		let roomIndex = random.next(rooms.length);
		let room = rooms[roomIndex];

		let offsetX = random.next(room.width);
		let offsetY = random.next(room.height);
		let x = room.x + offsetX;
		let y = room.y + offsetY;

		return { x: x, y: y };
	}
}

Service.add(rl.DungeonObjectFactory, new DefaultDungeonObjectFactory());
Service.add(rl.DungeonStrategy, new DefaultDungeonStrategy());