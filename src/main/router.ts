import type { Protocol } from "electron";
import { protocol as electronProtocol, app } from "electron";

import type { RouterOptions, RouteHandler } from "./types.js";

export class Router {
	private options: RouterOptions;
	private initialized = false;
	private routes = new Map<string, RouteHandler>();

	constructor(options: RouterOptions = {}) {
		this.options = { debug: false, httpScheme: "http", ...options };

		this.registerSchemes();

		app.on("will-quit", () => this.log("App quitting"));

		if (app.isReady()) {
			this.registerHandlers();
		} else {
			app.whenReady().then(() => this.registerHandlers());
		}
	}

	private log(...args: unknown[]): void {
		if (this.options.debug) console.log("[router]", ...args);
	}

	/**
	 * Register protocol schemes - MUST be called BEFORE app is ready
	 */
	public registerSchemes(customProtocol?: Protocol): this {
		if (this.initialized) {
			this.log("Schemes already registered");
			return this;
		}

		const scheme = this.options.httpScheme!;
		const proto = customProtocol || electronProtocol;

		this.log("Registering protocol scheme:", scheme);

		proto.registerSchemesAsPrivileged([
			{
				scheme,
				privileges: {
					standard: true,
					secure: true,
					supportFetchAPI: true,
					corsEnabled: true,
					stream: true,
				},
			},
		]);

		this.initialized = true;
		return this;
	}

	/**
	 * Register protocol handlers - MUST be called AFTER app is ready
	 */
	public registerHandlers(customProtocol?: Protocol): this {
		const scheme = this.options.httpScheme!;
		const proto = customProtocol || electronProtocol;

		this.log("Registering protocol handler for:", scheme);

		proto.handle(scheme, (request: Request) => {
			const url = new URL(request.url);
			const key = `${request.method}:${url.pathname}`;

			this.log(`${request.method} ${url.pathname}`);

			if (this.routes.has(key)) {
				try {
					return this.routes.get(key)!(request);
				} catch (error) {
					this.log("Route error:", error);
					return new Response(`Server Error: ${(error as Error).message}`, {
						status: 500,
					});
				}
			}

			for (const [routeKey, handler] of this.routes) {
				const [method, pattern] = routeKey.split(":");
				if (request.method !== method) continue;

				const regex = new RegExp("^" + pattern.replace(/:\w+/g, "([^/]+)") + "$");
				const match = url.pathname.match(regex);
				if (match) {
					try {
						return handler(request);
					} catch (error) {
						this.log("Route error:", error);
						return new Response(`Server Error: ${(error as Error).message}`, {
							status: 500,
						});
					}
				}
			}

			return new Response("Not Found", { status: 404 });
		});

		return this;
	}

	/**
	 * Register a route. Supports :params in path (e.g. "/toggle/:id").
	 */
	public registerRoute(path: string, handler: RouteHandler, method = "GET"): this {
		const routeKey = `${method.toUpperCase()}:${path}`;
		this.routes.set(routeKey, handler);
		this.log(`Registered route: ${routeKey}`);
		return this;
	}
}

export function createRouter(options: RouterOptions = {}) {
	return new Router(options);
}
