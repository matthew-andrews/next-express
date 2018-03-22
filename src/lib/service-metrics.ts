const metrics = require('next-metrics');
import * as unRegisteredServicesHealthCheck from './unregistered-services-healthCheck';

interface UnregisteredServices {
	[key: string]: boolean
}

let unregisteredServices: UnregisteredServices = {};

export default {
	init: () => {
		unRegisteredServicesHealthCheck.updateCheck(unregisteredServices);

		global.setInterval(() => {
			unRegisteredServicesHealthCheck.updateCheck(unregisteredServices);
			unregisteredServices = {};
		}, 1 * 60 * 1000);

		metrics.fetch.instrument({
			onUninstrumented: function (url?: string) {
				if (typeof url === 'string') {
					unregisteredServices[url.split('?')[0]] = true;
				}
			}
		});
	}
};
