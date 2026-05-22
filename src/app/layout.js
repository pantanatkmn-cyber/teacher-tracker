import "./globals.css";

export const metadata = {
  title: "ระบบติดตามงานอาจารย์ | วท.สันตพล",
  description:
    "ระบบติดตามงานอาจารย์ แผนกอุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยเทคโนโลยีสันตพล",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      {/* Google Fonts โหลดผ่าน <link> เพื่อหลีกเลี่ยง build-time fetch */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@500;600;700;800&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
