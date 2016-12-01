/*!
/*:
 * @plugindesc イベント機能の拡張
 * @author F_
 * 
 * @help
 * 動的なイベントの生成を支援。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

let plugin = MVPlugin.get(__moduleName);

declare global {
	interface Game_Event {
		_event?: MV.Event;
	}
}

export const enum EventTrigger {
	Button = 0,
	Touch = 1,
	Touched = 2,
	Auto = 3,
	Parallel = 4,
}

export const enum EventMoveType {
	Fixed = 0,
	Random = 1,
	TowardPlayer = 2,
	Custom = 3,
}

export const enum EventMoveSpeed {
	x1_8 = 1,
	x1_4 = 2,
	x1_2 = 3,
	x1 = 4,
	x2 = 5,
	x4 = 6,
}

export const enum EventMoveFrequency {
	Lowest = 1,
	Low = 2,
	Normal = 3,
	High = 4,
	Highest = 5,
}

export const enum EventPriorityType {
	Lower = 0,
	Normal = 1,
	Upper = 2,
}

export const enum CommonEventTrigger {
	None = 0,
	Auto = 1,
	Parallel = 2,
}

export const enum MoveCommandCode {
	End = 0,
	MoveDown = 1,
	MoveLeft = 2,
	MoveRight = 3,
	MoveUp = 4,
	MoveLowerL = 5,
	MoveLowerR = 6,
	MoveUpperL = 7,
	MoveUpperR = 8,
	MoveRandom = 9,
	MoveToward = 10,
	MoveAway = 11,
	MoveForward = 12,
	MoveBackward = 13,
	Jump = 14,
	Wait = 15,
	TurnDown = 16,
	TurnLeft = 17,
	TurnRight = 18,
	TurnUp = 19,
	Turn90dR = 20,
	Turn90dL = 21,
	Turn180d = 22,
	Turn90dRL = 23,
	TurnRandom = 24,
	TurnToward = 25,
	TurnAway = 26,
	SwitchOn = 27,
	SwitchOff = 28,
	ChangeSpeed = 29,
	ChangeFreq = 30,
	WalkAnimeOn = 31,
	WalkAnimeOff = 32,
	StepAnimeOn = 33,
	StepAnimeOff = 34,
	DirFixOn = 35,
	DirFixOff = 36,
	ThroughOn = 37,
	ThroughOff = 38,
	TransparentOn = 39,
	TransparentOff = 40,
	ChangeImage = 41,
	ChangeOpacity = 42,
	ChangeBlendMode = 43,
	PlaySE = 44,
	Script = 45,
}

export const enum EventCommandCode {
	ShowText = 101,
	ShowChoices = 102,
	When = 402,
	WhenCancel = 403,
	InputNumber = 103,
	SelectItem = 104,
	ShowScrollingText = 105,
	Comment = 108,
	ConditionalBranch = 111,
	Else = 411,
	Loop = 112,
	RepeatAbove = 413,
	BreakLoop = 113,
	ExitEventProcessing = 115,
	CommonEvent = 117,
	Label = 118,
	JumptoLabel = 119,
	ControlSwitches = 121,
	ControlVariables = 122,
	ControlSelfSwitch = 123,
	ControlTimer = 124,
	ChangeGold = 125,
	ChangeItems = 126,
	ChangeWeapons = 127,
	ChangeArmors = 128,
	ChangePartyMember = 129,
	ChangeBattleBGM = 132,
	ChangeVictoryME = 133,
	ChangeSaveAccess = 134,
	ChangeMenuAccess = 135,
	ChangeEncounterDisable = 136,
	ChangeFormationAccess = 137,
	ChangeWindowColor = 138,
	ChangeDefeatME = 139,
	ChangeVehicleBGM = 140,
	TransferPlayer = 201,
	SetVehicleLocation = 202,
	SetEventLocation = 203,
	ScrollMap = 204,
	SetMovementRoute = 205,
	GettingOnandOffVehicles = 206,
	ChangeTransparency = 211,
	ShowAnimation = 212,
	ShowBalloonIcon = 213,
	EraseEvent = 214,
	ChangePlayerFollowers = 216,
	GatherFollowers = 217,
	FadeoutScreen = 221,
	FadeinScreen = 222,
	TintScreen = 223,
	FlashScreen = 224,
	ShakeScreen = 225,
	Wait = 230,
	ShowPicture = 231,
	MovePicture = 232,
	RotatePicture = 233,
	TintPicture = 234,
	ErasePicture = 235,
	SetWeatherEffect = 236,
	PlayBGM = 241,
	FadeoutBGM = 242,
	SaveBGM = 243,
	ResumeBGM = 244,
	PlayBGS = 245,
	FadeoutBGS = 246,
	PlayME = 249,
	PlaySE = 250,
	StopSE = 251,
	PlayMovie = 261,
	ChangeMapNameDisplay = 281,
	ChangeTileset = 282,
	ChangeBattleBack = 283,
	ChangeParallax = 284,
	GetLocationInfo = 285,
	BattleProcessing = 301,
	IfWin = 601,
	IfEscape = 602,
	IfLose = 603,
	ShopProcessing = 302,
	NameInputProcessing = 303,
	ChangeHP = 311,
	ChangeMP = 312,
	ChangeTP = 326,
	ChangeState = 313,
	RecoverAll = 314,
	ChangeEXP = 315,
	ChangeLevel = 316,
	ChangeParameter = 317,
	ChangeSkill = 318,
	ChangeEquipment = 319,
	ChangeName = 320,
	ChangeClass = 321,
	ChangeActorImages = 322,
	ChangeVehicleImage = 323,
	ChangeNickname = 324,
	ChangeProfile = 325,
	ChangeEnemyHP = 331,
	ChangeEnemyMP = 332,
	ChangeEnemyTP = 342,
	ChangeEnemyState = 333,
	EnemyRecoverAll = 334,
	EnemyAppear = 335,
	EnemyTransform = 336,
	ShowBattleAnimation = 337,
	ForceAction = 339,
	AbortBattle = 340,
	OpenMenuScreen = 351,
	OpenSaveScreen = 352,
	GameOver = 353,
	ReturntoTitleScreen = 354,
	Script = 355,
	PluginCommand = 356,
}

@plugin.type
export class MoveCommand implements MV.MoveCommand {
	public constructor(source?: MV.MoveCommand) {
		if (source) {
			MoveCommand.copy(source, this);
		} else {
			this.code = 0;
			this.parameters = [];
		}
	}

	public code: number;
	public parameters?: any[];

	public copyTo(target: MV.MoveCommand): void {
		MoveCommand.copy(this, target);
	}

	public clone(): MoveCommand {
		return new MoveCommand(this);
	}

	public static copy(src: MV.MoveCommand, dst: MV.MoveCommand): void {
		dst.code = src.code;
		if (src.parameters) dst.parameters = src.parameters.slice();
	}
}

@plugin.type
export class MoveRoute implements MV.MoveRoute {
	public constructor(source?: MV.MoveRoute) {
		if (source) {

		} else {
			this.list = [];
			this.repeat = false;
			this.skippable = false;
			this.wait = false;
		}
	}

	public list: MV.MoveCommand[];
	public repeat: boolean;
	public skippable: boolean;
	public wait: boolean;

	public copyTo(target: MV.MoveRoute): void {
		MoveRoute.copy(this, target);
	}

	public clone(): MoveRoute {
		return new MoveRoute(this);
	}

	public static copy(src: MV.MoveRoute, dst: MV.MoveRoute): void {
		dst.list = src.list.map(command => new MoveCommand(command));
		dst.repeat = src.repeat;
		dst.skippable = src.skippable;
		dst.wait = src.wait;
	}
}

@plugin.type
export class EventPageConditions implements MV.EventPage.Conditions {
	public constructor(source?: MV.EventPage.Conditions) {
		if (source) {
			EventPageConditions.copy(source, this);
		} else {
			this.switch1Valid = false;
			this.switch1Id = 0;
			this.switch2Valid = false;
			this.switch2Id = 0;
			this.variableValid = false;
			this.variableId = 0;
			this.variableValue = 0;
			this.selfSwitchValid = false;
			this.selfSwitchCh = '';
			this.itemValid = false;
			this.itemId = 0;
			this.actorValid = false;
			this.actorId = 0;
		}
	}

	public switch1Valid: boolean;
	public switch1Id: number;
	public switch2Valid: boolean;
	public switch2Id: number;
	public variableValid: boolean;
	public variableId: number;
	public variableValue: number;
	public selfSwitchValid: boolean;
	public selfSwitchCh: string;
	public itemValid: boolean;
	public itemId: number;
	public actorValid: boolean;
	public actorId: number;

	public copyTo(target: MV.EventPage.Conditions): void {
		EventPageConditions.copy(this, target);
	}

	public clone(): EventPageConditions {
		return new EventPageConditions(this);
	}

	public static copy(src: MV.EventPage.Conditions, dst: MV.EventPage.Conditions): void {
		dst.switch1Valid = src.switch1Valid;
		dst.switch1Id = src.switch1Id;
		dst.switch2Valid = src.switch2Valid;
		dst.switch2Id = src.switch2Id;
		dst.variableValid = src.variableValid;
		dst.variableId = src.variableId;
		dst.variableValue = src.variableValue;
		dst.selfSwitchValid = src.selfSwitchValid;
		dst.selfSwitchCh = src.selfSwitchCh;
		dst.itemValid = src.itemValid;
		dst.itemId = src.itemId;
		dst.actorValid = src.actorValid;
		dst.actorId = src.actorId;
	}
}

@plugin.type
export class EventPageImage implements MV.EventPage.Image {
	public constructor(source?: MV.EventPage.Image) {
		if (source) {
			EventPageImage.copy(source, this);
		} else {
			this.characterName = '';
			this.characterIndex = 0;
			this.direction = 2;
			this.pattern = 0;
			this.tileId = 0;
		}
	}

	public characterName: string = '';
	public characterIndex: number = 0;
	public direction: number = 2;
	public pattern: number = 0;
	public tileId: number = 0;

	public copyTo(target: MV.EventPage.Image): void {
		EventPageImage.copy(this, target);
	}

	public clone(): EventPageImage {
		return new EventPageImage(this);
	}

	public static copy(src: MV.EventPage.Image, dst: MV.EventPage.Image): void {
		dst.characterName = src.characterName;
		dst.characterIndex = src.characterIndex;
		dst.direction = src.direction;
		dst.pattern = src.pattern;
		dst.tileId = src.tileId;
	}
}

@plugin.type
export class EventCommand implements MV.EventCommand {
	public constructor(source?: MV.EventCommand) {
		if (source) {
			EventCommand.copy(source, this);
		} else {
			this.code = 0;
			this.indent = 0;
			this.parameters = [];
		}
	}

	public code: number;
	public indent: number;
	public parameters: any[];

	public copyTo(target: MV.EventCommand): void {
		EventCommand.copy(this, target);
	}

	public clone(): EventCommand {
		return new EventCommand(this);
	}

	public static copy(src: MV.EventCommand, dst: MV.EventCommand): void {
		dst.code = src.code;
		dst.indent = src.indent;
		dst.parameters = src.parameters.slice();
	}
}

@plugin.type
export class EventPage implements MV.EventPage {
	public constructor(source?: MV.EventPage) {
		if (source) {
			EventPage.copy(source, this);
		} else {
			this.conditions = new EventPageConditions();
			this.image = new EventPageImage();
			this.moveType = EventMoveType.Fixed;
			this.moveRoute = new MoveRoute();
			this.moveSpeed = EventMoveSpeed.x1;
			this.moveFrequency = EventMoveFrequency.Normal;
			this.walkAnime = false;
			this.stepAnime = false;
			this.directionFix = false;
			this.through = false;
			this.priorityType = EventPriorityType.Normal;
			this.trigger = EventTrigger.Button;
			this.list = [];
		}
	}

	public conditions: MV.EventPage.Conditions;
	public image: MV.EventPage.Image;
	public moveType: number;
	public moveRoute: MV.MoveRoute;
	public moveSpeed: number;
	public moveFrequency: number;
	public walkAnime: boolean;
	public stepAnime: boolean;
	public directionFix: boolean;
	public through: boolean;
	public priorityType: number;
	public trigger: number;
	public list: MV.EventCommand[];

	public copyTo(target: MV.EventPage): void {
		EventPage.copy(this, target);
	}

	public clone(): EventPage {
		return new EventPage(this);
	}

	public static copy(src: MV.EventPage, dst: MV.EventPage): void {
		dst.conditions = new EventPageConditions(src.conditions);
		dst.image = new EventPageImage(src.image);
		dst.moveType = src.moveType;
		dst.moveRoute = new MoveRoute(src.moveRoute);
		dst.moveSpeed = src.moveSpeed;
		dst.moveFrequency = src.moveFrequency;
		dst.walkAnime = src.walkAnime;
		dst.stepAnime = src.stepAnime;
		dst.directionFix = src.directionFix;
		dst.through = src.through;
		dst.priorityType = src.priorityType;
		dst.trigger = src.trigger;
		dst.list = src.list.map(command => new EventCommand(command));
	}
}

@plugin.type
export class Event implements MV.Event {
	public constructor(id: number, source?: MV.Event) {
		this.id = id;

		if (source) {
			Event.copy(source, this);
		} else {
			this.name = '';
			this.x = 0;
			this.y = 0;
			this.pages = [];
			this.note = '';
			this.meta = {};
		}
	}

	public readonly id: number;
	public name: string;
	public x: number;
	public y: number;
	public pages: MV.EventPage[];
	public note: string;
	public meta: MV.Metadata;

	public copyTo(target: MV.Event): void {
		Event.copy(this, target);
	}

	public static copy(src: MV.Event, dst: MV.Event): void {
		dst.name = src.name;
		dst.x = src.x;
		dst.y = src.y;
		dst.pages = src.pages.map(page => new EventPage(page));
		dst.note = src.note;
		dst.meta = JSON.parse(JSON.stringify(src.meta));
	}
}

@plugin.type
export class CommonEvent implements MV.CommonEvent {
	public constructor(id: number, source?: MV.CommonEvent) {
		this.id = id;

		if (source) {
			CommonEvent.copy(source, this);
		} else {
			this.name = '';
			this.trigger = CommonEventTrigger.None;
			this.switchId = 0;
			this.list = [];
		}
	}

	public readonly id: number;
	public name: string;
	public trigger: number;
	public switchId: number;
	public list: MV.EventCommand[];

	public copyTo(target: MV.CommonEvent): void {
		CommonEvent.copy(this, target);
	}

	public static copy(src: MV.CommonEvent, dst: MV.CommonEvent): void {
		dst.name = src.name;
		dst.trigger = src.trigger;
		dst.switchId = src.switchId;
		dst.list = src.list.map(command => new EventCommand(command));
	}
}

@plugin.type
export class DynamicEvent extends Event implements System.Serializable {
	public constructor(id: number, source?: MV.Event) {
		super(id, source);

		this.updateVersion();
	}

	private _version: number;

	public get version(): number { return this._version; }
	public get isExpired(): boolean { return this._version !== EventManager.version; }
	public get model(): Game_Event | null { return (!this.isExpired ? $gameMap.event(this.id) : null); }

	public onDeserialize(): void {
		this.updateVersion();
	}

	public refresh() {
		let model = this.model;
		if (model) {
			let isTile0: boolean, isTile1: boolean;

			isTile0 = model.isTile();
			model.refresh();
			isTile1 = model.isTile();

			if (isTile0 !== isTile1) {
				if (isTile1) {
					$gameMap.tileEvents.push(model);
				} else {
					let index = $gameMap.tileEvents.lastIndexOf(model);
					if (index !== -1) $gameMap.tileEvents.splice(index, 1);
				}
			}
		}
	}

	private updateVersion(): void {
		this._version = EventManager.version;
	}
}

@plugin.type
export class EventManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _version = 1;

	public static get version(): number { return this._version; }

	public static create(source?: MV.Event): DynamicEvent {
		interface GameEventConstructor { new (mapId: number, eventId: number, event: MV.Event): Game_Event; }

		let gameEvents = $gameMap._events;
		let gameEventCtor = <GameEventConstructor>Game_Event;

		let id = Math.max(gameEvents.length, 1);
		let event = new DynamicEvent(id, source);
		let gameEvent = new gameEventCtor($gameMap._mapId, id, event);

		gameEvents[id] = gameEvent;
		EventSpriteManager.create(gameEvent);

		return event;
	}

	public static remove(event: DynamicEvent): void {
		if (!event.isExpired) {
			$gameMap.eraseEvent(event.id);
		}
	}

	public static refresh(): void {
		$gameMap.requestRefresh();
	}

	public static revise(): void {
		this._version++;
	}
}

@plugin.type
export class CommonEventManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _reserved: CommonEvent[] = [];

	public static create(source?: MV.CommonEvent): CommonEvent {
		let event: CommonEvent;
		if ($dataCommonEvents) {
			let id = $dataCommonEvents.length;
			event = new CommonEvent(id, source);
			$dataCommonEvents.push(event);
		} else {
			let descriptors = { source: { value: source, configurable: true } };
			event = <CommonEvent>Object.create(CommonEvent.prototype, descriptors);
			this._reserved.push(event);
		}

		return event;
	}

	public static processReservedEvents() {
		this._reserved.forEach(function (event) {
			let id = $dataCommonEvents.length;
			let source = (<any>event).source;
			delete (<any>event).source;

			CommonEvent.call(event, id, source);
			$dataCommonEvents.push(event);
		});

		this._reserved = [];
	}
}

@plugin.type
export class EventSpriteManager {
	private constructor() { throw new Error(System.ErrorMessages.NEW_STATIC_CLASS); }

	private static _cache: Spriteset_Map | null = null;
	private static _sprites: { [id: number]: Sprite_Character } = {};
	private static _version: number = 0;

	public static create(event: Game_Event): void {
		let spriteset = this.getSpriteset();
		if (spriteset) {
			let sprite = new Sprite_Character(event);
			spriteset._characterSprites.push(sprite);
			spriteset._tilemap.addChild(sprite);
			this._sprites[event.eventId()] = sprite;
		}
	}

	public static remove(event: Game_Event): void {
		let spriteset = this.getSpriteset();
		if (spriteset) {
			let sprite = this._sprites[event.eventId()];
			spriteset._characterSprites.splice(spriteset._characterSprites.lastIndexOf(sprite), 1);
			spriteset._tilemap.removeChild(sprite);
			delete this._sprites[event.eventId()]
		}
	}

	private static getSpriteset(): Spriteset_Map | null {
		if (!this._cache || this._version != EventManager.version) {
			let root = SceneManager._scene;
			if (root) {
				this._cache = this.findSpriteset(root);
				this._sprites = {};
				this._version = EventManager.version;
			}
		}

		return this._cache;
	}

	private static findSpriteset(node: PIXI.DisplayObject): Spriteset_Map | null {
		if (node instanceof Spriteset_Map) return node;

		if (node instanceof PIXI.Container) {
			for (let child of node.children) {
				let result = this.findSpriteset(child);
				if (result) return result;
			}
		}

		return null;
	}
}

@MVPlugin.extension(DataManager, true)
export class DataManagerExtensions {
	@MVPlugin.method
	public static onLoad(base: Function) {
		return function (this: DataManager, object: any): void {
			base.call(this, object);

			if (object === $dataCommonEvents) {
				CommonEventManager.processReservedEvents();
			}
		};
	}
}

@MVPlugin.extension(Game_Map)
export class GameMapExtensions {
	@MVPlugin.method
	public static setupEvents(base: Function) {
		return function (this: Game_Map): void {
			base.call(this);

			EventManager.revise();
		};
	}
}

@MVPlugin.extension(Game_Event)
export class GameEventExtensions {
	@MVPlugin.method
	public static initialize(base: Function) {
		return function (this: Game_Event, mapId: number, eventId: number, event?: MV.Event): void {
			if (event) this._event = event;

			base.call(this, mapId, eventId);
		};
	}

	@MVPlugin.method
	public static event(base: Function) {
		return function (this: Game_Event): MV.Event {
			return this._event || base.call(this);
		};
	}
}