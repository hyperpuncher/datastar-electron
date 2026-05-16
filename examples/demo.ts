import { createRouter, ServerSentEventGenerator as DS } from "datastar-electron";
import { app, BrowserWindow } from "electron";

const router = createRouter({ debug: true });

let count = 0;
let serverTime = new Date().toLocaleTimeString();

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 900,
		title: "Datastar Electron Demo",
		webPreferences: { nodeIntegration: false, contextIsolation: true },
	});
	win.loadURL("http://localhost/");
	return win;
}

app.whenReady().then(() => {
	router.registerRoute("/", () => {
		return new Response(
			`<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="UTF-8" />
						<meta
							name="viewport"
							content="width=device-width, initial-scale=1.0"
						/>
						<title>Datastar Electron Demo</title>
						<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
						<link
							rel="stylesheet"
							href="https://unpkg.com/boltcss/bolt.min.css"
						/>
						<script
							type="module"
							src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.1/bundles/datastar.js"
						></script>
					</head>

					<body
						class="flex min-h-screen flex-col items-center justify-center bg-neutral-100 p-6"
						data-signals="{name: 'World', inputValue: '', agreed: false, count: 0}"
						data-init="@get('/updates')"
					>
						<div class="mx-auto max-w-4xl space-y-6">
							<div class="text-center">
								<h2>Datastar Electron</h2>
								<p class="mt-2 text-neutral-500">
									No IPC. Just HTTP + SSE.
								</p>
							</div>

							<div class="flex flex-col gap-12">
								<!-- 1. Signals & Reactive Text -->
								<div>
									<h4>1. Signals & data-text</h4>
									<p>
										Hello,
										<span
											data-text="$name"
											class="font-bold text-blue-600"
											>World</span
										>!
									</p>
									<div class="flex gap-2">
										<button data-on:click="$name = 'Datastar'">
											Say Datastar
										</button>
										<button data-on:click="$name = 'Electron'">
											Say Electron
										</button>
									</div>
								</div>

								<!-- 2. Two-way Binding -->
								<div>
									<h4>2. Two-way Binding (data-bind)</h4>
									<div class="field">
										<input
											type="text"
											data-bind:input
											placeholder="Type something..."
											class="input"
										/>
									</div>
									<p>
										You typed:
										<span data-text="$input" class="font-mono"></span>
									</p>
								</div>

								<!-- 3. Server Actions -->
								<div>
									<h4>3. Server Actions (@post)</h4>
									<div class="flex items-center gap-4">
										<button
											data-on:click="@post('/increment')"
										>
											<span>Count: </span>
											<span class="font-mono" data-text="$count">0</span>
										</button>
										<button data-on:click="@post('/reset')">
											Reset
										</button>
									</div>
								</div>

								<!-- 4. Fragment Updates -->
								<div>
									<h4>4. Fragment Updates</h4>
									<div id="message-box">
										Click the button to update this from the server
									</div>
									<button data-on:click="@post('/update-message')">
										Update from Server
									</button>
								</div>

								<!-- 5. Conditional Attributes -->
								<div>
									<h4>5. Conditional Attributes (data-attr)</h4>
									<div class="flex items-center gap-4">
										<label
											class="flex cursor-pointer items-center gap-2"
										>
											<input
												type="checkbox"
												data-bind:agreed
												class="checkbox"
											/>
											<span class="text-neutral-500"
												>I agree to the terms</span
											>
										</label>
										<button
											data-attr:disabled="!$agreed"
											data-on:click="alert('Thanks for agreeing!')"
										>
											Submit
										</button>
									</div>
								</div>

								<!-- 6. Live Updates via SSE -->
								<div>
									<h4>6. Live Updates (SSE)</h4>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span
												class="h-2 w-2 animate-pulse rounded-full bg-green-500"
											></span>
											<span class="text-sm text-neutral-500"
												>Live connection</span
											>
										</div>
										<div class="text-right">
											<div
												class="text-xs tracking-wide text-neutral-500 uppercase"
											>
												Server Time
											</div>
											<div
												data-text="$time"
												class="font-mono text-xl font-bold"
											>
												${serverTime}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</body>
				</html>`,
			{ headers: { "Content-Type": "text/html" } },
		);
	});

	router.registerRoute(
		"/increment",
		() =>
			DS.stream(async (stream) => {
				stream.patchSignals(JSON.stringify({ count: ++count }));
			}),
		"POST",
	);

	router.registerRoute(
		"/reset",
		() => {
			count = 0;
			return DS.stream(async (stream) => {
				stream.patchSignals(JSON.stringify({ count }));
			});
		},
		"POST",
	);

	router.registerRoute(
		"/update-message",
		() =>
			DS.stream(async (stream) => {
				stream.patchElements(
					`<div class="flex items-center gap-2 text-green-600">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
						</svg>
						<span>Server updated this at ${new Date().toLocaleTimeString()}</span>
					</div>`,
					{ selector: "#message-box", mode: "inner" },
				);
			}),
		"POST",
	);

	router.registerRoute("/updates", () =>
		DS.stream(
			async (stream) => {
				while (true) {
					stream.patchSignals(
						JSON.stringify({ time: new Date().toLocaleTimeString() }),
					);
					await new Promise((r) => setTimeout(r, 1000));
				}
			},
			{ keepalive: true },
		),
	);

	createWindow();
});
