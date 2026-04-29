import { ImageResponse } from "next/og";

export const alt = "JobQuip招聘平台";
export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            marginBottom: 20,
            textShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          JobQuip
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            opacity: 0.95,
            marginBottom: 8,
          }}
        >
          专业求职招聘平台
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            opacity: 0.8,
          }}
        >
          Professional Job Recruitment Platform
        </div>
      </div>
    ),
    { ...size }
  );
}
