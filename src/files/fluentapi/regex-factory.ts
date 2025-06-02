export class RegexFactory {
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('/', '\\/');
	}

	public static fileNameMatcher(name: string): string {
		const escapedName = this.escapeRegex(name);
		return `.*${escapedName}$`;
	}

	public static folderMatcher(folder: string): string {
		const escapedFolder = this.escapeRegex(folder);
		return `(^|.*/)${escapedFolder}/.*`;
	}
}
