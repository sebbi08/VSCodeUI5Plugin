import { Error, Linter } from "./abstraction/Linter";
import * as vscode from "vscode";
import LineColumn = require("line-column");
import { CustomUIClass } from "../../UI5Classes/UI5Parser/UIClass/CustomUIClass";
import { UIClassFactory } from "../../UI5Classes/UIClassFactory";
import { FileReader } from "../../utils/FileReader";
import { AcornSyntaxAnalyzer } from "../../UI5Classes/JSParser/AcornSyntaxAnalyzer";
import { FieldsAndMethodForPositionBeforeCurrentStrategy } from "../../UI5Classes/JSParser/strategies/FieldsAndMethodForPositionBeforeCurrentStrategy";
export class WrongParametersLinter extends Linter {
	getErrors(document: vscode.TextDocument): Error[] {
		const errors: Error[] = [];
		const className = FileReader.getClassNameFromPath(document.fileName);
		if (className) {
			const UIClass = UIClassFactory.getUIClass(className);
			if (UIClass instanceof CustomUIClass && UIClass.acornClassBody) {
				UIClass.acornClassBody.properties.forEach((node: any) => {
					const content = AcornSyntaxAnalyzer.expandAllContent(node.value);
					const calls = content.filter(node => node.type === "CallExpression");
					calls.forEach(call => {
						const params = call.arguments;
						const methodName = call.callee?.property?.name;
						const endPosition = call.callee?.property?.end;
						if (methodName && endPosition) {
							const strategy = new FieldsAndMethodForPositionBeforeCurrentStrategy();
							const classNameOfTheMethodCallee = strategy.acornGetClassName(className, endPosition);
							if (classNameOfTheMethodCallee) {
								const fieldsAndMethods = strategy.destructueFieldsAndMethodsAccordingToMapParams(classNameOfTheMethodCallee);
								if (fieldsAndMethods) {
									const method = fieldsAndMethods.methods.find(method => method.name === methodName);
									if (method) {
										const methodParams = method.params;
										const mandatoryMethodParams = methodParams.filter(param => !param.isOptional);
										if (params.length < mandatoryMethodParams.length || params.length > methodParams.length) {
											const positionStart = LineColumn(UIClass.classText).fromIndex(call.callee.property.start);
											const positionEnd = LineColumn(UIClass.classText).fromIndex(call.callee.property.end);
											if (positionStart && positionEnd) {
												errors.push({
													acornNode: call,
													code: "",
													message: `Method "${methodName}" has ${mandatoryMethodParams.length} mandatory param(s), but you provided ${params.length}`,
													range: new vscode.Range(
														new vscode.Position(positionStart.line - 1, positionStart.col - 1),
														new vscode.Position(positionEnd.line - 1, positionEnd.col - 1)
													),
												});
											}
										}

										params.forEach((param: any, i: number) => {
											const paramFromMethod = method.params[i];
											if (paramFromMethod && paramFromMethod.type !== "any") {
												let classNameOfTheParam = AcornSyntaxAnalyzer.findClassNameForStack([param], className);
												if (!classNameOfTheParam) {
													classNameOfTheParam = AcornSyntaxAnalyzer.getClassNameFromAcornDeclaration(param, UIClass);
												}

												if (classNameOfTheParam && classNameOfTheParam !== paramFromMethod.type) {
													const paramFromMethodTypes = paramFromMethod.type.split("|");
													let typeMismatch = !paramFromMethodTypes.includes(classNameOfTheParam);
													if (typeMismatch) {
														typeMismatch = !!paramFromMethodTypes.find(className => this._getIfClassesDiffers(className, classNameOfTheParam));
													}
													if (typeMismatch) {
														const positionStart = LineColumn(UIClass.classText).fromIndex(param.start);
														const positionEnd = LineColumn(UIClass.classText).fromIndex(param.end);
														if (positionStart && positionEnd) {
															errors.push({
																acornNode: param,
																code: "",
																message: `Param "${paramFromMethod.name}" is of type "${classNameOfTheParam}", but expected "${paramFromMethod.type}"`,
																range: new vscode.Range(
																	new vscode.Position(positionStart.line - 1, positionStart.col - 1),
																	new vscode.Position(positionEnd.line - 1, positionEnd.col - 1)
																),
															});
														}
													}
												}
											}

										});
									}
								}
							}
						}
					});
				});
			}
		}

		return errors;
	}

	private _getIfClassesDiffers(expectedClass: string, actualClass: string) {
		let classesDiffers = true;

		if (expectedClass.endsWith("[]")) {
			expectedClass = "array";
		}
		if (actualClass.endsWith("[]")) {
			actualClass = "array";
		}

		if (expectedClass.toLowerCase() === "object" && actualClass.toLowerCase() === "map") {
			classesDiffers = false;
		} else if (expectedClass.toLowerCase() === "any" || actualClass.toLowerCase() === "any") {
			classesDiffers = false;
		} else if (expectedClass.toLowerCase() === "object" && UIClassFactory.isClassAExtendedByClassB(actualClass, "sap.ui.base.Object")) {
			classesDiffers = false;
		} else if (actualClass.toLowerCase() === "object" && UIClassFactory.isClassAExtendedByClassB(expectedClass, "sap.ui.base.Object")) {
			classesDiffers = false;
		} else {
			classesDiffers = !UIClassFactory.isClassAExtendedByClassB(actualClass, expectedClass);
		}

		return classesDiffers;
	}
}