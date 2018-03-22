import * as express from 'express';

export = (request: express.Request, response: express.Response, next: express.NextFunction) => {
	response.set('X-Content-Type-Options', 'nosniff');
	response.set('X-Download-Options', 'noopen');
	response.set('X-XSS-Protection', '1; mode=block');
	next();
};
