/**
 * Route handler function type.
 */
export type RouteHandler = (request: Request) => Response | Promise<Response>;

/**
 * Options for Router constructor.
 */
export interface RouterOptions {
	/** Enable debug logging */
	debug?: boolean;
	/** HTTP scheme to use (default: 'http') */
	httpScheme?: string;
}
