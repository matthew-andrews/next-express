
function AnonymousModel (req) {
	if (req.get('FT-Anonymous-User') === 'true') {
		this.userIsLoggedIn = false;
		this.userIsAnonymous = true;
	} else {
		this.userIsLoggedIn = true;
		this.userIsAnonymous = false;
	}
}

function FirstClickFreeModel () {
	this.signInLink = '/login';
}

const anonModels = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};

function showFirstClickFree (req, res) {
	return res.locals.flags.firstClickFree &&
			req.get('FT-Access-Decision') === 'GRANTED' &&
			req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY';
}

function anonymousMiddleware (req, res, next) {
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		showFirstClickFree(req, res) ?
			new anonModels.FirstClickFreeModel() :
			null;

	res.vary('FT-Anonymous-User');
	next();
}

module.exports = {
	middleware : anonymousMiddleware
};
