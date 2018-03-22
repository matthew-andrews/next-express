import * as http from 'http'
import * as https from 'https'
import * as express from 'express'

export interface ErrorRateCheckOptions {
	severity?: number
	samplePeriod?: string
	threshold?: number
}

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

export interface Settings {
	demo?: boolean
	withBackendAuthentication?: boolean
	withFlags?: boolean
	withServiceMetrics?: boolean
	// TODO find out the type of health checks
	healthChecks?: Array<HealthCheck>
	healthChecksAppName?: string
	systemCode: string
	logVary?: boolean
	withAnonMiddleware?: boolean
	errorRateHealthcheck?: HealthCheckStatus
	name: string
	directory: string
}

export interface Meta {
	name: string
	description: string
	directory: string
}

export interface SentryResponse extends express.Response {
	sentry: string
}

export interface NextApplication extends express.Application {
	listen(port: number, hostname: string, backlog: number, callback?: Function): http.Server
	listen(port: number, hostname: string, callback?: Function): http.Server
	listen(port: number, callback?: Function): http.Server
	listen(path: string, callback?: Function): http.Server
	listen(handle: any, listeningListener?: Function): http.Server
	listen(port: number, callback: Function): Promise<http.Server | https.Server>
}
