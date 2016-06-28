'use strict';
const anonModels = require('./models');
const NavigationModel = require('../navigation/navigationModel');
const fetchres = require('fetchres');

function showFirstClickFree(req, res){
	return res.locals.flags && res.locals.flags.firstClickFree &&
			req.get('FT-Access-Decision') === 'GRANTED' &&
			req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY';
}

function anonymousMiddleware(req, res, next){
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		showFirstClickFree(req, res) ?
			new anonModels.FirstClickFreeModel() :
			null;
	const currentUrl = req.get('ft-blocked-url')
		|| req.get('FT-Vanity-Url')
		|| req.url;
	res.locals.navigationModel = new NavigationModel(res.locals.flags, res.locals.anon.userIsAnonymous, currentUrl);
	res.vary('FT-Anonymous-User');

	if (res.locals.flags.brexitDiscount && res.locals.flags.brexitDiscountType) {
		getBrexitDiscountData(req).then(function (response) {
			res.brexitOfferBasePrice = response.viewData.subscriptionOptions.STANDARD.price.weekly;
			next();
		});
	}
	else {
		next();
	}
}

function getBrexitDiscountData (req) {

	const headers = {
		'Content-Classification': req.query['ft-content-classification'] || req.get('FT-Content-Classification') || 'CONDITIONAL_STANDARD',
		'Country-Code': req.query['country-code'] || req.get('country-code') || 'GBR',
	};

	if (headers['Content-Classification'] === '-') {
		headers['Content-Classification'] = 'CONDITIONAL_STANDARD';
	}

	console.log(headers);
	return fetch('https://barrier-app.memb.ft.com/memb/barrier/v1/barrier-data', { headers: headers, timeout: 2000 })
		.then((res) => fetchres.json(res))
}

module.exports = anonymousMiddleware;
