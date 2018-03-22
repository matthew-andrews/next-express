import * as express from 'express'
import fs = require('fs');
import path = require('path');

const robots = fs.readFileSync(path.join(__dirname, '../../assets/robots.txt'), { encoding: 'utf8' });

export = (request: express.Request, response: express.Response) => {
	response.set({
		'Content-Type': 'text/plain',
		'Cache-Control': 'max-age:3600, public'
	});
	response.send(robots);
};
