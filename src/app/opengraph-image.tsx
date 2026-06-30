export const alt = "JobQuip招聘平台";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Image() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/og-image.png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
