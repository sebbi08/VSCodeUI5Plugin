import { UIClassFactory } from "../../../UI5Classes/UIClassFactory";
import { CustomCompletionItem } from "../CustomCompletionItem";
import * as vscode from "vscode";
import { ReusableMethods } from "../../reuse/ReusableMethods";
import { FileReader } from "../../../utils/FileReader";
import { CustomUIClass } from "../../../UI5Classes/UI5Parser/UIClass/CustomUIClass";
import { SAPNodeDAO } from "../../../librarydata/SAPNodeDAO";
import { AcornSyntaxAnalyzer } from "../../../UI5Classes/JSParser/AcornSyntaxAnalyzer";

export class ClassCompletionItemFactory {
	static createCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
		let completionItems: CustomCompletionItem[] = [];

		const currentPositionIsNotAMemberOrFNCall = this._getIfPositionIsNotInMember(document, position);

		if (currentPositionIsNotAMemberOrFNCall) {
			const classes = UIClassFactory.getAllExistentUIClasses();
			const currentClassName = FileReader.getClassNameFromPath(document.fileName);
			if (currentClassName) {

				const currentUIClass = <CustomUIClass>UIClassFactory.getUIClass(currentClassName);
				const classNames = Object.keys(classes);
				const customUIClassNames = classNames.filter(className => UIClassFactory.getUIClass(className) instanceof CustomUIClass);
				const flatNodes = new SAPNodeDAO().getFlatNodes();
				const standardUIClassNames = Object.keys(flatNodes).filter(className => {
					const node = flatNodes[className];
					return node.node.visibility === "public" && (node.getKind() === "class" || node.getKind() === "enum" || node.getKind() === "namespace")
				});
				const allClassNames = customUIClassNames.concat(standardUIClassNames);
				const filteredClassNames = allClassNames.filter(className => {
					return !currentUIClass.UIDefine.find(UIDefine => className === UIDefine.classNameDotNotation);
				});
				const position = ReusableMethods.getPositionOfTheLastUIDefine(document);
				completionItems = filteredClassNames.map(className => {
					const classNameParts = className.split(".");
					const shortClassName = classNameParts[classNameParts.length - 1];
					const completionItem: CustomCompletionItem = new CustomCompletionItem(shortClassName);
					completionItem.kind = vscode.CompletionItemKind.Class;
					completionItem.insertText = shortClassName;
					completionItem.detail = `${className}`;

					if (position) {
						const range = new vscode.Range(position, position);
						const classNameModulePath = `"${className.replace(/\./g, "/")}"`;
						const insertText = currentUIClass.UIDefine.length === 0 ? `\n\t${classNameModulePath}` : `,\n\t${classNameModulePath}`;
						completionItem.additionalTextEdits = [new vscode.TextEdit(range, insertText)];
						completionItem.command = { command: "ui5plugin.moveDefineToFunctionParameters", title: "Add to UI Define" };
					}

					return completionItem;
				});
			}
		}

		return completionItems;
	}
	private static _getIfPositionIsNotInMember(document: vscode.TextDocument, position: vscode.Position) {
		let currentPositionIsNotAMemberOrFNCall = false;

		const currentClassName = FileReader.getClassNameFromPath(document.fileName);
		if (currentClassName) {
			const offset = document.offsetAt(position);
			const currentUIClass = <CustomUIClass>UIClassFactory.getUIClass(currentClassName);
			const currentMethod = currentUIClass.methods.find(method => {
				return method.acornNode?.start < offset && offset < method.acornNode?.end;
			});
			if (currentMethod) {
				const allContent = AcornSyntaxAnalyzer.expandAllContent(currentMethod.acornNode);
				const memberOrCallExpression = allContent.find((node: any) => {
					return (
						node.type === "MemberExpression" || node.type === "CallExpression"
					) &&
						node.start <= offset && node.end >= offset;
				});

				currentPositionIsNotAMemberOrFNCall = !memberOrCallExpression;
			}
		}


		return currentPositionIsNotAMemberOrFNCall;
	}
}