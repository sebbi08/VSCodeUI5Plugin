import { SAPNode } from "../../StandardLibMetadata/SAPNode";

export interface IPropertyGenerator {
	generateProperties(node: SAPNode) : string;
}