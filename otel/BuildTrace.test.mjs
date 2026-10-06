import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { BUILD_COLLECTOR, collectorConfig, createBuildTrace } from "./BuildTrace.mjs";

test("exports root + child spans to /v1/traces with the bearer token", async () => {
	const received = [];
	const server = createServer((req, res) => {
		let body = "";
		req.on("data", (chunk) => body += chunk);
		req.on("end", () => {
			received.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
			res.end("{}");
		});
	});
	await new Promise((resolve) => server.listen(0, resolve));

	const trace = createBuildTrace({
		name: "ci build test",
		traceId: "0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9",
		attributes: { "ci.build.id": "abc" },
		env: {
			OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${server.address().port}`,
			OTEL_INGRESS_BEARER_TOKEN: "secret",
		},
	});
	trace.startSpan("compile").end();
	trace.startSpan("push"); // never ended
	await trace.flush("failure");
	await trace.flush("success"); // no-op
	server.close();

	assert.equal(received.length, 1);
	const { url, auth, body } = received[0];
	assert.equal(url, "/v1/traces");
	assert.equal(auth, "Bearer secret");

	const [root, compile, push] = body.resourceSpans[0].scopeSpans[0].spans;
	assert.equal(root.traceId, "0a1b2c3d4e5f60718293a4b5c6d7e8f9");
	assert.equal(root.parentSpanId, undefined);
	assert.equal(root.status.code, 2);
	assert.equal(compile.parentSpanId, root.spanId);
	assert.equal(compile.status.code, 1);
	assert.equal(push.status.code, 2);
	assert.ok(BigInt(compile.endTimeUnixNano) >= BigInt(compile.startTimeUnixNano));
	assert.ok(BigInt(root.endTimeUnixNano) >= BigInt(push.endTimeUnixNano));
});

test("TRACEPARENT nests the root span under the caller's span", () => {
	const parent = createBuildTrace({ name: "ci", traceId: "0a1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9", env: {} });
	const child = createBuildTrace({ name: "webpack", env: { TRACEPARENT: parent.traceparentFor() } });
	assert.equal(child.traceId, parent.traceId);
	assert.match(child.traceparentFor(), new RegExp(`^00-${parent.traceId}-[0-9a-f]{16}-01$`));

	for (const TRACEPARENT of [
		"garbage",
		`ff-${parent.traceId}-0123456789abcdef-01`,
		`00-${"0".repeat(32)}-0123456789abcdef-01`,
		`00-${parent.traceId}-${"0".repeat(16)}-01`,
	]) {
		const junk = createBuildTrace({ name: "x", env: { TRACEPARENT } });
		assert.match(junk.traceId, /^[0-9a-f]{32}$/);
		assert.notEqual(junk.traceId, parent.traceId, TRACEPARENT);
		assert.notEqual(junk.traceId, "0".repeat(32), TRACEPARENT);
	}
});

test("keeps the endpoint's path prefix and survives a bad timeout", async () => {
	const urls = [];
	const server = createServer((req, res) => {
		urls.push(req.url);
		req.resume().on("end", () => res.end("{}"));
	});
	await new Promise((resolve) => server.listen(0, resolve));

	const trace = createBuildTrace({
		name: "x",
		env: {
			OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${server.address().port}/otlp/`,
			OTEL_EXPORT_TIMEOUT_MS: "not a number",
		},
	});
	await trace.flush("success");
	server.close();

	assert.deepEqual(urls, [ "/otlp/v1/traces" ]);
});

test("an empty endpoint turns export off, no throw", async () => {
	const trace = createBuildTrace({ name: "x", env: { OTEL_EXPORTER_OTLP_ENDPOINT: "" } });
	trace.startSpan("a").end();
	await trace.flush("success");
});

test("unreachable collector doesn't throw", async () => {
	const trace = createBuildTrace({
		name: "x",
		env: { OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:1", OTEL_EXPORT_TIMEOUT_MS: "500" },
	});
	await trace.flush("success");
});

test("the build collector is baked in, and the environment can override it", () => {
	assert.deepEqual(collectorConfig({}), BUILD_COLLECTOR);
	assert.equal(BUILD_COLLECTOR.endpoint, "https://otel.nycrcubic.com");
	assert.match(BUILD_COLLECTOR.bearerToken, /^[A-Za-z0-9_-]{40,}$/);
	assert.deepEqual(
		collectorConfig({ OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318", OTEL_INGRESS_BEARER_TOKEN: "dev" }),
		{ endpoint: "http://localhost:4318", bearerToken: "dev" },
	);
	assert.equal(collectorConfig({ OTEL_EXPORTER_OTLP_ENDPOINT: "" }).endpoint, "");
});
