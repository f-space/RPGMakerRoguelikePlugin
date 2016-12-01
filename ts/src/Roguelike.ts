/*!
/*:
 * @plugindesc ローグライク：共通モデル
 * @author F_
 * 
 * @help
 * ローグライクプラグインで使用する共通モデルの定義。
 * 
 * このプラグインをONにしていないと、
 * すべてのローグライクプラグインは基本的に動作しないため注意。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

let plugin = MVPlugin.get(__moduleName);

@plugin.type
export class PriorityQueue<T> {
	public constructor(public readonly comparer: Comparer<T>) { }

	private _array: (T | null)[] = [];
	private _head: number = 0;
	private _dirty: boolean = false;

	public get size(): number { return (this._array.length - this._head); }
	public get empty(): boolean { return (this.size === 0); }

	public enqueue(item: T): PriorityQueue<T> {
		this._array.push(item);
		this._dirty = true;

		return this;
	}

	public dequeue(): T {
		this.checkSize();
		this.ensureOrder();

		let item = <T>this._array[this._head];
		this._array[this._head] = null;
		this._head++;

		return item;
	}

	public peek(): T {
		this.checkSize();
		this.ensureOrder();

		return <T>this._array[this._head];
	}

	public clear(): PriorityQueue<T> {
		this._array = [];
		this._head = 0;
		this._dirty = false;

		return this;
	}

	private checkSize(): void {
		if (this.empty) throw new Error('Queue is empty.');
	}

	private ensureOrder(): void {
		if (this._dirty) {
			this._array = this._array.slice(this._head).sort(this.comparer);
			this._head = 0;
			this._dirty = false;
		}
	}
}

export interface Comparer<T> {
	(x: T, y: T): number;
}

@plugin.type
export class Random implements System.Serializable {
	public constructor(seed?: number) {
		let useed = Random.seed(seed);

		this._seed = useed;
		this._value = useed;
	}

	private static readonly MAX = (-1 >>> 0);

	private _seed: number;
	private _value: number;

	public get seed(): number { return this._seed; }
	public get value(): number { return this._value; }
	public set value(value: number) { this._value = value >>> 0; }

	public toJSON(): any {
		return {
			seed: this._seed,
			value: this._value
		};
	}

	public fromJSON(data: any): void {
		this._seed = data.seed;
		this._value = data.value;
	}

	public next(max?: number): number {
		this.toNext();

		return (max == null ? this._value : (this._value % ((max >>> 0) || 1)));
	}

	public next01(): number {
		this.toNext();

		return (this._value / Random.MAX);
	}

	public static seed(n: number = Date.now()): number {
		return (n >>> 0) || Random.MAX;
	}

	private toNext(): void {
		this._value = Random.xorshift32(this._value);
	}

	private static xorshift32(x: number): number {
		x = x ^ (x << 13);
		x = x ^ (x >>> 17);
		x = x ^ (x << 15);
		return x >>> 0;
	}
}

export interface ExternalResource {
	ready: boolean;
}

export interface DungeonSource extends ExternalResource, System.Serializable {
	id: string;
	name: string;
	callbacks: DungeonCallbacks;
}

export interface DungeonCallbacks extends System.Serializable {
	[n: number]: MV.EventCommand[] | undefined;
}

export interface FloorSource extends ExternalResource, System.Serializable {
	id: string;
	name: string;
	map: MapConfig;
	events: DungeonEvents;
}

export interface MapConfig extends System.Serializable {
	width: number;
	height: number;
	algorithm: string;
	args: any;
	design: MapDesign;
}

export interface MapDesign extends System.Serializable {
	baseMap: MV.Map;
	floorTiles: number[];
	wallTiles: number[];
}

export interface DungeonEvents extends System.Serializable {
	stairs: MV.Event;
	enemies: MV.Event[];
}

@plugin.type
export class DungeonSpec implements System.Serializable {
	public constructor(source: DungeonSource, seed: number) {
		let useed = Random.seed(seed);
		let id = source.id + '_' + useed.padZero(10);

		this._id = id;
		this._source = source;
		this._seed = useed;
	}

	private _id: string;
	private _source: DungeonSource;
	private _seed: number;

	public get id(): string { return this._id; }
	public get source(): DungeonSource { return this._source; }
	public get seed(): number { return this._seed; }
	public get name(): string { return this.source.name; }
	public get callbacks(): DungeonCallbacks { return this.source.callbacks; }

	public toJSON(): any {
		return {
			id: this._id,
			source: this._source,
			seed: this._seed,
		};
	}

	public fromJSON(data: any): void {
		this._id = data.id;
		this._source = data.source;
		this._seed = data.seed;
	}
}

@plugin.type
export class FloorSpec implements System.Serializable {
	public constructor(source: FloorSource, seed: number) {
		let useed = (seed >>> 0) || (-1 >>> 0);
		let id = source.id + '_' + useed.padZero(10);

		this._id = id;
		this._source = source;
		this._seed = useed;
	}

	private _id: string;
	private _source: FloorSource;
	private _seed: number;

	public get id(): string { return this._id; }
	public get source(): FloorSource { return this._source; }
	public get seed(): number { return this._seed; }
	public get name(): string { return this.source.name; }
	public get map(): MapConfig { return this.source.map; }
	public get events(): DungeonEvents { return this.source.events; }

	public toJSON(): any {
		return {
			id: this._id,
			source: this._source,
			seed: this._seed,
		};
	}

	public fromJSON(data: any): void {
		this._id = data.id;
		this._source = data.source;
		this._seed = data.seed;
	}
}

@plugin.type
export class DungeonManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _context: Context;

	public static get context(): Context { return this._context; }
	public static set context(value: Context) { this._context = value; }
	public static get dungeon(): Dungeon | null { return this._context.dungeon; }
	public static set dungeon(value: Dungeon | null) { this._context.dungeon = value; }
	public static get floor(): Floor | null { return this._context.floor; }
	public static set floor(value: Floor | null) { this._context.floor = value; }
	public static get inDungeon(): boolean { return (this._context.dungeon != null); }
	public static get inFloor(): boolean { return (this._context.floor != null); }

	public static createDungeon(source: DungeonSource, depth?: number): Dungeon {
		if (!source.ready) throw new Error("DungeonSource is not ready.");

		let seed = this.newSeed();
		let spec = new DungeonSpec(source, seed);
		let dungeon = new Dungeon(spec, depth);

		return (this.dungeon = dungeon);
	}

	public static deleteDungeon(): void {
		this.dungeon = null;
	}

	public static createFloor(source: FloorSource): Floor {
		if (!source.ready) throw new Error("FloorSource is not ready.");

		let algorithms = Service.get<DungeonAlgorithmProvider>(DungeonAlgorithmProvider);

		let dungeon = this.dungeon;
		let seed = dungeon ? dungeon.random.next() : this.newSeed();
		let spec = new FloorSpec(source, seed);
		let floor = new Floor(spec, algorithms);

		return (this.floor = floor);
	}

	public static deleteFloor(): void {
		this.floor = null;
	}

	private static newSeed(): number {
		return (new Random()).next();
	}
}

@plugin.type
export class Context implements System.Serializable {
	public dungeon: Dungeon | null = null;
	public floor: Floor | null = null;
	public stats: Stats = new Stats();

	public get ready(): boolean {
		let dungeon = this.dungeon;
		let floor = this.floor;
		return ((!dungeon || dungeon.spec.source.ready) && (!floor || floor.spec.source.ready));
	}

	public toJSON(): any {
		return {
			dungeon: this.dungeon,
			floor: this.floor,
		}
	}

	public fromJSON(data: any): void {
		this.dungeon = data.dungeon;
		this.floor = data.floor;
	}
}

@plugin.type
export class Dungeon implements System.Serializable {
	public constructor(spec: DungeonSpec, depth: number = 0) {
		this._spec = spec;
		this._random = new Random(spec.seed);
		this._depth = depth;
	}

	private _spec: DungeonSpec;
	private _random: Random;
	private _depth: number;

	public get spec(): DungeonSpec { return this._spec; }
	public get random(): Random { return this._random; }
	public get depth(): number { return this._depth; }
	public set depth(value: number) { this._depth = value; }

	public toJSON(): any {
		return {
			spec: this._spec,
			random: this._random,
			depth: this._depth,
		};
	}

	public fromJSON(data: any): void {
		this._spec = data.spec;
		this._random = data.random;
		this._depth = data.depth;
	}
}

@plugin.type
export class Floor implements System.Serializable {
	public constructor(spec: FloorSpec, algorithms: DungeonAlgorithmProvider) {
		let random = new Random(spec.seed);
		let map = Floor.createMap(spec.map, algorithms, random.next());
		let seed = random.next();

		this._spec = spec;
		this._random = new Random(seed);
		this._map = map;
		this._objects = new DungeonObjectList();
	}

	private _spec: FloorSpec;
	private _random: Random;
	private _map: Map;
	private _objects: DungeonObjectList;

	public get spec(): FloorSpec { return this._spec; }
	public get random(): Random { return this._random; }
	public get map(): Map { return this._map; }
	public get objects(): DungeonObjectList { return this._objects; }

	public toJSON(): any {
		return {
			spec: this._spec,
			random: this._random,
			map: this._map,
			objects: this._objects,
		};
	}

	public fromJSON(data: any): void {
		this._spec = data.spec;
		this._random = data.random;
		this._map = data.map;
		this._objects = data.objects;
	}

	private static createMap(config: MapConfig, algorithms: DungeonAlgorithmProvider, seed: number): Map {
		let algorithm = algorithms.get(config.algorithm);
		let random = new Random(seed);
		let map = algorithm.create(config, random);

		return map;
	}
}

@plugin.type
export class Map implements System.Serializable {
	public constructor(width: number, height: number) {
		let cells = this.createCells(width, height);

		this._width = width;
		this._height = height;
		this._cells = cells;
		this._rooms = [];
	}

	private _width: number;
	private _height: number;
	private _cells: Cell[];
	private _rooms: Room[];

	public get width(): number { return this._width; }
	public get height(): number { return this._height; }
	public get cells(): ReadonlyArray<Cell> { return this._cells; }
	public get rooms(): Room[] { return this._rooms; }

	public toJSON(): any {
		return {
			width: this._width,
			height: this._height,
			cells: this._cells,
			rooms: this._rooms,
		};
	}

	public fromJSON(data: any): void {
		this._width = data.width;
		this._height = data.height;
		this._cells = data.cells;
		this._rooms = data.rooms;
	}

	private createCells(width: number, height: number): Cell[] {
		let cells = new Array(width * height);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				cells[x + y * width] = new Cell(this, x, y);
			}
		}

		return cells;
	}
}

@plugin.type
export class Cell implements System.Serializable {
	public constructor(map: Map, x: number, y: number) {
		this._map = map;
		this._x = x;
		this._y = y;
		this._type = CellType.Wall;
	}

	private _map: Map;
	private _x: number;
	private _y: number;
	private _type: CellType;

	public get map(): Map { return this._map; }
	public get x(): number { return this._x; }
	public get y(): number { return this._y; }
	public get index(): number { return (this.x + this.map.width * this.y); }
	public get type(): CellType { return this._type; }
	public set type(value: CellType) { this._type = value; }

	public toJSON(): any {
		return {
			map: this._map,
			x: this._x,
			y: this._y,
			type: this._type,
		};
	}

	public fromJSON(data: any): void {
		this._map = data.map;
		this._x = data.x;
		this._y = data.y;
		this._type = data.type;
	}

	public getDataIndex(z: number): number {
		return (this.x + this.map.width * (this.y + this.map.height * (z || 0)));
	}
}

export enum CellType {
	Floor,
	Wall,
}

@plugin.type
export class Room implements System.Serializable {
	public constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	public x: number;
	public y: number;
	public width: number;
	public height: number;

	public get minX(): number { return this.x; }
	public get maxX(): number { return this.x + this.width; }
	public get minY(): number { return this.y; }
	public get maxY(): number { return this.y + this.height; }

	public toJSON(): any {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
		};
	}

	public fromJSON(data: any): void {
		this.x = data.x;
		this.y = data.y;
		this.width = data.width;
		this.height = data.height;
	}

	public contains(x: number, y: number): boolean {
		return (x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY);
	}
}

export enum DungeonObjectType {
	Unknown,
	Player,
	Enemy,
	Item,
	Trap,
	Stairs,
}

type DungeonObjectTable = { [type: number]: DungeonObject | DungeonObject[] | null };

@plugin.type
export class DungeonObjectList implements System.Serializable {
	public constructor() {
		this._objects = DungeonObjectList.getPredefinedObjects();
	}

	private _objects: DungeonObjectTable;

	public get player(): Player { return <Player>this.get(DungeonObjectType.Player); }
	public set player(value: Player) { this.set(DungeonObjectType.Player, value); }

	public get enemies(): Enemy[] { return <Enemy[]>this.get(DungeonObjectType.Enemy); }
	public set enemies(value: Enemy[]) { this.set(DungeonObjectType.Enemy, value); }

	public get items(): Item[] { return <Item[]>this.get(DungeonObjectType.Item); }
	public set items(value: Item[]) { this.set(DungeonObjectType.Item, value); }

	public get traps(): Trap[] { return <Trap[]>this.get(DungeonObjectType.Trap); }
	public set traps(value: Trap[]) { this.set(DungeonObjectType.Trap, value); }

	public get stairs(): Stairs { return <Stairs>this.get(DungeonObjectType.Stairs); }
	public set stairs(value: Stairs) { this.set(DungeonObjectType.Stairs, value); }

	public toJSON(): any {
		return { objects: this._objects };
	}

	public fromJSON(data: any): void {
		this._objects = data.objects;
	}

	public get(type: DungeonObjectType): DungeonObject | DungeonObject[] | null {
		return this._objects[type];
	}

	public set(type: DungeonObjectType, value: DungeonObject | DungeonObject[] | null) {
		this._objects[type] = value;
	}

	public all(): DungeonObject[] {
		let objects = this._objects;
		let all = Array.prototype.concat.apply([], Object.keys(objects).map(key => objects[+key]));
		return all;
	}

	private static getPredefinedObjects(): DungeonObjectTable {
		let objects = <DungeonObjectTable>{};
		objects[DungeonObjectType.Player] = null;
		objects[DungeonObjectType.Enemy] = [];
		objects[DungeonObjectType.Item] = [];
		objects[DungeonObjectType.Trap] = [];
		objects[DungeonObjectType.Stairs] = null;
		return objects;
	}
}

export interface DungeonObject extends System.Serializable {
	readonly type: DungeonObjectType;
	readonly x: number;
	readonly y: number;
	locate(x: number, y: number): void;
	requestActions(): void;
	decideAction(entry: ActionEntry): Action | null;
}

export interface Character extends DungeonObject {
	direction: number;
}

export interface Player extends Character {
	readonly type: DungeonObjectType.Player;
}

export interface Enemy extends Character {
	readonly type: DungeonObjectType.Enemy;
}

export interface Item extends DungeonObject {
	readonly type: DungeonObjectType.Item;
}

export interface Trap extends DungeonObject {
	readonly type: DungeonObjectType.Trap;
}

export interface Stairs extends DungeonObject {
	readonly type: DungeonObjectType.Stairs;
}

@plugin.type
export class ActionEntry {
	public constructor(
		public readonly subject: DungeonObject,
		public readonly phase: number,
		public readonly timing: number) { }

	public static readonly PRIORITY_TABLE: ReadonlyArray<number> = (function () {
		let table = <number[]>[];
		table[DungeonObjectType.Unknown] = -1 >>> 0;
		table[DungeonObjectType.Player] = 100;
		table[DungeonObjectType.Enemy] = 1000;
		table[DungeonObjectType.Item] = 3000;
		table[DungeonObjectType.Trap] = 2000;
		table[DungeonObjectType.Stairs] = 5000;
		return table;
	})();

	public get type(): DungeonObjectType { return this.subject.type; }

	public static compare(x: ActionEntry, y: ActionEntry): number {
		return (x.timing - y.timing) || (ActionEntry.PRIORITY_TABLE[x.type] - ActionEntry.PRIORITY_TABLE[y.type]);
	}
}

@plugin.type
export class ActionType {
	public constructor(
		public readonly name: string,
		public readonly priority: number,
		public readonly block: boolean) { }

	public static readonly None: ActionType = new ActionType('None', 0, false);
	public static readonly Move: ActionType = new ActionType('Move', 1000, false);
	public static readonly Skill: ActionType = new ActionType('Skill', 2000, true);

	public static compare(x: ActionType, y: ActionType): number {
		return x.priority - y.priority;
	}
}

@plugin.type
export class Action {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	public static compare(x: Action, y: Action): number {
		return ActionEntry.compare(x.entry, y.entry) || ActionType.compare(x.type, y.type) || (x.priority - y.priority);
	}
}
export interface Action {
	entry: ActionEntry;
	type: ActionType;
	priority: number;
	perform(): void;
}

@plugin.type
export class Stats implements System.Serializable {
	public toJSON(): any {
		return {
			turn: TurnManager.turn,
		};
	}

	public fromJSON(data: any): void {
		TurnManager.turn = data.turn;
	}
}

@plugin.type
export class TurnManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _turn: number = 0;
	private static _entryQueue: PriorityQueue<ActionEntry> = new PriorityQueue(ActionEntry.compare);
	private static _actionQueue: PriorityQueue<Action> = new PriorityQueue(Action.compare);

	private static _listeners: TurnEventListener[] = [];

	public static get turn(): number { return this._turn; }
	public static set turn(value: number) { this._turn = value; }

	public static start(): void {
		this.raiseEvent(listener => listener.onEnterFloor);
	}

	public static end(): void {
		this.raiseEvent(listener => listener.onExitFloor);

		this.clear();
	}

	public static next(): void {
		if (this._actionQueue.empty) {
			if (this._entryQueue.empty) {
				if (this._turn > 0) this.endTurn();
				this.startTurn();
				this.collectActionEntries();
			}
			this.collectActions();
		}
		this.invokeActions();
	}

	public static request(entry: ActionEntry): void {
		this._entryQueue.enqueue(entry);
	}

	public static addEventListener(listener: TurnEventListener): void {
		this._listeners.push(listener);
	}

	public static removeEventListener(listener: TurnEventListener): void {
		this._listeners.splice(this._listeners.indexOf(listener), 1);
	}

	private static clear(): void {
		this._turn = 0;
		this._entryQueue.clear();
		this._actionQueue.clear();
	}

	private static startTurn(): void {
		this._turn++;

		this.raiseEvent(listener => listener.onStartTurn);
	}

	private static endTurn(): void {
		this.raiseEvent(listener => listener.onEndTurn);
	}

	private static collectActionEntries(): void {
		let floor = DungeonManager.floor;
		if (floor) {
			let objects = floor.objects.all();
			objects.forEach(object => object.requestActions());
		}
	}

	private static collectActions(): void {
		let queue = this._entryQueue;
		while (!queue.empty) {
			let entry = queue.peek();
			let action = entry.subject.decideAction(entry);
			if (!action) break;

			this._actionQueue.enqueue(action);

			queue.dequeue();
		}
	}

	private static invokeActions(): void {
		let queue = this._actionQueue;
		let first = true;
		while (!queue.empty && (first || !queue.peek().type.block)) {
			let action = queue.dequeue();
			action.perform();
		}
	}

	private static raiseEvent(selector: (listener: TurnEventListener) => Function | undefined): void {
		this._listeners.forEach(function (listener) {
			let handler = selector(listener);
			if (System.Utility.isFunction(handler)) {
				handler();
			}
		});
	}
}

export interface TurnEventListener {
	onEnterFloor?(): void;
	onExitFloor?(): void;
	onStartTurn?(): void;
	onEndTurn?(): void;
}

@plugin.type
export class DungeonAlgorithm { private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); } }
export interface DungeonAlgorithm {
	create(config: MapConfig, random: Random): Map;
}

interface DungeonAlgorithmEntry {
	algorithm: DungeonAlgorithm;
	weight: number;
}

@plugin.type
export class DungeonAlgorithmSelector implements DungeonAlgorithm {
	private _algorithms: DungeonAlgorithmEntry[] = [];

	public create(config: MapConfig, random: Random): Map {
		if (this._algorithms.length !== 0) {
			let index = this.select(random);
			let algorithm = this._algorithms[index].algorithm;

			return algorithm.create(config, random);
		}

		return new Map(config.width, config.height);
	}

	public add(algorithm: DungeonAlgorithm, weight: number = 1): void {
		this._algorithms.push({ algorithm: algorithm, weight: weight });
	}

	private select(random: Random): number {
		let total = this._algorithms.reduce((total, entry) => total + entry.weight, 0);
		let weights = this._algorithms.map(entry => entry.weight / total);

		let selection = random.next01();
		for (let i = 0; i < weights.length; i++) {
			if (selection <= weights[i]) return i;
		}

		return weights.length - 1;
	}
}

@plugin.type
export class DungeonAlgorithmProvider { private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); } }
export interface DungeonAlgorithmProvider {
	get(name?: string): DungeonAlgorithm;
}

@plugin.type
export class DefaultDungeonAlgorithmProvider implements DungeonAlgorithmProvider {
	private constructor() { }

	public static readonly instance = new DefaultDungeonAlgorithmProvider();
	private static readonly DEFAULT = '@default';

	private _algorithms: { [name: string]: DungeonAlgorithm } = Object.create(null);

	public static get default(): DungeonAlgorithm { return this.instance._algorithms[this.DEFAULT]; }
	public static set default(value: DungeonAlgorithm) { this.instance._algorithms[this.DEFAULT] = value; }

	public static get(name: string): DungeonAlgorithm {
		return this.instance.get(name);
	}

	public static register(name: string, algorithm: DungeonAlgorithm): void {
		this.instance.register(name, algorithm);
	}

	public static unregister(name: string): void {
		this.instance.unregister(name);
	}

	public get(name?: string): DungeonAlgorithm {
		name = name || DefaultDungeonAlgorithmProvider.DEFAULT;
		if (!(name in this._algorithms)) {
			throw new Error(`Unknown algorithm: '${name}'.`);
		}

		return this._algorithms[name];
	}

	public register(name: string, algorithm: DungeonAlgorithm): void {
		this._algorithms[name] = algorithm;
	}

	public unregister(name: string): void {
		delete this._algorithms[name];
	}
}

@plugin.type
export class DungeonStrategy { private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); } }
export interface DungeonStrategy {
	start(floor: Floor, factory: DungeonObjectFactory): void;
	update(floor: Floor, factory: DungeonObjectFactory): void;
}

@plugin.type
export class DungeonObjectFactory { private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); } }
export interface DungeonObjectFactory {
	bind(floor: Floor): void;
	unbind(): void;
	create(type: DungeonObjectType): DungeonObject;
}

@plugin.type
export class DungeonMapArranger { private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); } }
export interface DungeonMapArranger {
	arrange(floor: Floor): MV.Map;
}

@plugin.type
export class Service {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static services: { [name: string]: any } = Object.create(null);

	public static get<T>(id: string | Function): T {
		let name = this.getUniqueName(id);

		return (name in this.services ? this.services[name] : null);
	}

	public static add(id: string | Function, service: any): void {
		let name = this.getUniqueName(id);

		this.services[name] = service;
	};

	public static remove(id: string | Function): boolean {
		let name = this.getUniqueName(id);

		return delete this.services[name];
	};

	private static getUniqueName(id: string | Function) {
		return (System.Utility.isFunction(id) ? System.Type.of(id) : String(id));
	}
}

Service.add(DungeonAlgorithmProvider, DefaultDungeonAlgorithmProvider.instance);
Service.add(DungeonStrategy, null);
Service.add(DungeonObjectFactory, null);
Service.add(DungeonMapArranger, null);
