import * as fs from 'fs';
import * as path from 'path';

/**
 * Parses .archignore file and converts patterns to glob format
 * Similar to .gitignore syntax
 */
export class ArchIgnoreParser {
	private patterns: string[] = [];
	private negationPatterns: string[] = [];

	/**
	 * Read and parse .archignore file
	 * @param filePath - Path to .archignore file
	 * @returns ArchIgnoreParser instance for chaining
	 */
	public static fromFile(filePath: string): ArchIgnoreParser {
		const parser = new ArchIgnoreParser();
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, 'utf-8');
			parser.parse(content);
		}
		return parser;
	}

	/**
	 * Parse archignore content from string
	 * @param content - Raw .archignore file content
	 */
	private parse(content: string): void {
		const lines = content.split('\n');

		for (const line of lines) {
			const trimmed = line.trim();

			// Skip empty lines and comments
			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}

			// Handle negation patterns (! prefix)
			if (trimmed.startsWith('!')) {
				this.negationPatterns.push(this.normalizePattern(trimmed.substring(1)));
			} else {
				this.patterns.push(this.normalizePattern(trimmed));
			}
		}
	}

	/**
	 * Convert .gitignore-style pattern to glob pattern
	 * Examples:
	 *   "node_modules/" -> "node_modules/**"
	 *   "*.test.ts" -> "**\/*.test.ts" (if not already prefixed)
	 *   "src/generated/**" -> "src/generated/**"
	 */
	private normalizePattern(pattern: string): string {
		let normalized = pattern;

		// Remove trailing slashes
		if (normalized.endsWith('/')) {
			normalized = normalized.slice(0, -1) + '/**';
		}

		// If pattern doesn't start with *, add ** prefix for directory matching
		if (!normalized.startsWith('*') && !normalized.startsWith('/')) {
			normalized = `**/${normalized}`;
		}

		// Handle Windows paths
		normalized = normalized.replace(/\\/g, '/');

		return normalized;
	}

	/**
	 * Get all patterns that should be ignored
	 */
	public getPatterns(): string[] {
		return this.patterns;
	}

	/**
	 * Get all negation patterns (exceptions to ignore rules)
	 */
	public getNegationPatterns(): string[] {
		return this.negationPatterns;
	}

	/**
	 * Check if a file should be ignored
	 * @param filePath - File path to check
	 * @returns true if file should be ignored
	 */
	public shouldIgnore(filePath: string): boolean {
		const normalizedPath = filePath.replace(/\\/g, '/');

		// First check if path matches any negation pattern (exceptions)
		for (const negPattern of this.negationPatterns) {
			if (this.matchesPattern(normalizedPath, negPattern)) {
				return false; // Exception - don't ignore
			}
		}

		// Then check if path matches any ignore pattern
		for (const pattern of this.patterns) {
			if (this.matchesPattern(normalizedPath, pattern)) {
				return true; // Should be ignored
			}
		}

		return false;
	}

	/**
	 * Simple glob pattern matching
	 * Supports: *, **, ?
	 */
	private matchesPattern(filePath: string, pattern: string): boolean {
		const parts = pattern.split('/');
		const pathParts = filePath.split('/');

		return this.matchPatternParts(pathParts, parts, 0, 0);
	}

	private matchPatternParts(
		pathParts: string[],
		patternParts: string[],
		pathIndex: number,
		patternIndex: number
	): boolean {
		// Both exhausted - match
		if (pathIndex === pathParts.length && patternIndex === patternParts.length) {
			return true;
		}

		// Pattern exhausted but path remains - no match
		if (patternIndex === patternParts.length) {
			return false;
		}

		const patternPart = patternParts[patternIndex];

		// Handle ** (matches any number of directories)
		if (patternPart === '**') {
			// Try matching rest of pattern at current position or further
			for (let i = pathIndex; i <= pathParts.length; i++) {
				if (
					this.matchPatternParts(pathParts, patternParts, i, patternIndex + 1)
				) {
					return true;
				}
			}
			return false;
		}

		// Path exhausted but pattern remains
		if (pathIndex === pathParts.length) {
			return false;
		}

		const pathPart = pathParts[pathIndex];

		// Match single part with wildcards
		if (this.matchGlobPart(pathPart, patternPart)) {
			return this.matchPatternParts(pathParts, patternParts, pathIndex + 1, patternIndex + 1);
		}

		return false;
	}

	private matchGlobPart(str: string, pattern: string): boolean {
		if (pattern === '*') {
			return true;
		}

		let strIndex = 0;
		let patternIndex = 0;

		while (patternIndex < pattern.length && strIndex < str.length) {
			if (pattern[patternIndex] === '*') {
				// Match zero or more characters
				if (patternIndex === pattern.length - 1) {
					return true; // * at end matches everything
				}
				const nextChar = pattern[patternIndex + 1];
				while (strIndex < str.length && str[strIndex] !== nextChar) {
					strIndex++;
				}
				patternIndex++;
			} else if (pattern[patternIndex] === '?') {
				// Match exactly one character
				strIndex++;
				patternIndex++;
			} else if (pattern[patternIndex] === str[strIndex]) {
				strIndex++;
				patternIndex++;
			} else {
				return false;
			}
		}

		return strIndex === str.length && patternIndex === pattern.length;
	}
}
