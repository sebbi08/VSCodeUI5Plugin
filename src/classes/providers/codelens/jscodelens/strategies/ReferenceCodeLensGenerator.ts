import * as vscode from "vscode";
import { FieldsAndMethodForPositionBeforeCurrentStrategy } from "../../../../UI5Classes/JSParser/strategies/FieldsAndMethodForPositionBeforeCurrentStrategy";
import { CustomUIClass, ICustomClassUIMethod } from "../../../../UI5Classes/UI5Parser/UIClass/CustomUIClass";
import { UIClassFactory } from "../../../../UI5Classes/UIClassFactory";
import { TextDocumentTransformer } from "../../../../utils/TextDocumentTransformer";
import { CodeLensGenerator } from "./abstraction/CodeLensGenerator";
import LineColumn = require("line-column");
import { XMLParser } from "../../../../utils/XMLParser";

export interface IReferenceCodeLensCacheable {
	[className: string]: {
		[methodName: string]: vscode.Location[]
	};
}

export class ReferenceCodeLensGenerator extends CodeLensGenerator {
	getCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
		const codeLenses: vscode.CodeLens[] = [];

		if (vscode.workspace.getConfiguration("ui5.plugin").get("jsReferenceCodeLens")) {
			const UIClass = TextDocumentTransformer.toCustomUIClass(document);
			if (UIClass) {
				const methods = UIClass.methods;

				methods.forEach(method => {
					if (method.memberPropertyNode) {
						const locations = this._getReferenceLocations(method);
						const positionBegin = document.positionAt(method.memberPropertyNode.start);
						const positionEnd = document.positionAt(method.memberPropertyNode.end);
						const range = new vscode.Range(positionBegin, positionEnd);
						const codeLens = new vscode.CodeLens(range);
						codeLens.command = {
							title: `${locations.length} reference${locations.length === 1 ? "" : "s"}`,
							command: locations.length ? "editor.action.showReferences" : "",
							arguments: [document.uri, range.start, locations]
						};
						codeLenses.push(codeLens);
					}
				});
			}
		}

		return codeLenses;
	}
	private _getReferenceLocations(method: ICustomClassUIMethod) {
		const locations: vscode.Location[] = [];

		const UIClasses = UIClassFactory.getAllCustomUIClasses();
		UIClasses.forEach(UIClass => {
			if (UIClass.referenceCodeLensCache[method.owner] && UIClass.referenceCodeLensCache[method.owner][method.name]) {
				locations.push(...UIClass.referenceCodeLensCache[method.owner][method.name]);
			} else if (UIClass.classFSPath) {
				const regexp = new RegExp(`(?<=\\.)${method.name}(\\(|\\)|\\,|\\.|\\s)`, "g");
				const results: RegExpExecArray[] = [];
				let result = regexp.exec(UIClass.classText);
				while (result) {
					results.push(result);
					result = regexp.exec(UIClass.classText);
				}

				const currentLocations: vscode.Location[] = [];
				const strategy = new FieldsAndMethodForPositionBeforeCurrentStrategy();
				const uri = vscode.Uri.file(UIClass.classFSPath);
				results.forEach(result => {
					const calleeClassName = strategy.acornGetClassName(UIClass.className, result.index);
					const calleeUIClass = calleeClassName && UIClassFactory.getUIClass(calleeClassName);
					if (
						calleeUIClass && calleeUIClass instanceof CustomUIClass &&
						calleeClassName &&
						(
							UIClassFactory.isClassAChildOfClassB(calleeClassName, method.owner) ||
							(
								UIClassFactory.isClassAChildOfClassB(method.owner, calleeClassName) &&
								UIClassFactory.isClassAChildOfClassB(method.owner, UIClass.className)
							)
						)
					) {
						const lineColumnBegin = LineColumn(UIClass.classText).fromIndex(result.index);
						const lineColumnEnd = LineColumn(UIClass.classText).fromIndex(result.index + method.name.length);
						if (lineColumnBegin && lineColumnEnd) {
							const positionBegin = new vscode.Position(lineColumnBegin.line - 1, lineColumnBegin.col - 1);
							const positionEnd = new vscode.Position(lineColumnEnd.line - 1, lineColumnEnd.col - 1);
							const range = new vscode.Range(positionBegin, positionEnd);
							currentLocations.push(new vscode.Location(uri, range));
						}
					}
				});
				if (currentLocations.length > 0) {
					locations.push(...currentLocations);
				}
				if (!UIClass.referenceCodeLensCache[method.owner]) {
					UIClass.referenceCodeLensCache[method.owner] = {};
				}
				UIClass.referenceCodeLensCache[method.owner][method.name] = currentLocations;
			}
		});

		const UIClass = UIClassFactory.getUIClass(method.owner);
		if (UIClass instanceof CustomUIClass) {
			const viewsAndFragments = UIClassFactory.getViewsAndFragmentsOfControlHierarchically(UIClass);
			const viewAndFragmentArray = [...viewsAndFragments.fragments, ...viewsAndFragments.views];
			viewAndFragmentArray.forEach(XMLDoc => {
				if (XMLDoc.referenceCodeLensCache[method.owner] && XMLDoc.referenceCodeLensCache[method.owner][method.name]) {
					locations.push(...XMLDoc.referenceCodeLensCache[method.owner][method.name]);
				} else {
					const tagsAndAttributes = XMLParser.getXMLFunctionCallTagsAndAttributes(XMLDoc, method.name, method.owner);

					const currentLocations: vscode.Location[] = [];
					tagsAndAttributes.forEach(tagAndAttribute => {
						tagAndAttribute.attributes.forEach(attribute => {
							const positionBegin = tagAndAttribute.tag.positionBegin + tagAndAttribute.tag.text.indexOf(attribute) + attribute.indexOf(method.name);
							const positionEnd = positionBegin + method.name.length;
							const lineColumnBegin = LineColumn(XMLDoc.content).fromIndex(positionBegin);
							const lineColumnEnd = LineColumn(XMLDoc.content).fromIndex(positionEnd);
							if (lineColumnBegin && lineColumnEnd) {
								const positionBegin = new vscode.Position(lineColumnBegin.line - 1, lineColumnBegin.col - 1);
								const positionEnd = new vscode.Position(lineColumnEnd.line - 1, lineColumnEnd.col - 1);
								const range = new vscode.Range(positionBegin, positionEnd);
								const uri = vscode.Uri.file(XMLDoc.fsPath);
								currentLocations.push(new vscode.Location(uri, range));
							}
						});
					});
					if (currentLocations.length > 0) {
						locations.push(...currentLocations);
					}
					if (!XMLDoc.referenceCodeLensCache[method.owner]) {
						XMLDoc.referenceCodeLensCache[method.owner] = {};
					}
					XMLDoc.referenceCodeLensCache[method.owner][method.name] = currentLocations;
				}
			});
		}

		return locations;
	}
}