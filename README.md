# datastar-electron

Datastar + Electron. No IPC, no server, just HTTP.

Inspired by [ssr-electron](https://github.com/StreamUI/ssr-electron) by Jordan Howlett.

## How it works

Electron intercepts `http://` requests from the renderer. Your handler returns a Response. That's it.

```
data-on:click="@post('/increment')"    ← Datastar in browser
         ↓
fetch('http://localhost/increment')    ← Electron intercepts (no network)
         ↓
your handler(request)                  ← Your code
         ↓
DS.stream(...) → Response              ← Official SDK formats SSE
         ↓
Datastar patches signals into DOM      ← Browser updates reactively
```

## Install

```bash
npm i datastar-electron
pnpm i datastar-electron
bun i datastar-electron
```

## Quick start

```typescript
import { app, BrowserWindow } from "electron";
import { createRouter, ServerSentEventGenerator as DS } from "datastar-electron";

const router = createRouter({ debug: true });

app.whenReady().then(() => {
	// Serve HTML
	router.registerRoute("/", () => {
		return new Response(
			`<!DOCTYPE html>
<html>
<body data-signals="{count: 0}">
	<h1>Count: <span data-text="$count">0</span></h1>
	<button data-on:click="@post('/increment')" data-indicator="loading">
		<span data-show="$loading">Loading...</span>
		Increment
	</button>
	<script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.1/bundles/datastar.js"></script>
</body>
</html>`,
			{ headers: { "Content-Type": "text/html" } },
		);
	});

	// Handle clicks with SSE
	let count = 0;
	router.registerRoute(
		"/increment",
		() =>
			DS.stream(async (stream) => {
				stream.patchSignals(JSON.stringify({ count: ++count }));
			}),
		"POST",
	);

	const win = new BrowserWindow({ width: 800, height: 600 });
	win.loadURL("http://localhost/");
});
```

## API

### `createRouter(options?)`

Creates the protocol handler. Auto-registers on app ready.

```typescript
const router = createRouter({ debug: true });
```

### `router.registerRoute(path, handler, method?)`

Register a route. Supports `:params`.

```typescript
router.registerRoute("/api/data", (req) => new Response(JSON.stringify({ ok: true })));

// With params
router.registerRoute(
	"/toggle/:id",
	(req) => {
		const id = new URL(req.url).pathname.split("/").pop();
		// ...
	},
	"POST",
);
```

### `DS.stream(callback, options?)`

Returns an SSE Response. From the official Datastar SDK.

```typescript
import { ServerSentEventGenerator as DS } from "datastar-electron";

// One-shot (auto-closes)
return DS.stream(async (stream) => {
	stream.patchSignals('{"count": 42}');
	stream.patchElements("<div>Updated</div>", { selector: "#msg" });
});

// Long-lived (stays open)
return DS.stream(
	async (stream) => {
		while (true) {
			stream.patchSignals(
				JSON.stringify({ time: new Date().toLocaleTimeString() }),
			);
			await new Promise((r) => setTimeout(r, 1000));
		}
	},
	{ keepalive: true },
);
```

## License

MIT
