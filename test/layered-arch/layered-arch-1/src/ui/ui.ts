// This import is a violation!
import { startDb } from '../db/db';

export function openUi() {
	console.log('Opened UI');
	startDb();
}
