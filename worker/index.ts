/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { parseByteRange } from "./byte-range.mjs";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const SCROLL_VIDEO_ROUTE_PATH = "/media/workflow-os-journey-v2.mp4";
const SCROLL_VIDEO_ASSET_PATH = "/workflow-os-journey-v2.mp4";

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (
      url.pathname === SCROLL_VIDEO_ROUTE_PATH &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      // Keep Range requests intact so Cloudflare's static asset service can
      // return 206 responses for responsive, bidirectional scroll seeking.
      const assetUrl = new URL(SCROLL_VIDEO_ASSET_PATH, request.url);
      const assetRequest = new Request(assetUrl, request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Workflow-Video-Route", "asset-binding");
      headers.set("Accept-Ranges", "bytes");
      const requestedRange = request.headers.get("Range");

      if (
        request.method === "HEAD" ||
        !requestedRange ||
        assetResponse.status === 206 ||
        !assetResponse.ok
      ) {
        return new Response(request.method === "HEAD" ? null : assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers,
        });
      }

      // Sites' production asset binding may return the full file even when a
      // Range header is present. Fall back to slicing this small cached asset
      // so the browser still receives the precise 206 response it requested.
      const fullVideo = await assetResponse.arrayBuffer();
      const byteRange = parseByteRange(requestedRange, fullVideo.byteLength);

      if (!byteRange) {
        headers.set("Content-Range", `bytes */${fullVideo.byteLength}`);
        headers.set("Content-Length", "0");
        return new Response(null, { status: 416, headers });
      }

      const partialVideo = fullVideo.slice(byteRange.start, byteRange.end + 1);
      headers.set(
        "Content-Range",
        `bytes ${byteRange.start}-${byteRange.end}/${fullVideo.byteLength}`,
      );
      headers.set("Content-Length", String(partialVideo.byteLength));

      return new Response(partialVideo, { status: 206, headers });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
