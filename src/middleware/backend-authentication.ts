import * as express from 'express';
import {
	NextApplication
} from '../types';

const nLogger = require('@financial-times/n-logger').default;
const metrics = require('next-metrics');

export = (app: NextApplication, appName: string) => {
	const backendKeys: Array<string> = [];

	const nextBackendKey = process.env.FT_NEXT_BACKEND_KEY;
	nextBackendKey && backendKeys.push(nextBackendKey);

	const oldBackendKey = process.env.FT_NEXT_BACKEND_KEY_OLD;
	oldBackendKey && backendKeys.push(oldBackendKey);

	if (!backendKeys.length) {
		nLogger.warn({
			event: 'BACKEND_AUTHENTICATION_DISABLED',
			message: 'Backend authentication is disabled, this app is exposed directly to the internet. To enable, add keys in config-vars'
		});

		return;
	}

	app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
		// TODO - change how all this works in order to use __assets/app/{appname}
		// allow static assets, healthchecks, etc., through
		const nextBackendKey = request.get('FT-Next-Backend-Key');
		const oldBackendKey = request.get('FT-Next-Backend-Key-Old');

		if (request.path.startsWith('/' + appName) || request.path.startsWith('/__')) {
			return next();
		}

		if (nextBackendKey && backendKeys.includes(nextBackendKey)) {
			metrics.count('express.backend_authentication.backend_key');
			response.set('FT-Backend-Authentication', 'true');
			return next();
		}

		if (oldBackendKey && backendKeys.includes(oldBackendKey)) {
			metrics.count('express.backend_authentication.old_backend_key');
			response.set('FT-Backend-Authentication', 'true');
			return next();
		}

		metrics.count('express.backend_authentication.fail');

		response.set('FT-Backend-Authentication', 'false');

		/* istanbul ignore else */
		if (process.env.NODE_ENV === 'production') {
			// NOTE - setting the status text is very important as it's used by the CDN
			// to trigger stale-if-error if we mess up the key synchronisation again
			response.status(401).send('Invalid Backend Key');
		} else {
			next();
		}
	});
};
