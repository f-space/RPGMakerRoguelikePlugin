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

import { SceneRedirection } from 'SceneRedirection';

let plugin = MVPlugin.get(__moduleName);
let params = plugin.validate($ => {
	let marginRegex = /(?:^\s*|\s+)(\d+)(?:px)?(?=\s+|\s*$)/g
	let match = $.string('Margin').match(marginRegex);
	let margin = (match && match.map(x => parseInt(x, 10))) || [];
	if (margin.length === 0) margin.push(0);
	if (margin.length === 1) margin.push(margin[0]);
	if (margin.length === 2) margin.push(margin[0]);
	if (margin.length === 3) margin.push(margin[1]);

	return {
		marginTop: margin[0],
		marginRight: margin[1],
		marginBottom: margin[2],
		marginLeft: margin[3],
		hspace: Math.max(1, $.int('HorizontalSpace')),
		vspace: Math.max(1, $.int('VerticalSpace')),
	};
});

export class MenuStatusWindow extends Window_MenuStatus {
	public constructor(x: number, y: number, width: number, height: number) {
		super();

		this.move(x, y, width, height);
	}

	public lineHeight(): number {
		return Math.floor(this.itemHeight() / 3);
	}

	public drawItemImage(index: number): void {
		let actor = $gameParty.members()[index];
		let rect = this.itemRect(index);
		let imageSize = Math.min(rect.width - 2, rect.height - 2);
		this.changePaintOpacity(actor.isBattleMember());
		this.drawActorFace(actor, rect.x + 1, rect.y + 1, imageSize, imageSize);
		this.changePaintOpacity(true);
	}
}

export class SummaryWindow extends Window_Base {

}

export class ItemWindow extends Window_ItemList {
	public constructor(x: number, y: number, width: number, height: number) {
		super(x, y, width, height);

		this.refresh();
		this.resetScroll();
		this.select(0);
	}

	public includes(item: MV.Item): boolean {
		if (DataManager.isItem(item) && item.itypeId === 1) return true;
		if (DataManager.isWeapon(item)) return true;
		if (DataManager.isArmor(item)) return true;
		if (DataManager.isItem(item) && item.itypeId === 2) return true;

		return false;
	}
}

export class MenuScene extends Scene_Menu {

	protected _summaryWindow: SummaryWindow;

	public create(): void {
		Scene_MenuBase.prototype.create.call(this);

		this.createCommandWindow();
		this.createSummaryWindow();
		this.createStatusWindow();
	};

	public createCommandWindow(): void {
		super.createCommandWindow();

		let x = params.marginLeft;
		let y = params.marginTop;
		let width = this._commandWindow.width;
		let height = this._commandWindow.height;
		this._commandWindow.move(x, y, width, height);
	}

	public createSummaryWindow(): void {
		let width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
		let height = 200;
		let x = params.marginLeft;
		let y = Graphics.boxHeight - (height + params.marginBottom);
		this._summaryWindow = new SummaryWindow(x, y, width, height);
		this.addWindow(this._summaryWindow);
	};

	public createStatusWindow(): void {
		let leftSpace = params.marginLeft + this._commandWindow.width + params.hspace;
		let bottomSpace = params.marginBottom + this._summaryWindow.height + params.vspace;
		let x = leftSpace;
		let y = params.marginTop;
		let width = Graphics.boxWidth - (leftSpace + params.marginRight);
		let height = Graphics.boxHeight - (bottomSpace + params.marginTop);
		this._statusWindow = new MenuStatusWindow(x, y, width, height);
		this.addWindow(this._statusWindow);
	};

	public update(): void {
		super.update();

		this._statusWindow.visible = this._statusWindow.active;
	}
}

export class ItemScene extends Scene_Item {

	public create(): void {
		Scene_Item.prototype.create.call(this);

		this._itemWindow.activate();
	};

	public createHelpWindow(): void {
		Scene_Item.prototype.createHelpWindow.call(this);

		let width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
		let height = this._helpWindow.height;
		let x = params.marginLeft;
		let y = Graphics.boxHeight - (height + params.marginBottom);
		this._helpWindow.move(x, y, width, height);
	}

	public createCategoryWindow(): void { }

	public createItemWindow(): void {
		let bottomSpace = params.marginBottom + this._helpWindow.height + params.vspace;
		let x = params.marginLeft;
		let y = params.marginTop;
		let width = Graphics.boxWidth - (params.marginLeft + params.marginRight);
		let height = Graphics.boxHeight - (params.marginTop + bottomSpace);
		this._itemWindow = new ItemWindow(x, y, width, height);
		this._itemWindow.setHelpWindow(this._helpWindow);
		this._itemWindow.setHandler('ok', this.onItemOk.bind(this));
		this._itemWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._itemWindow);
	}
}

SceneRedirection.set(Scene_Menu, MenuScene);
SceneRedirection.set(Scene_Item, ItemScene);