import {HealthCheckStatus} from './health-checks'

let lastCheckOk = true;
let lastCheckOutput = 'All services\' metrics are set up in Next-metrics';
let panicGuide = 'Don\'t panic';
let lastCheckTime: Date | undefined;

export const setAppName = (appName: string) => {
	return {
		getStatus: (): HealthCheckStatus => {
			return {
				name: `All services for ${appName} are registered in Next-metrics`,
				ok: lastCheckOk,
				checkOutput: lastCheckOutput,
				lastUpdated: lastCheckTime,
				panicGuide: panicGuide,
				severity: 3,
				businessImpact: 'We don\'t have any visibility with unregistered services.',
				technicalSummary: 'Set up services\' metrics in next-metrics/lib/metrics/services.js to send to Graphite.'
			};
		}
	};
}

export const updateCheck = (unregisteredServices: object) => {
	lastCheckTime = new Date();

	if (Object.keys(unregisteredServices).length > 0) {
		lastCheckOutput = Object.keys(unregisteredServices).join(', ') + ' services called but no metrics set up.';
		panicGuide = 'See next-metrics/lib/metrics/services.js and set metrics for the service.';
		lastCheckOk = false;
	} else {
		lastCheckOutput = 'All services\' metrics are set up in Next-metrics';
		panicGuide = 'Don\'t panic';
		lastCheckOk = true;
	}
}