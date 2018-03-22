import * as healthChecks from './lib/health-checks'

export interface Settings {
	demo?: boolean
	withBackendAuthentication?: boolean
	withFlags?: boolean
	withServiceMetrics?: boolean
	// TODO find out the type of health checks
	healthChecks?: Array<healthChecks.HealthCheck>
	healthChecksAppName?: string
	systemCode: string
	logVary?: boolean
	withAnonMiddleware?: boolean
	errorRateHealthcheck?: healthChecks.HealthCheckStatus
	name: string
	directory: string
}

export interface Meta {
	name: string
	description: string
	directory: string
}
