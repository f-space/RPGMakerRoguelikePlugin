/*!
/*:
 * @plugindesc ローグライク：アクション
 * @author F_
 * 
 * @help
 * ローグライクにおけるアクションの検出および定義。
 * 
 * Copyright (c) 2016 F_
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

import { DungeonManager, ActionType, Action } from 'Roguelike';
import { PlayerAction } from 'RoguelikeCore';

let plugin = MVPlugin.get(__moduleName);

@MVPlugin.extension(Game_Player)
export class GamePlayerExtensions {
	@MVPlugin.method
	public static moveStraight(base: Function) {
		return function (this: Game_Player, d: number): void {
			if (DungeonManager.inFloor) {
				PlayerAction.set(ActionType.Move, Function.prototype.apply.bind(base, this, arguments));
			} else {
				base.apply(this, arguments);
			}
		}
	}

	@MVPlugin.method
	public static moveDiagonally(base: Function) {
		return function (this: Game_Player, horz: number, vert: number): void {
			if (DungeonManager.inFloor) {
				PlayerAction.set(ActionType.Move, Function.prototype.apply.bind(base, this, arguments));
			} else {
				base.apply(this, arguments);
			}
		}
	}
}

@MVPlugin.extension(Game_Event)
export class GameEventExtensions {
	@MVPlugin.method
	public static distancePerFrame(base: Function) {
		return function (this: Game_Event): number {
			if (DungeonManager.inFloor) {
				return $gamePlayer.distancePerFrame();
			} else {
				return base.apply(this, arguments);
			}
		}
	}
}
