import {
	Settings,
	Meta
} from '../types'

import normalizeName = require('./normalize-name');

interface PackageJson {
	name: string
	description: string
}

export = (options: Settings): Meta => {
	let name = options.name;
	let description = '';
	let directory = options.directory || process.cwd();

	if (!name) {
		try {
			const packageJson: PackageJson = require(directory + '/package.json');
			name = packageJson.name;
			description = packageJson.description || '';
		} catch(e) {
			// Safely ignorable error
		}
	}

	if (!name) {
		throw new Error('Please specify an application name');
	}

	name = name && normalizeName(name);

	return {
		name,
		description,
		directory
	};
};
