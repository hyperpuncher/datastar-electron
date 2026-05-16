import { Router } from "./main/router.ts";

export { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";

export { Router };
export type { RouterOptions, RouteHandler } from "./main/types.ts";

export function createRouter(options = {}) {
	return new Router(options);
}

export default {
	Router,
	createRouter,
};
