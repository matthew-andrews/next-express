import * as express from 'express'

interface AnonymousModel {
	userIsLoggedIn: boolean,
	userIsAnonymous: boolean
}

function createAnonymousModel (request: express.Request, response: express.Response): AnonymousModel {
	if (request.get('FT-Anonymous-User') === 'true') {
		return {
			userIsLoggedIn: false,
			userIsAnonymous: true
		}
	}

	return {
		userIsLoggedIn: true,
		userIsAnonymous: false
	}
}

interface FirstClickFreeModel {
	signInLink?: string
}

function showFirstClickFree (request: express.Request, response: express.Response) {
	return response.locals.flags.firstClickFree &&
		request.get('FT-Access-Decision') === 'GRANTED' &&
		request.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY';
}

function createFirstClickFreeModel (request: express.Request, response: express.Response): FirstClickFreeModel {
	if (showFirstClickFree(request, response)) {
		return {
			signInLink: '/login'
		}
	}

	return {}
}

function anonymousMiddleware (request: express.Request, response: express.Response, next: express.NextFunction) {
	response.locals.anon = createAnonymousModel(request, response);
	response.locals.firstClickFreeModel = createFirstClickFreeModel(request, response);

	response.vary('FT-Anonymous-User');

	next();
}

export = {
	middleware : anonymousMiddleware
};
