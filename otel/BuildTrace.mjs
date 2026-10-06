/**
 * Records build timings as one OpenTelemetry trace and ships it to an OTLP/HTTP
 * collector in a single POST at the end of the build. A root span covers the
 * whole build; each `startSpan()` becomes a child of it, so parallel work
 * renders as a gantt chart in Tempo/Grafana.
 *
 * Shared by the webpack compile and the CI builders. Port of marta's
 * ci/builder/src/otel_trace.ts.
 *
 * Deliberately dependency-free: OTLP/HTTP has a JSON encoding, so `fetch` is
 * all it takes, and the CI builder image doesn't have to install
 * `@opentelemetry/*`.
 *
 * The build collector's endpoint and token are baked in (BUILD_COLLECTOR below)
 * so a consumer only has to bump this package to start reporting; no CI or
 * Dockerfile changes, which matters because webpack runs inside `docker build`
 * where CI's env vars don't reach. This package is public on npm, so the token
 * is effectively public: it can only write traces, and the collector rate-limits
 * its ingress. Rotate it by changing it here and in cubic-kubernetes'
 * configs/open-telemetry, then publishing and bumping consumers.
 *
 * The environment can override them:
 *   OTEL_EXPORTER_OTLP_ENDPOINT  collector base url; `/v1/traces` is appended.
 *                                Set to an empty string to turn export off.
 *   OTEL_INGRESS_BEARER_TOKEN    sent as `Authorization: Bearer ...`. The
 *                                collector's public receiver 401s without it.
 *   OTEL_SERVICE_NAME            overrides the `serviceName` option.
 *   OTEL_EXPORT_TIMEOUT_MS       default 10000.
 *   TRACEPARENT                  W3C `00-<trace id>-<span id>-<flags>`. When
 *                                set, this trace's root becomes a child of that
 *                                span, e.g. webpack inside a CI build's trace.
 *                                Overrides the `traceId` option.
 *
 * Export is best-effort: `flush()` never throws, so a dead or misconfigured
 * collector can't fail a build. It is awaited, though, so an unreachable
 * collector costs up to the timeout on the way out.
 */

import { randomBytes } from "node:crypto";

export const BUILD_COLLECTOR = {
	endpoint: "https://otel.nycrcubic.com",
	// write-only key, public on purpose; see the comment above
	bearerToken: "ZNZahd_FrIK9KhY_i1fMXHTJo9cTX781n8JgW0dzGKYF",
};

/** Baked-in collector settings, overridable from the environment ("" turns export off). */
export const collectorConfig = (env) => ({
	endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? BUILD_COLLECTOR.endpoint,
	bearerToken: env.OTEL_INGRESS_BEARER_TOKEN ?? BUILD_COLLECTOR.bearerToken,
});

const SPAN_KIND_INTERNAL = 1;
const STATUS_CODE_UNSET = 0;
const STATUS_CODE_OK = 1;
const STATUS_CODE_ERROR = 2;

// OTLP wants nanoseconds since the epoch. Date.now() only has ms resolution and
// is subject to clock steps, so anchor once and advance with the monotonic clock.
const wallClockOriginNs = BigInt(Date.now()) * 1_000_000n;
const monotonicOriginNs = process.hrtime.bigint();
const nowNs = () => wallClockOriginNs + (process.hrtime.bigint() - monotonicOriginNs);

const newSpanId = () => randomBytes(8).toString("hex");

/**
 * A Cloud Build id is a UUID: strip the dashes and it's exactly the 16 bytes a
 * trace id needs, so you can jump from a build id straight to its trace.
 * Anything else gets a random id.
 */
export const traceIdFrom = (id = "") => {
	const hex = id.replaceAll("-", "").toLowerCase();
	return /^[0-9a-f]{32}$/.test(hex) ? hex : randomBytes(16).toString("hex");
};

export const toOtlpAttributes = (attributes) =>
	Object.entries(attributes)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => ({
			key,
			value: typeof value === "boolean"
				? { boolValue: value }
				: typeof value === "number"
					? Number.isInteger(value)
						? { intValue: String(value) }
						: { doubleValue: value }
					: { stringValue: String(value) },
		}));

/**
 * @param {object} options
 * @param {string} options.name          root span name, e.g. `ci build cubic-mta@main`
 * @param {string} [options.traceId]     e.g. the Cloud Build BUILD_ID; see traceIdFrom
 * @param {string} [options.serviceName]
 * @param {Record<string, string|number|boolean>} [options.attributes] root span attributes
 * @param {Record<string, string|undefined>} [options.env]
 */
export const createBuildTrace = ({
	name,
	traceId,
	serviceName = "build",
	attributes = {},
	env = process.env,
}) => {
	const { endpoint, bearerToken } = collectorConfig(env);
	const parsedTimeoutMs = parseInt(env.OTEL_EXPORT_TIMEOUT_MS, 10);
	// AbortSignal.timeout throws on NaN/negative, which would lose every export
	const timeoutMs = parsedTimeoutMs > 0 ? parsedTimeoutMs : 10000;
	serviceName = env.OTEL_SERVICE_NAME || serviceName;
	// W3C: version ff and all-zero ids are invalid, so ignore them
	const traceparent = /^(?!ff)[0-9a-f]{2}-(?!0{32})([0-9a-f]{32})-(?!0{16})([0-9a-f]{16})-[0-9a-f]{2}$/
		.exec(env.TRACEPARENT?.trim().toLowerCase() ?? "");
	traceId = traceparent?.[1] ?? traceIdFrom(traceId);
	const rootParentSpanId = traceparent?.[2];

	const makeSpan = (spanName, spanAttributes, parentSpanId) => ({
		name: spanName,
		spanId: newSpanId(),
		parentSpanId,
		startTimeUnixNano: nowNs(),
		endTimeUnixNano: undefined,
		statusCode: STATUS_CODE_UNSET,
		statusMessage: undefined,
		attributes: { ...spanAttributes },
	});

	const rootSpan = makeSpan(name, attributes, rootParentSpanId);
	const spans = [rootSpan];

	const endSpan = (span, { error = false, message, attributes: endAttributes } = {}) => {
		// first end wins, so a retry or a late duplicate can't move the end time
		if (span.endTimeUnixNano !== undefined) {
			return;
		}
		span.endTimeUnixNano = nowNs();
		span.statusCode = error ? STATUS_CODE_ERROR : STATUS_CODE_OK;
		span.statusMessage = message;
		Object.assign(span.attributes, endAttributes);
	};

	/**
	 * Opens a child span of the build. Call `.end()` on the result when the
	 * work finishes; spans never ended are closed as errors at flush time.
	 */
	const startSpan = (spanName, spanAttributes = {}) => {
		const span = makeSpan(spanName, spanAttributes, rootSpan.spanId);
		spans.push(span);
		return {
			spanId: span.spanId,
			end: (result) => endSpan(span, result),
		};
	};

	const toOtlpSpan = (span) => ({
		traceId,
		spanId: span.spanId,
		...(span.parentSpanId ? { parentSpanId: span.parentSpanId } : {}),
		name: span.name,
		kind: SPAN_KIND_INTERNAL,
		startTimeUnixNano: String(span.startTimeUnixNano),
		endTimeUnixNano: String(span.endTimeUnixNano),
		attributes: toOtlpAttributes(span.attributes),
		status: {
			code: span.statusCode,
			...(span.statusMessage ? { message: span.statusMessage } : {}),
		},
	});

	let flushed = false;
	/**
	 * Closes the root span and exports everything. Safe to call more than
	 * once; later calls are no-ops. Never throws.
	 * @param {"success"|"failure"} outcome
	 */
	const flush = async (outcome) => {
		if (flushed) {
			return;
		}
		flushed = true;

		// Anything still open died mid-step. That's exactly what should show
		// in the gantt, so close it at the build's end instead of dropping it.
		for (const span of spans.slice(1)) {
			endSpan(span, { error: true, message: "span was never ended" });
		}
		endSpan(rootSpan, {
			error: outcome === "failure",
			attributes: { "ci.build.outcome": outcome },
		});

		if (!endpoint) {
			return;
		}

		const payload = {
			resourceSpans: [{
				resource: {
					attributes: toOtlpAttributes({
						"service.name": serviceName,
						"service.namespace": "ci",
						"deployment.environment.name": "ci",
					}),
				},
				scopeSpans: [{
					scope: { name: "@reflexions/config-builder" },
					spans: spans.map(toOtlpSpan),
				}],
			}],
		};

		try {
			// inside the try: a malformed endpoint throws here, and bad telemetry
			// config isn't worth failing a build over either
			// appended, not resolved, so a path-prefixed collector (https://host/otlp) keeps its prefix
			const url = new URL(`${endpoint.replace(/\/+$/, "")}/v1/traces`);
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(timeoutMs),
			});
			if (!response.ok) {
				console.warn(`otel: collector rejected trace (${response.status} ${response.statusText})`);
				return;
			}
			console.log(`otel: exported ${spans.length} spans, trace ${traceId} → ${url.origin}`);
		}
		catch (error) {
			console.warn(`otel: failed to export trace to ${endpoint}`, error);
		}
	};

	return {
		traceId,
		/** Pass to a child process (e.g. a docker build) as TRACEPARENT to nest its trace under this span. */
		traceparentFor: (spanId = rootSpan.spanId) => `00-${traceId}-${spanId}-01`,
		startSpan,
		flush,
	};
};
