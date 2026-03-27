import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt =
  "LeadIntel Pro - AI lead generation and lead intelligence software";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.28), transparent 28%), linear-gradient(135deg, #f8fbff 0%, #eef2ff 45%, #ffffff 100%)",
        color: "#0f172a",
        fontFamily: "sans-serif",
        padding: "64px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          borderRadius: 36,
          border: "1px solid rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.82)",
          boxShadow: "0 28px 90px -42px rgba(15,23,42,0.35)",
          padding: "52px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "68%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                height: 66,
                width: 66,
                borderRadius: 20,
                background: "linear-gradient(135deg, #2563eb, #4f46e5)",
                color: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              L
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                LeadIntel <span style={{ color: "#2563eb" }}>Pro</span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                Lead Intelligence Software
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              AI lead generation for verified local business prospecting.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                lineHeight: 1.4,
                color: "#475569",
                maxWidth: 760,
              }}
            >
              Source businesses by category and city, score fit with AI,
              discover contacts, and export outreach-ready lead lists.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {["Verified sourcing", "AI fit scoring", "Email discovery"].map(
              (item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    border: "1px solid #dbeafe",
                    background: "#eff6ff",
                    color: "#2563eb",
                    padding: "12px 18px",
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "26%",
            borderRadius: 30,
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "28px",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "#93c5fd",
                fontWeight: 800,
              }}
            >
              Workflow
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Source</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Score</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Contact</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>Export</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {siteConfig.siteUrl}
            </div>
            <div style={{ fontSize: 16, color: "#cbd5e1" }}>
              Built for agencies, outbound teams, and local growth operators.
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
