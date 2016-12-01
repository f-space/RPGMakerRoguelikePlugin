/*!
/*:
 * @plugindesc 暗がりエフェクト
 * @author F_
 *
 * @help
 * 暗がりを表現するエフェクト
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
    var plugin, DarknessBitmap, SightSprite, CircleSightSprite, AreaSightSprite, DarknessMode, DarkMapSpriteset;
    return {
        setters:[],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            DarknessBitmap = (function (_super) {
                __extends(DarknessBitmap, _super);
                function DarknessBitmap() {
                    _super.apply(this, arguments);
                }
                DarknessBitmap.prototype.drawCircleShade = function (offset, startColor, endColor) {
                    offset = (+offset).clamp(0, 1);
                    var radius = Math.max(this.width, this.height) * 0.5;
                    var context = this._context;
                    context.save();
                    var gradient = context.createRadialGradient(radius, radius, radius * offset, radius, radius, radius);
                    gradient.addColorStop(0, startColor);
                    gradient.addColorStop(1, endColor);
                    context.fillStyle = gradient;
                    context.globalCompositeOperation = 'copy';
                    context.fillRect(0, 0, this.width, this.height);
                    context.restore();
                    this._setDirty();
                };
                DarknessBitmap.prototype.drawLineShade = function (offset, startColor, endColor) {
                    offset = (+offset).clamp(0, 1);
                    var size = Math.max(this.width, this.height);
                    var context = this._context;
                    context.save();
                    var gradient = context.createLinearGradient(size * offset, 0, size, 0);
                    gradient.addColorStop(0, startColor);
                    gradient.addColorStop(1, endColor);
                    context.fillStyle = gradient;
                    context.globalCompositeOperation = 'copy';
                    context.fillRect(0, 0, this.width, this.height);
                    context.restore();
                    this._setDirty();
                };
                DarknessBitmap.prototype.drawCornerShade = function (offset, startColor, endColor) {
                    offset = (+offset).clamp(0, 1);
                    var radius = Math.max(this.width, this.height);
                    var context = this._context;
                    context.save();
                    var gradient = context.createRadialGradient(0, 0, radius * offset, 0, 0, radius);
                    gradient.addColorStop(0, startColor);
                    gradient.addColorStop(1, endColor);
                    context.fillStyle = gradient;
                    context.globalCompositeOperation = 'copy';
                    context.fillRect(0, 0, this.width, this.height);
                    context.restore();
                    this._setDirty();
                };
                DarknessBitmap = __decorate([
                    plugin.type
                ], DarknessBitmap);
                return DarknessBitmap;
            }(Bitmap));
            exports_1("DarknessBitmap", DarknessBitmap);
            SightSprite = (function (_super) {
                __extends(SightSprite, _super);
                function SightSprite(range, color, innerColor) {
                    _super.call(this);
                    this._dirty = Object.create(null);
                    this.range = (range != null ? range : 0.5);
                    this.color = color;
                    this.innerColor = innerColor;
                    this._fillingSprites = SightSprite.createFillingSprite();
                    this._fillingSprites.forEach(function (sprite) {
                        this.addChild(sprite);
                    }, this);
                }
                Object.defineProperty(SightSprite.prototype, "range", {
                    get: function () { return this._range; },
                    set: function (value) {
                        value = (+value).clamp(0, 1);
                        if (this._range !== value) {
                            this._range = value;
                            this._dirty['range'] = true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SightSprite.prototype, "color", {
                    get: function () { return this._color; },
                    set: function (value) {
                        value = value || 'rgba(0,0,0,1)';
                        if (this._color !== value) {
                            this._color = value;
                            this._dirty['color'] = true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(SightSprite.prototype, "innerColor", {
                    get: function () { return this._innerColor; },
                    set: function (value) {
                        value = value || 'rgba(0,0,0,0)';
                        if (this._innerColor !== value) {
                            this._innerColor = value;
                            this._dirty['innerColor'] = true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                SightSprite.prototype.update = function () {
                    _super.prototype.update.call(this);
                    if (Object.keys(this._dirty).length !== 0) {
                        this.updateImage();
                        this._dirty = Object.create(null);
                    }
                    this.updateRange();
                };
                SightSprite.prototype.updateImage = function () {
                    this.updateFillingImage();
                };
                SightSprite.prototype.updateFillingImage = function () {
                    if (this._dirty['color']) {
                        var bitmap_1 = new Bitmap(1, 1);
                        bitmap_1.fillAll(this.color);
                        var sprites = this._fillingSprites;
                        sprites.forEach(function (sprite) {
                            sprite.bitmap = bitmap_1;
                            sprite.setFrame(0, 0, bitmap_1.width, bitmap_1.height);
                        });
                    }
                };
                SightSprite.prototype.updateFillingSprite = function (left, top, right, bottom) {
                    var sprites = this._fillingSprites;
                    sprites[0].x = left;
                    sprites[0].y = bottom;
                    sprites[1].x = left;
                    sprites[1].y = top;
                    sprites[2].x = right;
                    sprites[2].y = top;
                    sprites[3].x = right;
                    sprites[3].y = bottom;
                };
                SightSprite.createFillingSprite = function () {
                    var width = Graphics.width * 5;
                    var height = Graphics.height * 5;
                    var anchors = [
                        { x: 1, y: 1 },
                        { x: 0, y: 1 },
                        { x: 0, y: 0 },
                        { x: 1, y: 0 },
                    ];
                    var sprites = [];
                    for (var i = 0; i < 4; i++) {
                        var sprite = new Sprite();
                        sprite.anchor.x = anchors[i].x;
                        sprite.anchor.y = anchors[i].y;
                        sprite.x = 0;
                        sprite.y = 0;
                        sprite.scale.x = width;
                        sprite.scale.y = height;
                        sprites.push(sprite);
                    }
                    return sprites;
                };
                SightSprite = __decorate([
                    plugin.type
                ], SightSprite);
                return SightSprite;
            }(Sprite));
            exports_1("SightSprite", SightSprite);
            CircleSightSprite = (function (_super) {
                __extends(CircleSightSprite, _super);
                function CircleSightSprite(radius, range, color, innerColor) {
                    _super.call(this, range, color, innerColor);
                    this.radius = radius;
                    this._circleSprite = CircleSightSprite.createCircleSprite();
                    this.addChild(this._circleSprite);
                }
                Object.defineProperty(CircleSightSprite.prototype, "radius", {
                    get: function () { return this._radius; },
                    set: function (value) {
                        value = Math.max(1, value | 0);
                        if (this._radius !== value) {
                            this._radius = value;
                            this._dirty['radius'] = true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                CircleSightSprite.prototype.updateImage = function () {
                    _super.prototype.updateImage.call(this);
                    this.updateCircleImage();
                };
                CircleSightSprite.prototype.updateCircleImage = function () {
                    if (this._dirty['radius'] || this._dirty['range'] || this._dirty['color'] || this._dirty['innerColor']) {
                        var size = this.radius * 2;
                        var bitmap = new DarknessBitmap(size, size);
                        bitmap.smooth = true;
                        bitmap.drawCircleShade(1 - this.range, this.innerColor, this.color);
                        var sprite = this._circleSprite;
                        sprite.bitmap = bitmap;
                        sprite.setFrame(0, 0, bitmap.width, bitmap.height);
                    }
                };
                CircleSightSprite.prototype.updateRange = function () {
                    var radius = this.radius;
                    this.updateFillingSprite(-radius, -radius, radius, radius);
                };
                CircleSightSprite.createCircleSprite = function () {
                    var sprite = new Sprite();
                    sprite.anchor.x = 0.5;
                    sprite.anchor.y = 0.5;
                    return sprite;
                };
                CircleSightSprite = __decorate([
                    plugin.type
                ], CircleSightSprite);
                return CircleSightSprite;
            }(SightSprite));
            exports_1("CircleSightSprite", CircleSightSprite);
            AreaSightSprite = (function (_super) {
                __extends(AreaSightSprite, _super);
                function AreaSightSprite(areaWidth, areaHeight, radius, range, color, innerColor) {
                    _super.call(this, range, color, innerColor);
                    this.areaWidth = areaWidth;
                    this.areaHeight = areaHeight;
                    this.radius = radius;
                    this._cornerSprites = AreaSightSprite.createCornerSprites();
                    this._lineSprites = AreaSightSprite.createLineSprites();
                    this._squareSprite = AreaSightSprite.createSquareSprite();
                    this._cornerSprites.forEach(function (sprite) {
                        this.addChild(sprite);
                    }, this);
                    this._lineSprites.forEach(function (sprite) {
                        this.addChild(sprite);
                    }, this);
                    this.addChild(this._squareSprite);
                }
                Object.defineProperty(AreaSightSprite.prototype, "areaWidth", {
                    get: function () { return this._areaWidth; },
                    set: function (value) { this._areaWidth = Math.max(1, value | 0); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AreaSightSprite.prototype, "areaHeight", {
                    get: function () { return this._areaHeight; },
                    set: function (value) { this._areaHeight = Math.max(1, value | 0); },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(AreaSightSprite.prototype, "radius", {
                    get: function () { return this._radius; },
                    set: function (value) {
                        value = Math.max(1, value | 0);
                        if (this._radius !== value) {
                            this._radius = value;
                            this._dirty['radius'] = true;
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                AreaSightSprite.prototype.updateImage = function () {
                    _super.prototype.updateImage.call(this);
                    this.updateAreaImages();
                };
                AreaSightSprite.prototype.updateAreaImages = function () {
                    if (this._dirty['radius'] || this._dirty['range'] || this._dirty['color'] || this._dirty['innerColor']) {
                        var corner = new DarknessBitmap(this.radius, this.radius);
                        corner.smooth = true;
                        corner.drawCornerShade(1 - this.range, this.innerColor, this.color);
                        var line = new DarknessBitmap(this.radius, 1);
                        line.smooth = true;
                        line.drawLineShade(1 - this.range, this.innerColor, this.color);
                        var square = new Bitmap(1, 1);
                        square.fillAll(this.innerColor);
                        for (var i = 0; i < 4; i++) {
                            var cornerSprite = this._cornerSprites[i];
                            cornerSprite.bitmap = corner;
                            cornerSprite.setFrame(0, 0, corner.width, corner.height);
                            var lineSprite = this._lineSprites[i];
                            lineSprite.bitmap = line;
                            lineSprite.setFrame(0, 0, line.width, line.height);
                        }
                        var squareSprite = this._squareSprite;
                        squareSprite.bitmap = square;
                        squareSprite.setFrame(0, 0, square.width, square.height);
                    }
                };
                AreaSightSprite.prototype.updateRange = function () {
                    this.updateAreaSprite();
                    this.updateFillingSprite(0, 0, this.areaWidth, this.areaHeight);
                };
                AreaSightSprite.prototype.updateAreaSprite = function () {
                    var radius = this.radius;
                    var width = this.areaWidth;
                    var height = this.areaHeight;
                    var intervalH = Math.max(0, width - radius * 2);
                    var intervalV = Math.max(0, height - radius * 2);
                    var corners = this._cornerSprites;
                    var lines = this._lineSprites;
                    var square = this._squareSprite;
                    corners[0].x = width;
                    corners[0].y = height;
                    lines[0].x = width;
                    lines[0].y = height - radius;
                    lines[0].scale.y = intervalV;
                    corners[1].x = 0;
                    corners[1].y = height;
                    lines[1].x = radius;
                    lines[1].y = height;
                    lines[1].scale.y = intervalH;
                    corners[2].x = 0;
                    corners[2].y = 0;
                    lines[2].x = 0;
                    lines[2].y = radius;
                    lines[2].scale.y = intervalV;
                    corners[3].x = width;
                    corners[3].y = 0;
                    lines[3].x = width - radius;
                    lines[3].y = 0;
                    lines[3].scale.y = intervalH;
                    square.x = radius;
                    square.y = radius;
                    square.scale.x = intervalH;
                    square.scale.y = intervalV;
                };
                AreaSightSprite.createCornerSprites = function () {
                    var sprites = [];
                    for (var i = 0; i < 4; i++) {
                        var sprtie = new Sprite();
                        sprtie.anchor.x = 1;
                        sprtie.anchor.y = 1;
                        sprtie.rotation = i * Math.PI * 0.5;
                        sprites.push(sprtie);
                    }
                    return sprites;
                };
                AreaSightSprite.createLineSprites = function () {
                    var sprites = [];
                    for (var i = 0; i < 4; i++) {
                        var sprite = new Sprite();
                        sprite.anchor.x = 1;
                        sprite.anchor.y = 1;
                        ;
                        sprite.rotation = i * Math.PI * 0.5;
                        sprites.push(sprite);
                    }
                    return sprites;
                };
                AreaSightSprite.createSquareSprite = function () {
                    var sprite = new Sprite();
                    return sprite;
                };
                AreaSightSprite = __decorate([
                    plugin.type
                ], AreaSightSprite);
                return AreaSightSprite;
            }(SightSprite));
            exports_1("AreaSightSprite", AreaSightSprite);
            (function (DarknessMode) {
                DarknessMode[DarknessMode["None"] = 0] = "None";
                DarknessMode[DarknessMode["Circle"] = 1] = "Circle";
                DarknessMode[DarknessMode["Area"] = 2] = "Area";
            })(DarknessMode || (DarknessMode = {}));
            exports_1("DarknessMode", DarknessMode);
            DarkMapSpriteset = (function (_super) {
                __extends(DarkMapSpriteset, _super);
                function DarkMapSpriteset() {
                    _super.apply(this, arguments);
                }
                Object.defineProperty(DarkMapSpriteset.prototype, "darknessMode", {
                    get: function () { return this._darknessMode; },
                    set: function (value) { this._darknessMode = value; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DarkMapSpriteset.prototype, "darknessArea", {
                    get: function () { return this._darknessArea; },
                    set: function (value) { this._darknessArea = value; },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DarkMapSpriteset.prototype, "darknessRange", {
                    get: function () { return this._darknessRange; },
                    set: function (value) {
                        this._circleSight.range = this._areaSight.range = this._darknessRange = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DarkMapSpriteset.prototype, "darknessColor", {
                    get: function () { return this._darknaesColor; },
                    set: function (value) {
                        this._circleSight.color = this._areaSight.color = this._darknaesColor = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(DarkMapSpriteset.prototype, "darknessInnerColor", {
                    get: function () { return this._darknessInnerColor; },
                    set: function (value) {
                        this._circleSight.innerColor = this._areaSight.innerColor = this._darknessInnerColor = value;
                    },
                    enumerable: true,
                    configurable: true
                });
                DarkMapSpriteset.prototype.createUpperLayer = function () {
                    _super.prototype.createUpperLayer.call(this);
                    this.createDarknessEffect();
                };
                DarkMapSpriteset.prototype.update = function () {
                    _super.prototype.update.call(this);
                    this.updateDarknessEffect();
                };
                DarkMapSpriteset.prototype.createDarknessEffect = function () {
                    var tileSize = Math.min($gameMap.tileWidth(), $gameMap.tileHeight());
                    var radius = tileSize * 1.5;
                    this._circleSight = new CircleSightSprite(radius);
                    this._circleSight.z = 6.5;
                    this._tilemap.addChild(this._circleSight);
                    this._areaSight = new AreaSightSprite(0, 0, tileSize);
                    this._areaSight.z = 6.5;
                    this._tilemap.addChild(this._areaSight);
                    this._darknessMode = DarknessMode.None;
                    this._darknessArea = new Rectangle(0, 0, Graphics.width, Graphics.height);
                };
                DarkMapSpriteset.prototype.updateDarknessEffect = function () {
                    var circle = this._circleSight;
                    var area = this._areaSight;
                    circle.visible = false;
                    area.visible = false;
                    if (this._darknessMode === DarknessMode.Circle) {
                        circle.x = $gamePlayer.screenX();
                        circle.y = $gamePlayer.screenY() - $gameMap.tileHeight() * 0.5;
                        circle.visible = true;
                    }
                    else if (this._darknessMode === DarknessMode.Area) {
                        var rect = this._darknessArea;
                        area.x = rect.x;
                        area.y = rect.y;
                        area.areaWidth = rect.width;
                        area.areaHeight = rect.height;
                        area.visible = true;
                    }
                };
                DarkMapSpriteset = __decorate([
                    plugin.type
                ], DarkMapSpriteset);
                return DarkMapSpriteset;
            }(Spriteset_Map));
            exports_1("DarkMapSpriteset", DarkMapSpriteset);
        }
    }
});
