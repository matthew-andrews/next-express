import * as express from 'express';

interface VaryResponse extends express.Response {
	set(name: string | object, value?: string): VaryResponse
	unvary(...args: Array<string>): VaryResponse
	unvaryAll(preset?: string): VaryResponse
	unVary(...args: Array<string>): VaryResponse
	unVaryAll(preset?: string): VaryResponse
}

const extendVary = (value: Array<string> | string, set: Set<string>): string => {
	const array = Array.isArray(value)
		? value
		: value.split(',');

	array.forEach((header: string) => {
		set.add(header.trim().toLowerCase());
	});

	return Array.from(set).join(', ');
};

interface Settings {
	[key: string]: string
}

export = (request: express.Request, expressResponse: express.Response, next: express.NextFunction) => {
	const response = expressResponse as VaryResponse;

	const responseSet = response.set;
	const varyOn: Set<string> = new Set([]);

	response.set('vary', Array.from(varyOn).join(', '));

	response.vary = (name: string) => response.set('vary', name);

	response.set = function (name: string | Settings, value?: string): VaryResponse {
		if (arguments.length === 2 && typeof name === 'string' && value != null) {
			if (name.toLowerCase() === 'vary') {
				value = extendVary(value, varyOn);
			}
			return responseSet.call(response, name, value);
		}

		if (typeof name === 'object') {
			Object.keys(name).forEach((key: string) => {
				if (key.toLowerCase() === 'vary') {
					name[key] === extendVary(name[key], varyOn);
				}
			});
			return responseSet.call(response, name);
		}

		return responseSet.call(response, name, value);
	};

	response.unvary = function (...args: Array<string>): VaryResponse {
		args.forEach((name: string) => varyOn.delete(name.toLowerCase()));

		const list = Array.from(varyOn);

		if (list.length) {
			response.set('vary', list.join(', '));
		} else {
			response.removeHeader('vary');
		}

		return response
	};

	response.unvaryAll = function (preset?: string): VaryResponse {
		if (preset === 'wrapper') {
			// TODO need to port this to n-ui ,and rename as n-ui.
			// Not sure if it's ever used
			response.unvary('ft-anonymous-user', 'ft-edition');
		} else {
			varyOn.clear();
			response.removeHeader('vary');
		}

		return response
	};

	// backwards compatible uber-camel-cased names
	response.unVary = response.unvary;
	response.unVaryAll = response.unvaryAll;

	next();
};
