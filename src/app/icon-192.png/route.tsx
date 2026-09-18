import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7B3DFF, #FF3EDB)",
          borderRadius: 42,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M21.5 10.2c-.9-.9-2.3-1.4-3.9-1.4-2.9 0-4.9 1.4-4.9 3.5 0 2.3 2.1 2.9 4.4 3.4 2.5.6 3.9 1 3.9 2.6 0 1.6-1.6 2.6-3.9 2.6-1.9 0-3.4-.6-4.3-1.7"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.5 8.6 22.4 7l.4 3.2"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
