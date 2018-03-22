import * as express from 'express';
import errorRateCheck = require('./error-rate-check');
import * as unRegisteredServicesHealthCheck from './unregistered-services-healthCheck';
import {Settings, Meta} from '../settings';
import {NextApplication} from '../next-application';

export interface HealthCheckStatus {
	severity: number
	ok: boolean
	name: string
	checkOutput: string
	lastUpdated?: Date
	panicGuide: string
	businessImpact: string
	technicalSummary: string
}

export interface HealthCheck {
	getStatus(): HealthCheckStatus
}

export default (app: NextApplication, options: Settings, meta: Meta) => {
	const defaultAppName =
		`Next FT.com ${meta.name} in ${process.env.REGION || 'unknown region'}`;

	const defaultChecks = [
		errorRateCheck(meta.name, options.errorRateHealthcheck),
		unRegisteredServicesHealthCheck.setAppName(meta.name)
	];

	const healthChecks = options.healthChecks
		? options.healthChecks.concat(defaultChecks)
		: defaultChecks;

	app.get(/\/__health(?:\.([123]))?$/, (req, res) => {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(check => check.getStatus());

		if (req.params[0]) {
			checks.forEach(check => {
				if (check.severity <= Number(req.params[0]) && check.ok === false) {
					res.status(500);
				}
			});
		}

		res.set('Content-Type', 'application/json');

		res.send(JSON.stringify({
			schemaVersion: 1,
			name: options.healthChecksAppName || defaultAppName,
			systemCode: options.systemCode,
			description: meta.description,
			checks: checks
		}, undefined, 2));
	});
};
