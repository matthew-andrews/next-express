import * as express from 'express';

import {
	Settings,
	Meta,
	NextApplication,
	SentryResponse
} from '../types';

const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const denodeify = require('denodeify');

import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';

export = (app: express.Application, meta: Meta, initPromises: Array<Promise<any>>): NextApplication => {
	const actualAppListen = function (app: express.Application, ...args: any[]) {
		let serverPromise: Promise<https.Server | http.Server>;
		if (process.argv.indexOf('--https') > -1) {
			const readFile = denodeify(fs.readFile);
			serverPromise = Promise.all([
				readFile(path.resolve(__dirname, '../../key.pem')),
				readFile(path.resolve(__dirname, '../../cert.pem'))
			]).then(([key, cert]) => https.createServer({
				key,
				cert
			}, app));
		} else {
			serverPromise = Promise.resolve(http.createServer(app));
		}

		return serverPromise.then((server: http.Server | https.Server) =>
			server.listen(...args)
		);
	};

	const nextApp = app as NextApplication;

	// @ts-ignore
	nextApp.listen = (port: number, callback: Function) : Promise<http.Server | https.Server> => {
		// The error handler must be before any other error middleware
		app.use(raven.errorHandler());

		// Optional fallthrough error handler
		app.use((error: Error, request: express.Request, expressResponse: express.Response, next: express.NextFunction) => {
			const response = expressResponse as SentryResponse;
			// The error id is attached to `res.sentry` to be returned
			// and optionally displayed to the user for support.
			response.statusCode = 500;
			response.end(response.sentry + '\n');
		});

		const loggerCallbackWrapper = () => {
			// HACK: Use warn so that it gets into Splunk logs
			nLogger.warn({
				event: 'EXPRESS_START',
				app: meta.name,
				port: port,
				nodeVersion: process.version
			});

			return callback && callback(...arguments);
		};

		return Promise.all(initPromises)
			.then(() => {
				metrics.count('express.start');
				return actualAppListen(app, port, loggerCallbackWrapper);
			})
	}

	return nextApp;
};
