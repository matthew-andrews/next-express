import * as http from 'http'
import * as https from 'https';
import * as express from 'express'

export interface NextApplication extends express.Application {
	listen(port: number, hostname: string, backlog: number, callback?: Function): http.Server;
	listen(port: number, hostname: string, callback?: Function): http.Server;
	listen(port: number, callback?: Function): http.Server;
	listen(path: string, callback?: Function): http.Server;
	listen(handle: any, listeningListener?: Function): http.Server;
	listen(port: number, callback: Function): Promise<http.Server | https.Server>
}
