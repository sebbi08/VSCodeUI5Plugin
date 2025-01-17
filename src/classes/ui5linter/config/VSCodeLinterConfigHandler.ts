import { ILinterConfigHandler, PackageLinterConfigHandler, Severity } from "ui5plugin-linter";
import { JSLinters, PropertiesLinters, XMLLinters } from "ui5plugin-linter/dist/classes/Linter";
import { JSLinterException } from "ui5plugin-linter/dist/classes/config/ILinterConfigHandler";
import { TextDocument } from "ui5plugin-parser";
import { IUI5Parser } from "ui5plugin-parser/dist/parser/abstraction/IUI5Parser";
import ParserBearer from "../../ui5parser/ParserBearer";

export class VSCodeLinterConfigHandler extends ParserBearer implements ILinterConfigHandler {
	private readonly _packageLinterConfigHandler: PackageLinterConfigHandler;
	constructor(parser: IUI5Parser) {
		super(parser);
		this._packageLinterConfigHandler = new PackageLinterConfigHandler(
			this._parser,
			parser.configHandler.packagePath
		);
	}

	getJSLinterExceptions(): JSLinterException[] {
		return this._packageLinterConfigHandler.getJSLinterExceptions();
	}
	getSeverity(linter: JSLinters | XMLLinters | PropertiesLinters): Severity {
		return this._packageLinterConfigHandler.getSeverity(linter);
	}
	checkIfMemberIsException(className: string, memberName: string): boolean {
		return this._packageLinterConfigHandler.checkIfMemberIsException(className, memberName);
	}
	getLinterUsage(linter: JSLinters | XMLLinters | PropertiesLinters): boolean {
		return this._packageLinterConfigHandler.getLinterUsage(linter);
	}
	getIfLintingShouldBeSkipped(document: TextDocument): boolean {
		return this._packageLinterConfigHandler.getIfLintingShouldBeSkipped(document);
	}
}
