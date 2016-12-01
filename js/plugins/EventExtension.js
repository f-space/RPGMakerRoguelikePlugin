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
System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var plugin, MoveCommand, MoveRoute, EventPageConditions, EventPageImage, EventCommand, EventPage, Event, CommonEvent, DynamicEvent, EventManager, CommonEventManager, EventSpriteManager, DataManagerExtensions, GameMapExtensions, GameEventExtensions;
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            MoveCommand = (function () {
                function MoveCommand(source) {
                    if (source) {
                        MoveCommand.copy(source, this);
                    }
                    else {
                        this.code = 0;
                        this.parameters = [];
                    }
                }
                MoveCommand.prototype.copyTo = function (target) {
                    MoveCommand.copy(this, target);
                };
                MoveCommand.prototype.clone = function () {
                    return new MoveCommand(this);
                };
                MoveCommand.copy = function (src, dst) {
                    dst.code = src.code;
                    if (src.parameters)
                        dst.parameters = src.parameters.slice();
                };
                MoveCommand = __decorate([
                    plugin.type
                ], MoveCommand);
                return MoveCommand;
            }());
            exports_1("MoveCommand", MoveCommand);
            MoveRoute = (function () {
                function MoveRoute(source) {
                    if (source) {
                    }
                    else {
                        this.list = [];
                        this.repeat = false;
                        this.skippable = false;
                        this.wait = false;
                    }
                }
                MoveRoute.prototype.copyTo = function (target) {
                    MoveRoute.copy(this, target);
                };
                MoveRoute.prototype.clone = function () {
                    return new MoveRoute(this);
                };
                MoveRoute.copy = function (src, dst) {
                    dst.list = src.list.map(function (command) { return new MoveCommand(command); });
                    dst.repeat = src.repeat;
                    dst.skippable = src.skippable;
                    dst.wait = src.wait;
                };
                MoveRoute = __decorate([
                    plugin.type
                ], MoveRoute);
                return MoveRoute;
            }());
            exports_1("MoveRoute", MoveRoute);
            EventPageConditions = (function () {
                function EventPageConditions(source) {
                    if (source) {
                        EventPageConditions.copy(source, this);
                    }
                    else {
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
                EventPageConditions.prototype.copyTo = function (target) {
                    EventPageConditions.copy(this, target);
                };
                EventPageConditions.prototype.clone = function () {
                    return new EventPageConditions(this);
                };
                EventPageConditions.copy = function (src, dst) {
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
                };
                EventPageConditions = __decorate([
                    plugin.type
                ], EventPageConditions);
                return EventPageConditions;
            }());
            exports_1("EventPageConditions", EventPageConditions);
            EventPageImage = (function () {
                function EventPageImage(source) {
                    this.characterName = '';
                    this.characterIndex = 0;
                    this.direction = 2;
                    this.pattern = 0;
                    this.tileId = 0;
                    if (source) {
                        EventPageImage.copy(source, this);
                    }
                    else {
                        this.characterName = '';
                        this.characterIndex = 0;
                        this.direction = 2;
                        this.pattern = 0;
                        this.tileId = 0;
                    }
                }
                EventPageImage.prototype.copyTo = function (target) {
                    EventPageImage.copy(this, target);
                };
                EventPageImage.prototype.clone = function () {
                    return new EventPageImage(this);
                };
                EventPageImage.copy = function (src, dst) {
                    dst.characterName = src.characterName;
                    dst.characterIndex = src.characterIndex;
                    dst.direction = src.direction;
                    dst.pattern = src.pattern;
                    dst.tileId = src.tileId;
                };
                EventPageImage = __decorate([
                    plugin.type
                ], EventPageImage);
                return EventPageImage;
            }());
            exports_1("EventPageImage", EventPageImage);
            EventCommand = (function () {
                function EventCommand(source) {
                    if (source) {
                        EventCommand.copy(source, this);
                    }
                    else {
                        this.code = 0;
                        this.indent = 0;
                        this.parameters = [];
                    }
                }
                EventCommand.prototype.copyTo = function (target) {
                    EventCommand.copy(this, target);
                };
                EventCommand.prototype.clone = function () {
                    return new EventCommand(this);
                };
                EventCommand.copy = function (src, dst) {
                    dst.code = src.code;
                    dst.indent = src.indent;
                    dst.parameters = src.parameters.slice();
                };
                EventCommand = __decorate([
                    plugin.type
                ], EventCommand);
                return EventCommand;
            }());
            exports_1("EventCommand", EventCommand);
            EventPage = (function () {
                function EventPage(source) {
                    if (source) {
                        EventPage.copy(source, this);
                    }
                    else {
                        this.conditions = new EventPageConditions();
                        this.image = new EventPageImage();
                        this.moveType = 0;
                        this.moveRoute = new MoveRoute();
                        this.moveSpeed = 4;
                        this.moveFrequency = 3;
                        this.walkAnime = false;
                        this.stepAnime = false;
                        this.directionFix = false;
                        this.through = false;
                        this.priorityType = 1;
                        this.trigger = 0;
                        this.list = [];
                    }
                }
                EventPage.prototype.copyTo = function (target) {
                    EventPage.copy(this, target);
                };
                EventPage.prototype.clone = function () {
                    return new EventPage(this);
                };
                EventPage.copy = function (src, dst) {
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
                    dst.list = src.list.map(function (command) { return new EventCommand(command); });
                };
                EventPage = __decorate([
                    plugin.type
                ], EventPage);
                return EventPage;
            }());
            exports_1("EventPage", EventPage);
            Event = (function () {
                function Event(id, source) {
                    this.id = id;
                    if (source) {
                        Event.copy(source, this);
                    }
                    else {
                        this.name = '';
                        this.x = 0;
                        this.y = 0;
                        this.pages = [];
                        this.note = '';
                        this.meta = {};
                    }
                }
                Event.prototype.copyTo = function (target) {
                    Event.copy(this, target);
                };
                Event.copy = function (src, dst) {
                    dst.name = src.name;
                    dst.x = src.x;
                    dst.y = src.y;
                    dst.pages = src.pages.map(function (page) { return new EventPage(page); });
                    dst.note = src.note;
                    dst.meta = JSON.parse(JSON.stringify(src.meta));
                };
                Event = __decorate([
                    plugin.type
                ], Event);
                return Event;
            }());
            exports_1("Event", Event);
            CommonEvent = (function () {
                function CommonEvent(id, source) {
                    this.id = id;
                    if (source) {
                        CommonEvent.copy(source, this);
                    }
                    else {
                        this.name = '';
                        this.trigger = 0;
                        this.switchId = 0;
                        this.list = [];
                    }
                }
                CommonEvent.prototype.copyTo = function (target) {
                    CommonEvent.copy(this, target);
                };
                CommonEvent.copy = function (src, dst) {
                    dst.name = src.name;
                    dst.trigger = src.trigger;
                    dst.switchId = src.switchId;
                    dst.list = src.list.map(function (command) { return new EventCommand(command); });
                };
                CommonEvent = __decorate([
                    plugin.type
                ], CommonEvent);
                return CommonEvent;
            }());
            exports_1("CommonEvent", CommonEvent);
            DynamicEvent = (function (_super) {
                __extends(DynamicEvent, _super);
                function DynamicEvent(id, source) {
                    _super.call(this, id, source);
                    this.updateVersion();
                }
                Object.defineProperty(DynamicEvent.prototype, "version", {
                    get: function () { return this._version; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DynamicEvent.prototype, "isExpired", {
                    get: function () { return this._version !== EventManager.version; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DynamicEvent.prototype, "model", {
                    get: function () { return (!this.isExpired ? $gameMap.event(this.id) : null); },
                    enumerable: true,
                    configurable: true
                });
                DynamicEvent.prototype.onDeserialize = function () {
                    this.updateVersion();
                };
                DynamicEvent.prototype.refresh = function () {
                    var model = this.model;
                    if (model) {
                        var isTile0 = void 0, isTile1 = void 0;
                        isTile0 = model.isTile();
                        model.refresh();
                        isTile1 = model.isTile();
                        if (isTile0 !== isTile1) {
                            if (isTile1) {
                                $gameMap.tileEvents.push(model);
                            }
                            else {
                                var index = $gameMap.tileEvents.lastIndexOf(model);
                                if (index !== -1)
                                    $gameMap.tileEvents.splice(index, 1);
                            }
                        }
                    }
                };
                DynamicEvent.prototype.updateVersion = function () {
                    this._version = EventManager.version;
                };
                DynamicEvent = __decorate([
                    plugin.type
                ], DynamicEvent);
                return DynamicEvent;
            }(Event));
            exports_1("DynamicEvent", DynamicEvent);
            EventManager = (function () {
                function EventManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                Object.defineProperty(EventManager, "version", {
                    get: function () { return this._version; },
                    enumerable: true,
                    configurable: true
                });
                EventManager.create = function (source) {
                    var gameEvents = $gameMap._events;
                    var gameEventCtor = Game_Event;
                    var id = Math.max(gameEvents.length, 1);
                    var event = new DynamicEvent(id, source);
                    var gameEvent = new gameEventCtor($gameMap._mapId, id, event);
                    gameEvents[id] = gameEvent;
                    EventSpriteManager.create(gameEvent);
                    return event;
                };
                EventManager.remove = function (event) {
                    if (!event.isExpired) {
                        $gameMap.eraseEvent(event.id);
                    }
                };
                EventManager.refresh = function () {
                    $gameMap.requestRefresh();
                };
                EventManager.revise = function () {
                    this._version++;
                };
                EventManager._version = 1;
                EventManager = __decorate([
                    plugin.type
                ], EventManager);
                return EventManager;
            }());
            exports_1("EventManager", EventManager);
            CommonEventManager = (function () {
                function CommonEventManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                CommonEventManager.create = function (source) {
                    var event;
                    if ($dataCommonEvents) {
                        var id = $dataCommonEvents.length;
                        event = new CommonEvent(id, source);
                        $dataCommonEvents.push(event);
                    }
                    else {
                        var descriptors = { source: { value: source, configurable: true } };
                        event = Object.create(CommonEvent.prototype, descriptors);
                        this._reserved.push(event);
                    }
                    return event;
                };
                CommonEventManager.processReservedEvents = function () {
                    this._reserved.forEach(function (event) {
                        var id = $dataCommonEvents.length;
                        var source = event.source;
                        delete event.source;
                        CommonEvent.call(event, id, source);
                        $dataCommonEvents.push(event);
                    });
                    this._reserved = [];
                };
                CommonEventManager._reserved = [];
                CommonEventManager = __decorate([
                    plugin.type
                ], CommonEventManager);
                return CommonEventManager;
            }());
            exports_1("CommonEventManager", CommonEventManager);
            EventSpriteManager = (function () {
                function EventSpriteManager() {
                    throw new Error(System.ErrorMessages.NEW_STATIC_CLASS);
                }
                EventSpriteManager.create = function (event) {
                    var spriteset = this.getSpriteset();
                    if (spriteset) {
                        var sprite = new Sprite_Character(event);
                        spriteset._characterSprites.push(sprite);
                        spriteset._tilemap.addChild(sprite);
                        this._sprites[event.eventId()] = sprite;
                    }
                };
                EventSpriteManager.remove = function (event) {
                    var spriteset = this.getSpriteset();
                    if (spriteset) {
                        var sprite = this._sprites[event.eventId()];
                        spriteset._characterSprites.splice(spriteset._characterSprites.lastIndexOf(sprite), 1);
                        spriteset._tilemap.removeChild(sprite);
                        delete this._sprites[event.eventId()];
                    }
                };
                EventSpriteManager.getSpriteset = function () {
                    if (!this._cache || this._version != EventManager.version) {
                        var root = SceneManager._scene;
                        if (root) {
                            this._cache = this.findSpriteset(root);
                            this._sprites = {};
                            this._version = EventManager.version;
                        }
                    }
                    return this._cache;
                };
                EventSpriteManager.findSpriteset = function (node) {
                    if (node instanceof Spriteset_Map)
                        return node;
                    if (node instanceof PIXI.Container) {
                        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            var result = this.findSpriteset(child);
                            if (result)
                                return result;
                        }
                    }
                    return null;
                };
                EventSpriteManager._cache = null;
                EventSpriteManager._sprites = {};
                EventSpriteManager._version = 0;
                EventSpriteManager = __decorate([
                    plugin.type
                ], EventSpriteManager);
                return EventSpriteManager;
            }());
            exports_1("EventSpriteManager", EventSpriteManager);
            DataManagerExtensions = (function () {
                function DataManagerExtensions() {
                }
                DataManagerExtensions.onLoad = function (base) {
                    return function (object) {
                        base.call(this, object);
                        if (object === $dataCommonEvents) {
                            CommonEventManager.processReservedEvents();
                        }
                    };
                };
                __decorate([
                    MVPlugin.method
                ], DataManagerExtensions, "onLoad", null);
                DataManagerExtensions = __decorate([
                    MVPlugin.extension(DataManager, true)
                ], DataManagerExtensions);
                return DataManagerExtensions;
            }());
            exports_1("DataManagerExtensions", DataManagerExtensions);
            GameMapExtensions = (function () {
                function GameMapExtensions() {
                }
                GameMapExtensions.setupEvents = function (base) {
                    return function () {
                        base.call(this);
                        EventManager.revise();
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameMapExtensions, "setupEvents", null);
                GameMapExtensions = __decorate([
                    MVPlugin.extension(Game_Map)
                ], GameMapExtensions);
                return GameMapExtensions;
            }());
            exports_1("GameMapExtensions", GameMapExtensions);
            GameEventExtensions = (function () {
                function GameEventExtensions() {
                }
                GameEventExtensions.initialize = function (base) {
                    return function (mapId, eventId, event) {
                        if (event)
                            this._event = event;
                        base.call(this, mapId, eventId);
                    };
                };
                GameEventExtensions.event = function (base) {
                    return function () {
                        return this._event || base.call(this);
                    };
                };
                __decorate([
                    MVPlugin.method
                ], GameEventExtensions, "initialize", null);
                __decorate([
                    MVPlugin.method
                ], GameEventExtensions, "event", null);
                GameEventExtensions = __decorate([
                    MVPlugin.extension(Game_Event)
                ], GameEventExtensions);
                return GameEventExtensions;
            }());
            exports_1("GameEventExtensions", GameEventExtensions);
        }
    }
});
