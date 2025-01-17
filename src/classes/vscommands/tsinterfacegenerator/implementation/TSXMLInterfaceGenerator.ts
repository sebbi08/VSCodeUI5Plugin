import { IXMLFile } from "ui5plugin-parser/dist/classes/parsing/util/filereader/IFileReader";
import ParserBearer from "../../../ui5parser/ParserBearer";
import { ITSInterfaceGenerator } from "../abstraction/ITSInterfaceGenerator";

export class TSXMLInterfaceGenerator extends ParserBearer implements ITSInterfaceGenerator {
	async generate() {
		const fileReader = this._parser.fileReader;

		const aXMLFiles: IXMLFile[] = fileReader.getAllFragments().concat(fileReader.getAllViews());
		const mInterfaceData = aXMLFiles.map(XMLFile => this._generateInterfaceDataForFile(XMLFile));
		const aUniqueImports = [...new Set(mInterfaceData.flatMap(theInterface => theInterface.imports))].map(
			toImport => {
				const className = toImport.split("/").pop();
				return `import ${className} from "${toImport}";`;
			}
		);
		const aInterfaces = mInterfaceData.map(interfaceData => {
			const sExtends = [...new Set(interfaceData.extends)].join(" & ");
			return `export type ${interfaceData.name} = {\n\t${interfaceData.rows}\n}${
				sExtends ? " & " + sExtends : ""
			};`;
		});

		return aUniqueImports.join("\n") + "\n\n" + aInterfaces.join("\n\n");
	}
	private _generateInterfaceDataForFile(XMLFile: IXMLFile) {
		const tags = this._parser.xmlParser.getAllTags(XMLFile);
		const mInterfaceData = tags.reduce(
			(
				accumulator: {
					import: string[];
					interfaces: string[];
				},
				tag
			) => {
				const attributes = this._parser.xmlParser.getAttributesOfTheTag(tag);
				const attributeNamesAndValues = attributes?.map(attribute =>
					this._parser.xmlParser.getAttributeNameAndValue(attribute)
				);
				const idAttribute = attributeNamesAndValues?.find(nameValue => nameValue.attributeName === "id");
				if (idAttribute) {
					const className = this._parser.xmlParser.getClassNameFromTag(tag.text);
					const fullClassName = this._parser.xmlParser.getFullClassNameFromTag(tag, XMLFile);

					const idToClass = `${idAttribute.attributeValue}: ${className};`;

					accumulator.import.push(fullClassName.replace(/\./g, "/"));
					accumulator.interfaces.push(idToClass);
				}

				return accumulator;
			},
			{
				import: [],
				interfaces: []
			}
		);

		const isView = XMLFile.fsPath.endsWith(".view.xml");
		const interfaceName = XMLFile.name.split(".").pop() + (isView ? "View" : "Fragment");
		const uniqueImports = [...new Set(mInterfaceData.import)];
		const interfaceRows = mInterfaceData.interfaces.join("\n\t");
		const aExtends = XMLFile.fragments.map(fragment => {
			const isView = fragment.fsPath.endsWith(".view.xml");
			const interfaceName = fragment.name.split(".").pop() + (isView ? "View" : "Fragment");

			return interfaceName;
		});

		return {
			name: interfaceName,
			imports: uniqueImports,
			rows: interfaceRows,
			extends: aExtends
		};
	}
}
