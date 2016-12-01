/*!
/*:
 * @plugindesc ローグライク：メニュー
 * @author F_
 *
 * @param Margin
 * @desc 余白(CSS-Style but 'px' only)。
 * @default 20
 *
 * @param HorizontalSpace
 * @desc 水平方向のウィンドウ間隔。
 * @default 20
 *
 * @param VerticalSpace
 * @desc 垂直方向のウィンドウ間隔。
 * @default 20
 *
 * @help
 * ローグライクゲームで使用しやすいメニュー画面へと変更するプラグイン。
 *
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */
System.register(['SceneRedirection'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var SceneRedirection_1;
    var plugin, params, MenuStatusWindow, SummaryWindow, ItemWindow, MenuScene, ItemScene;
    return {
        setters:[
            function (SceneRedirection_1_1) {
                SceneRedirection_1 = SceneRedirection_1_1;
            }],
        execute: function() {
            plugin = MVPlugin.get(__moduleName);
            params = plugin.validate(function ($) {
                var marginRegex = /(?:^\s*|\s+)(\d+)(?:px)?(?=\s+|\s*$)/g;
                var match = $.string('Margin').match(marginRegex);
                var margin = (match && match.map(function (x) { return parseInt(x, 10); })) || [];
                if (margin.length === 0)
                    margin.push(0);
                if (margin.length === 1)
                    margin.push(margin[0]);
                if (margin.length === 2)
                    margin.push(margin[0]);
                if (margin.length === 3)
                    margin.push(margin[1]);
                return {
                    marginTop: margin[0],
                    marginRight: margin[1],
                    marginBottom: margin[2],
                    marginLeft: margin[3],
                    hspace: Math.max(1, $.int('HorizontalSpace')),
                    vspace: Math.max(1, $.int('VerticalSpace')),
                };
            });
            MenuStatusWindow = (function (_super) {
                __extends(MenuStatusWindow, _super);
                function MenuStatusWindow(x, y, width, height) {
                    _super.call(this);
                    this.move(x, y, width, height);
                }
                MenuStatusWindow.prototype.lineHeight = function () {
                    return Math.floor(this.itemHeight() / 3);
                };
                MenuStatusWindow.prototype.drawItemImage = function (index) {
                    var actor = $gameParty.members()[index];
                    var rect = this.itemRect(index);
                    var imageSize = Math.min(rect.width - 2, rect.height - 2);
                    this.changePaintOpacity(actor.isBattleMember());
                    this.drawActorFace(actor, rect.x + 1, rect.y + 1, imageSize, imageSize);
                    this.changePaintOpacity(true);
                };
                return MenuStatusWindow;
            }(Window_MenuStatus));
            exports_1("MenuStatusWindow", MenuStatusWindow);
            SummaryWindow = (function (_super) {
                __extends(SummaryWindow, _super);
                function SummaryWindow() {
                    _super.apply(this, arguments);
                }
                return SummaryWindow;
            }(Window_Base));
            exports_1("SummaryWindow", SummaryWindow);
            ItemWindow = (function (_super) {
                __extends(ItemWindow, _super);
                function ItemWindow(x, y, width, height) {
                    _super.call(this, x, y, width, height);
                    this.refresh();
                    this.resetScroll();
                    this.select(0);
                }
                ItemWindow.prototype.includes = function (item) {
                    if (DataManager.isItem(item) && item.itypeId === 1)
                        return true;
                    if (DataManager.isWeapon(item))
                        return true;
                    if (DataManager.isArmor(item))
                        return true;
                    if (DataManager.isItem(item) && item.itypeId === 2)
                        return true;
                    return false;
                };
                return ItemWindow;
            }(Window_ItemList));
            exports_1("ItemWindow", ItemWindow);
            MenuScene = (function (_super) {
                __extends(MenuScene, _super);
                function MenuScene() {
                    _super.apply(this, arguments);
                }
                MenuScene.prototype.create = function () {
                    Scene_MenuBase.prototype.create.call(this);
                    this.createCommandWindow();
                    this.createSummaryWindow();
                    this.createStatusWindow();
                };
                ;
                MenuScene.prototype.createCommandWindow = function () {
                    _super.prototype.createCommandWindow.call(this);
                    var x = params.marginLeft;
                    var y = params.marginTop;
                    var width = this._commandWindow.width;
                    var height = this._commandWindow.height;
                    this._commandWindow.move(x, y, width, height);
                };
                MenuScene.prototype.createSummaryWindow = function () {
                    var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
                    var height = 200;
                    var x = params.marginLeft;
                    var y = Graphics.boxHeight - (height + params.marginBottom);
                    this._summaryWindow = new SummaryWindow(x, y, width, height);
                    this.addWindow(this._summaryWindow);
                };
                ;
                MenuScene.prototype.createStatusWindow = function () {
                    var leftSpace = params.marginLeft + this._commandWindow.width + params.hspace;
                    var bottomSpace = params.marginBottom + this._summaryWindow.height + params.vspace;
                    var x = leftSpace;
                    var y = params.marginTop;
                    var width = Graphics.boxWidth - (leftSpace + params.marginRight);
                    var height = Graphics.boxHeight - (bottomSpace + params.marginTop);
                    this._statusWindow = new MenuStatusWindow(x, y, width, height);
                    this.addWindow(this._statusWindow);
                };
                ;
                MenuScene.prototype.update = function () {
                    _super.prototype.update.call(this);
                    this._statusWindow.visible = this._statusWindow.active;
                };
                return MenuScene;
            }(Scene_Menu));
            exports_1("MenuScene", MenuScene);
            ItemScene = (function (_super) {
                __extends(ItemScene, _super);
                function ItemScene() {
                    _super.apply(this, arguments);
                }
                ItemScene.prototype.create = function () {
                    Scene_Item.prototype.create.call(this);
                    this._itemWindow.activate();
                };
                ;
                ItemScene.prototype.createHelpWindow = function () {
                    Scene_Item.prototype.createHelpWindow.call(this);
                    var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
                    var height = this._helpWindow.height;
                    var x = params.marginLeft;
                    var y = Graphics.boxHeight - (height + params.marginBottom);
                    this._helpWindow.move(x, y, width, height);
                };
                ItemScene.prototype.createCategoryWindow = function () { };
                ItemScene.prototype.createItemWindow = function () {
                    var bottomSpace = params.marginBottom + this._helpWindow.height + params.vspace;
                    var x = params.marginLeft;
                    var y = params.marginTop;
                    var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
                    var height = Graphics.boxHeight - (params.marginTop + bottomSpace);
                    this._itemWindow = new ItemWindow(x, y, width, height);
                    this._itemWindow.setHelpWindow(this._helpWindow);
                    this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
                    this._itemWindow.setHandler('cancel', this.popScene.bind(this));
                    this.addWindow(this._itemWindow);
                };
                return ItemScene;
            }(Scene_Item));
            exports_1("ItemScene", ItemScene);
            SceneRedirection_1.SceneRedirection.set(Scene_Menu, MenuScene);
            SceneRedirection_1.SceneRedirection.set(Scene_Item, ItemScene);
        }
    }
});
