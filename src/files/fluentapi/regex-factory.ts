export class RegexFactory {
	private static escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	public static fileNameMatcher(name: string): string {
		const escapedName = this.escapeRegex(name);
		return `.*${escapedName}\\.(ts|js)$`;
	}

	public static folderMatcher(folder: string): string {
		const escapedFolder = this.escapeRegex(folder);
		return `.*/${escapedFolder}/.*`;
	}
}
// WATCH-INP
