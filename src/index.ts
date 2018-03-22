require('isomorphic-fetch');

import fs = require('fs');
import path = require('path');
import * as express from 'express';
const flags = require('@financial-times/n-flags-client');
import backendAuthentication = require('./middleware/backend-authentication');

// Logging and monitoring
const metrics = require('next-metrics');
import serviceMetrics from './lib/service-metrics';
const raven = require('@financial-times/n-raven');

// utils
import healthChecks = require('./lib/health-checks');
import instrumentListen = require('./lib/instrument-listen');
import guessAppDetails = require('./lib/guess-app-details');

import cache = require('./middleware/cache');
import robots = require('./middleware/robots');
import security = require('./middleware/security');
import vary = require('./middleware/vary');
import logVary = require('./middleware/log-vary');
import anon = require('./middleware/anon');

import {
  NextApplication,
  Settings
} from './types';

const teapot = fs.readFileSync(path.join(__dirname, '../assets/teapot.ascii'), 'utf8');

const defaults = {
	withBackendAuthentication: true,
	withFlags: false,
	withServiceMetrics: true,
	healthChecks: []
}

const getAppContainer = (options: Settings) => {
	const settings = Object.assign({}, defaults, options || {});

	if (!settings.systemCode) {
		throw new Error('All applications must specify a CMDB `systemCode` to the express() function. See the README for more details.');
	}

	const meta = guessAppDetails(settings);

	const initPromises: Array<Promise<any>> = [];

	const app = instrumentListen(express(), meta, initPromises);
	const addInitPromise = initPromises.push.bind(initPromises);

  app.listen

	// must be the first middleware
	app.use(raven.requestHandler());

	app.get('/robots.txt', robots);

	/*istanbul ignore next */
	app.get('/__brew-coffee', (request: express.Request, response: express.Response) => {
		response.status(418);
		response.send(teapot);
		response.end();
		request
	});

	// Security related headers, see https://securityheaders.io/?q=https%3A%2F%2Fwww.ft.com&hide=on.
	app.set('x-powered-by', false);
	app.use(security);

	// utility middleware
	app.use(vary);

	if (!settings.demo) {
		healthChecks(app, settings, meta);
	}

	// Debug related headers.
	app.use((request: express.Request, response: express.Response, next: Function) => {
		response.set('FT-App-Name', meta.name);
		response.set('FT-Backend-Timestamp', new Date().toISOString());
		next();
	});

	// metrics should be one of the first things as needs to be applied before any other middleware executes
	metrics.init({
		app: process.env.FT_APP_VARIANT
			? `${meta.name}_${process.env.FT_APP_VARIANT}`
			: meta.name,
		flushEvery: 40000
	});

	app.use((request: express.Request, response: express.Response, next: Function) => {
		metrics.instrument(request, { as: 'express.http.req' });
		metrics.instrument(response, { as: 'express.http.res' });
		next();
	});

	if (settings.withServiceMetrics) {
		serviceMetrics.init();
	}

	app.get('/__about', (request: express.Request, response: express.Response) => {
		response.set({
			'Cache-Control': 'no-cache'
		});
		response.sendFile(meta.directory + '/public/__about.json');
	});

	if (settings.withBackendAuthentication) {
		backendAuthentication(app, meta.name);
	}

	// feature flags
	if (settings.withFlags) {
		addInitPromise(flags.init());
		app.use(flags.middleware);
	}

	// cache-control constants
	app.use(cache);

	if (settings.logVary) {
		app.use(logVary);
	}

	if (settings.withAnonMiddleware) {
		app.use(anon.middleware);
	}

	return {
		app,
		meta,
		addInitPromise
	};
};

module.exports = (options: Settings) => getAppContainer(options).app;

module.exports.Router = express.Router;
module.exports.static = express.static;
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.getAppContainer = getAppContainer;
