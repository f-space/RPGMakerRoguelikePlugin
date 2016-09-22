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

PluginSystem.require('SceneRedirection')
PluginSystem.require('Roguelike');

PluginSystem.validate(function (params) {
	var marginRegex = /(?:^\s*|\s+)(\d+)(?:px)?(?=\s+|\s*$)/g
	var match = String(params['Margin']).match(marginRegex);
	var margin = (match && match.map(function (value) { return parseInt(value, 10); })) || [];
	if (margin.length === 0) margin.push(0);
	if (margin.length === 1) margin.push(margin[0]);
	if (margin.length === 2) margin.push(margin[0]);
	if (margin.length === 3) margin.push(margin[1]);

	return {
		marginTop: margin[0],
		marginRight: margin[1],
		marginBottom: margin[2],
		marginLeft: margin[3],
		hspace: Math.max(1, parseInt(params['HorizontalSpace'])),
		vspace: Math.max(1, parseInt(params['VerticalSpace'])),
	};
});

PluginSystem.ns('auto', function (scope, params) {
	this.define('MenuStatusWindow', function () {
		function MenuStatusWindow() {
			this.initialize.apply(this, arguments);
		}

		MenuStatusWindow.prototype = Object.create(Window_MenuStatus.prototype);
		MenuStatusWindow.prototype.constructor = MenuStatusWindow;

		MenuStatusWindow.prototype.initialize = function (x, y, width, height) {
			this.windowWidth = function () { return width; };
			this.windowHeight = function () { return height; };

			Window_MenuStatus.prototype.initialize.call(this, x, y);
		}

		MenuStatusWindow.prototype.lineHeight = function () {
			return Math.floor(this.itemHeight() / 3);
		}

		MenuStatusWindow.prototype.drawItemImage = function (index) {
			var actor = $gameParty.members()[index];
			var rect = this.itemRect(index);
			var imageSize = Math.min(rect.width - 2, rect.height - 2);
			this.changePaintOpacity(actor.isBattleMember());
			this.drawActorFace(actor, rect.x + 1, rect.y + 1, imageSize, imageSize);
			this.changePaintOpacity(true);
		}

		return MenuStatusWindow;
	});

	this.define('SummaryWindow', function () {
		function SummaryWindow() {
			this.initialize.apply(this, arguments);
		}

		SummaryWindow.prototype = Object.create(Window_Base.prototype);
		SummaryWindow.prototype.constructor = SummaryWindow;

		SummaryWindow.prototype.initialize = function (x, y, width, height) {
			Window_Base.prototype.initialize.call(this, x, y, width, height);

			this.refresh();
		}

		SummaryWindow.prototype.refresh = function () {

		}

		return SummaryWindow;
	});

	this.define('ItemWindow', function () {
		function ItemWindow() {
			this.initialize.apply(this, arguments);
		}

		ItemWindow.prototype = Object.create(Window_ItemList.prototype);
		ItemWindow.prototype.constructor = ItemWindow;

		ItemWindow.prototype.initialize = function (x, y, width, height) {
			Window_ItemList.prototype.initialize.call(this, x, y, width, height);

			this.refresh();
			this.resetScroll();
			this.select(0);
		}

		ItemWindow.prototype.includes = function (item) {
			if (DataManager.isItem(item) && item.itypeId === 1) return true;
			if (DataManager.isWeapon(item)) return true;
			if (DataManager.isArmor(item)) return true;
			if (DataManager.isItem(item) && item.itypeId === 2) return true;

			return false;
		}

		return ItemWindow;
	});

	this.define('MenuScene', function () {
		function MenuScene() {
			this.initialize.apply(this, arguments);
		}

		MenuScene.prototype = Object.create(Scene_Menu.prototype);
		MenuScene.prototype.constructor = MenuScene;

		MenuScene.prototype.initialize = function () {
			Scene_Menu.prototype.initialize.call(this);
		}

		MenuScene.prototype.create = function () {
			Scene_MenuBase.prototype.create.call(this);
			this.createCommandWindow();
			this.createSummaryWindow();
			this.createStatusWindow();
		};

		MenuScene.prototype.createCommandWindow = function () {
			Scene_Menu.prototype.createCommandWindow.call(this);

			var x = params.marginLeft;
			var y = params.marginTop;
			var width = this._commandWindow.width;
			var height = this._commandWindow.height;
			this._commandWindow.move(x, y, width, height);
		}

		MenuScene.prototype.createSummaryWindow = function () {
			var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
			var height = 200;
			var x = params.marginLeft;
			var y = Graphics.boxHeight - (height + params.marginBottom);
			this._summaryWindow = new scope.SummaryWindow(x, y, width, height);
			this.addWindow(this._summaryWindow);
		};

		MenuScene.prototype.createStatusWindow = function () {
			var leftSpace = params.marginLeft + this._commandWindow.width + params.hspace;
			var bottomSpace = params.marginBottom + this._summaryWindow.height + params.vspace
			var x = leftSpace;
			var y = params.marginTop;
			var width = Graphics.boxWidth - (leftSpace + params.marginRight);
			var height = Graphics.boxHeight - (bottomSpace + params.marginTop);
			this._statusWindow = new scope.MenuStatusWindow(x, y, width, height);
			this.addWindow(this._statusWindow);
		};

		MenuScene.prototype.update = function () {
			Scene_Menu.prototype.update.call(this);

			this._statusWindow.visible = this._statusWindow.active;
		}

		return MenuScene;
	});

	this.define('ItemScene', function () {
		function ItemScene() {
			this.initialize.apply(this, arguments);
		}

		ItemScene.prototype = Object.create(Scene_Item.prototype);
		ItemScene.prototype.constructor = ItemScene;

		ItemScene.prototype.initialize = function () {
			Scene_Item.prototype.initialize.call(this);
		}

		ItemScene.prototype.create = function () {
			Scene_Item.prototype.create.call(this);

			this._itemWindow.activate();
		};

		ItemScene.prototype.createHelpWindow = function () {
			Scene_Item.prototype.createHelpWindow.call(this);

			var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
			var height = this._helpWindow.height;
			var x = params.marginLeft;
			var y = Graphics.boxHeight - (height + params.marginBottom);
			this._helpWindow.move(x, y, width, height);
		}

		ItemScene.prototype.createCategoryWindow = function () { }

		ItemScene.prototype.createItemWindow = function () {
			var bottomSpace = params.marginBottom + this._helpWindow.height + params.vspace;
			var x = params.marginLeft;
			var y = params.marginTop;
			var width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
			var height = Graphics.boxHeight - (params.marginTop + bottomSpace);
			this._itemWindow = new scope.ItemWindow(x, y, width, height);
			this._itemWindow.setHelpWindow(this._helpWindow);
			this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
			this._itemWindow.setHandler('cancel', this.popScene.bind(this));
			this.addWindow(this._itemWindow);
		}

		return ItemScene;
	});

	SceneRedirection.set(Scene_Menu, scope.MenuScene);
	SceneRedirection.set(Scene_Item, scope.ItemScene);
});