import { AbstractCustomClass } from "ui5plugin-parser/dist/classes/parsing/ui5class/AbstractCustomClass";
import * as vscode from "vscode";
import ParserBearer from "../../ui5parser/ParserBearer";
import Progress from "../../utils/Progress";

export class SwitchToModelCommand extends ParserBearer {
	waitFor(ms: number) {
		return new Promise<void>(resolve => {
			setTimeout(() => {
				resolve();
			}, ms);
		});
	}
	switchToModel() {
		return new Promise<void>((resolve, reject) => {
			Progress.show(async () => {
				const document = vscode.window.activeTextEditor?.document;
				if (document) {
					const currentClassName = this._parser.fileReader.getClassNameFromPath(document.fileName);
					if (currentClassName) {
						const isController = this._parser.classFactory.isClassAChildOfClassB(
							currentClassName,
							"sap.ui.core.mvc.Controller"
						);
						if (isController) {
							const modelName = this._parser.classFactory.getDefaultModelForClass(currentClassName);
							if (modelName) {
								const UIModelClass = this._parser.classFactory.getUIClass(modelName);
								if (UIModelClass instanceof AbstractCustomClass) {
									await this._switchToModel(UIModelClass.className);
									resolve();
								} else {
									reject();
								}
							} else {
								reject(`Default model for "${currentClassName}" controller is not defined`);
							}
						} else {
							reject(`"${currentClassName}" is not a model`);
						}
					}
				}
			}, "Switching to model, searching for default model...");
		});
	}

	private async _switchToModel(modelName: string) {
		const modelFSPath = this._parser.fileReader.getClassFSPathFromClassName(modelName);
		const editor = vscode.window.activeTextEditor;
		if (editor && modelFSPath) {
			await vscode.window.showTextDocument(vscode.Uri.file(modelFSPath));
		}
	}
}
