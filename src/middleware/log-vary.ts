import * as express from 'express'

const nLogger = require('@financial-times/n-logger').default;
const sendRate = 0.05;

interface Log {
	event: string
	path: string
	[key: string]: string
}

export = (request: express.Request, response: express.Response, next: express.NextFunction) => {
	// Throttle sending of events until we know this is the correct implmentation
	if (Math.random() < sendRate) {
		response.on('finish', function () {

			let toLog: Log = {
				event: 'RESPONSE_VARY',
				path: request.path
			};

			const vary = response.get('vary').replace(/ /g, '').split(',');

			if (!vary) {
				return;
			}

			vary.map((header: string) => {
				const requestHeader = request.get(header);
				if (requestHeader != null) {
					toLog[header] = requestHeader
				}
			});

			nLogger.warn(toLog);
		});
	}

	next();
};
