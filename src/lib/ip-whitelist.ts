const logger = require('@financial-times/n-logger').default;
const metrics = require('next-metrics');
const fetchres = require('fetchres');
import * as ip from 'ip';

const backupFastlyWhitelist = require('../../data/fastly-ip-whitelist-backup.json').addresses;
const ftWhitelist = require('../../data/ft-ip-whitelist.json');

const fastlyWhitelistUrl = 'https://api.fastly.com/public-ip-list';

interface FastlyResponse extends Response {
	addresses: Array<string>
}

const isEqual = (a: Array<string>, b: Array<string>) =>
	JSON.stringify(a) === JSON.stringify(b)

const responseIsValid = (response: FastlyResponse) =>
	Boolean(Array.isArray(response.addresses) && response.addresses.length)

export = class IpWhitelist {
	fetchedFastlyWhitelist: Array<string>;

	constructor () {
		this.fetchedFastlyWhitelist = [];
		this.poll();

		// every 10 seconds
		setInterval(() => this.poll(), 10000);
	}

	poll (): Promise<void> {
		return fetch(fastlyWhitelistUrl)
			.then(response => fetchres.json(response))
			.then((response: FastlyResponse): void => {
				if (responseIsValid(response)) {
					metrics.count('express.ip_whitelist.fetch_success');

					if (isEqual(this.fetchedFastlyWhitelist, response.addresses)) {
						return;
					}

					logger.info({
						event: 'IP_WHITELIST_UPDATE',
						oldSize: Array.isArray(this.fetchedFastlyWhitelist)
							? this.fetchedFastlyWhitelist.length
							: 0,
						newSize: response.addresses.length
					});

					metrics.count('express.ip_whitelist.update');

					this.fetchedFastlyWhitelist = response.addresses;

					return;
				}

				logger.error({
					event: 'IP_WHITELIST_UNRECOGNISED',
					response: JSON.stringify(response)
				});

				metrics.count('express.ip_whitelist.unrecognised');
			})
			.catch((error: Error) => {
				logger.error({
					event: 'IP_WHITELIST_FETCH_FAIL'
				}, error);
				metrics.count('express.ip_whitelist.fetch_fail');
			});
	}

	validate (ipAddress: string): boolean {
		if (ipAddress.match(/^::ffff:/)) {
			ipAddress = ipAddress.replace(/^::ffff:/, '');
		}

		const list = this.fetchedFastlyWhitelist.length
			? this.fetchedFastlyWhitelist
			: backupFastlyWhitelist

		const ranges = [...list, ...ftWhitelist];

		return !!ranges.find((range: string) =>
			ip.cidrSubnet(range).contains(ipAddress)
		);
	};
}
