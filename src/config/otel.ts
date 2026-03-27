import { env } from "./env.js";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
// import { Resource } from "@opentelemetry/resources";
// import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
// import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
// import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";

export async function startOtel() {
  // const resource = Resource.default().merge(
  //   new Resource({
  //     [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
  //   })
  // );

  // const sdk = new NodeSDK({
  //   resource,
  //   traceExporter: new OTLPTraceExporter(), // uses env vars like OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  //   metricExporter: new OTLPMetricExporter(), // uses env vars like OTEL_EXPORTER_OTLP_METRICS_ENDPOINT
  //   instrumentations: [
  //     getNodeAutoInstrumentations({
  //       // You can tweak these later (http, express, pg, etc.)
  //     }),
  //   ],
  // });

  // await sdk.start();

  // process.on("SIGTERM", async () => {
  //   await sdk.shutdown();
  //   process.exit(0);
  // });
}
