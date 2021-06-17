import * as vscode from "vscode";
export abstract class DiagramGenerator {
	abstract generateUMLClassDiagrams(wsFolder: vscode.WorkspaceFolder): Promise<string>;
	abstract getFileExtension(): string;
}