import * as express from 'express';

interface CacheResponse extends express.Response {
	FT_NO_CACHE: string
	FT_NO_CACHE_PRIVATE: string
	FT_SHORT_CACHE: string
	FT_HOUR_CACHE: string
	FT_DAY_CACHE: string
	FT_WEEK_CACHE: string
	FT_LONG_CACHE: string
}

export = (request: express.Request, expressResponse: express.Response, next: express.NextFunction) => {
	const response = expressResponse as CacheResponse;
	response.FT_NO_CACHE = 'max-age=0, no-cache, must-revalidate';
	response.FT_NO_CACHE_PRIVATE = 'max-age=0, no-cache, no-store, must-revalidate, private';
	response.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	response.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	response.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	response.FT_WEEK_CACHE = 'max-age=604800, stale-while-revalidate=60, stale-if-error=259200';
	response.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';

	next();
};
