import * as vscode from "vscode";
import { CustomUIClass } from "../../../../../../../UI5Classes/UI5Parser/UIClass/CustomUIClass";
import { RootNode } from "../../../abstraction/RootNode";

export class MethodsNode extends RootNode {
	constructor(UIClass: CustomUIClass) {
		super(UIClass);
		this.label = `Methods (${UIClass.methods.length})`;
		this.iconPath = this._buildIconPath("symbol-method.svg");
	}
	collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
}