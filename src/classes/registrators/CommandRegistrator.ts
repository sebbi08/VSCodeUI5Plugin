import * as vscode from "vscode";
import { ProjectType, UI5Plugin } from "../../UI5Plugin";
import { ClearCacheCommand } from "../vscommands/ClearCacheCommand";
import { FallbackCommand } from "../vscommands/FallbackCommand";
import { GenerateERDiagramCommand } from "../vscommands/umlgenerator/GenerateERDiagramCommand";
import { ExportToI18NCommand } from "../vscommands/i18ncommand/ExportToI18NCommand";
import { InsertCustomClassNameCommand } from "../vscommands/InsertCustomClassNameCommand";
import { SAPUIDefineCommand } from "../vscommands/SAPUIDefineCommand";
import { ControllerModelViewSwitcher } from "../vscommands/switchers/ViewControllerSwitcher";
import { UMLGeneratorCommand } from "../vscommands/umlgenerator/UMLGeneratorCommand";
import { GenerateTypeJSDocCommand } from "../vscommands/generatetypedoc/GenerateTypeJSDocCommand";
import { TSXMLInterfaceGenerator } from "../vscommands/tsinterfacegenerator/implementation/TSXMLInterfaceGenerator";
import { TSODataInterfaceGenerator } from "../vscommands/tsinterfacegenerator/implementation/TSODataInterfaceGenerator";

export class CommandRegistrator {
	static register(metadataLoaded: boolean, projectType: ProjectType) {
		/* Commands */
		if (metadataLoaded) {
			if (projectType === ProjectType.ts) {
				CommandRegistrator._initTS();
			} else {
				CommandRegistrator._initJS();
			}
		} else {
			const clearCacheCommand = vscode.commands.registerCommand(
				"ui5plugin.clearCache",
				ClearCacheCommand.clearCache
			);
			UI5Plugin.getInstance().addDisposable(clearCacheCommand);

			/* Events */
			ClearCacheCommand.subscribeToPropertyChange();
		}

		console.log("Commands registered");
	}

	private static _initTS() {
		const switcherCommand = vscode.commands.registerCommand(
			"ui5plugin.switchBetweenVC",
			ControllerModelViewSwitcher.switchBetweenControllerModelView
		);
		UI5Plugin.getInstance().addDisposable(switcherCommand);

		const insertCustomClassNameCommand = vscode.commands.registerCommand(
			"ui5plugin.insertCustomClassName",
			InsertCustomClassNameCommand.insertCustomClassName
		);
		UI5Plugin.getInstance().addDisposable(insertCustomClassNameCommand);

		const exportToI18NCommand = vscode.commands.registerCommand(
			"ui5plugin.exportToi18n",
			ExportToI18NCommand.export
		);
		UI5Plugin.getInstance().addDisposable(exportToI18NCommand);
		const generateUMLClassDiagramCommand = vscode.commands.registerCommand(
			"ui5plugin.generateUMLClassDiagram",
			UMLGeneratorCommand.generateUMLForCurrentClass
		);
		const generateUMLClassDiagramForWholeProject = vscode.commands.registerCommand(
			"ui5plugin.generateUMLClassDiagramsForWholeProject",
			UMLGeneratorCommand.generateUMLForWholeProject
		);
		const generateERDiagram = vscode.commands.registerCommand(
			"ui5plugin.generateERDiagramFromMetadata",
			GenerateERDiagramCommand.generateERDiagram
		);
		const generateTypeDefDoc = vscode.commands.registerCommand(
			"ui5plugin.generateJSTypeDefDocFromMetadata",
			new GenerateTypeJSDocCommand().execute
		);
		UI5Plugin.getInstance().addDisposable(generateUMLClassDiagramCommand);
		UI5Plugin.getInstance().addDisposable(generateUMLClassDiagramForWholeProject);
		UI5Plugin.getInstance().addDisposable(generateERDiagram);
		UI5Plugin.getInstance().addDisposable(generateTypeDefDoc);
	}

	private static _initJS() {
		const insertUIDefineCommand = vscode.commands.registerCommand(
			"ui5plugin.moveDefineToFunctionParameters",
			SAPUIDefineCommand.insertUIDefine
		);
		const switcherCommand = vscode.commands.registerCommand(
			"ui5plugin.switchBetweenVC",
			ControllerModelViewSwitcher.switchBetweenControllerModelView
		);
		const exportToI18NCommand = vscode.commands.registerCommand(
			"ui5plugin.exportToi18n",
			ExportToI18NCommand.export
		);
		const insertCustomClassNameCommand = vscode.commands.registerCommand(
			"ui5plugin.insertCustomClassName",
			InsertCustomClassNameCommand.insertCustomClassName
		);
		const generateUMLClassDiagramCommand = vscode.commands.registerCommand(
			"ui5plugin.generateUMLClassDiagram",
			UMLGeneratorCommand.generateUMLForCurrentClass
		);
		const generateUMLClassDiagramForWholeProject = vscode.commands.registerCommand(
			"ui5plugin.generateUMLClassDiagramsForWholeProject",
			UMLGeneratorCommand.generateUMLForWholeProject
		);
		const generateERDiagram = vscode.commands.registerCommand(
			"ui5plugin.generateERDiagramFromMetadata",
			GenerateERDiagramCommand.generateERDiagram
		);
		const generateTypeDefDoc = vscode.commands.registerCommand(
			"ui5plugin.generateJSTypeDefDocFromMetadata",
			new GenerateTypeJSDocCommand().execute
		);

		UI5Plugin.getInstance().addDisposable(insertUIDefineCommand);
		UI5Plugin.getInstance().addDisposable(switcherCommand);
		UI5Plugin.getInstance().addDisposable(exportToI18NCommand);
		UI5Plugin.getInstance().addDisposable(insertCustomClassNameCommand);
		UI5Plugin.getInstance().addDisposable(generateUMLClassDiagramCommand);
		UI5Plugin.getInstance().addDisposable(generateUMLClassDiagramForWholeProject);
		UI5Plugin.getInstance().addDisposable(generateERDiagram);
		UI5Plugin.getInstance().addDisposable(generateTypeDefDoc);
	}

	static registerFallbackCommands() {
		const commands = [
			"ui5plugin.moveDefineToFunctionParameters",
			"ui5plugin.switchBetweenVC",
			"ui5plugin.exportToi18n",
			"ui5plugin.insertCustomClassName",
			"ui5plugin.generateUMLClassDiagram",
			"ui5plugin.generateUMLClassDiagramsForWholeProject",
			"ui5plugin.generateERDiagramFromMetadata",
			"ui5plugin.generateTSXMLFileInterfaces",
			"ui5plugin.generateTSODataInterfaces"
		];

		commands.forEach(command => {
			const disposable = vscode.commands.registerCommand(
				command,
				FallbackCommand.notifyUserThatThisIsNotUI5Project
			);
			UI5Plugin.getInstance().addDisposable(disposable);
		});
	}

	static registerUniqueCommands() {
		const generateTSXMLFileInterfacesCommand = vscode.commands.registerCommand(
			"ui5plugin.generateTSXMLFileInterfaces",
			async () => {
				const oTSInterfaceGenerator = new TSXMLInterfaceGenerator();
				const sContent = await oTSInterfaceGenerator.generate();

				const document = await vscode.workspace.openTextDocument({
					content: sContent,
					language: "typescript"
				});
				await vscode.window.showTextDocument(document);
			}
		);
		UI5Plugin.getInstance().addDisposable(generateTSXMLFileInterfacesCommand);

		const generateODataInterfaceCommand = vscode.commands.registerCommand(
			"ui5plugin.generateTSODataInterfaces",
			async () => {
				const oTSInterfaceGenerator = new TSODataInterfaceGenerator();
				const sContent = await oTSInterfaceGenerator.generate();

				const document = await vscode.workspace.openTextDocument({
					content: sContent,
					language: "typescript"
				});
				await vscode.window.showTextDocument(document);
			}
		);
		UI5Plugin.getInstance().addDisposable(generateODataInterfaceCommand);
	}
}
