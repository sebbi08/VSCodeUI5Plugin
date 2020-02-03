import * as vscode from "vscode";
import { FileReader } from "./classes/Util/FileReader";
import { CommandRegistrator } from "./classes/Util/CommandRegistrator";
import { CompletionItemRegistrator } from "./classes/Util/CompletionItemRegistrator";
import { DefinitionProviderRegistrator } from "./classes/Util/DefinitionProviderRegistrator";
import { SignatureHelpRegistrator } from "./classes/Util/SignatureHelpRegistrator";
import { FileWatcher } from "./classes/Util/FileWatcher";

export async function activate(context: vscode.ExtensionContext) {
	FileReader.globalStoragePath = context.globalStoragePath;
	const manifests = FileReader.getAllManifests();

	if (manifests.length > 0) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Loading Libs",
			cancellable: false
		}, (progress) => {

			progress.report({ increment: 0 });

			return new Promise(async resolve => {
				try {
					await CompletionItemRegistrator.register(context, progress);

					FileWatcher.register();

					CommandRegistrator.register(context);

					DefinitionProviderRegistrator.register(context);

					SignatureHelpRegistrator.register(context);

					resolve();
				} catch (error) {
					console.log(error);
				}
			});
		});
	}
}
