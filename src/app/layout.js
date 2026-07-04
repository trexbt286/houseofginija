import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import AnalyticsTracker from "@/components/AnalyticsTracker";

export const metadata = {
  title: "House Of Ginija | Timeless Couture & Archival Fashion",
  description: "Crafting timeless luxury fashion and dedicated master couture. Explore our exclusive slow-fashion collections.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {/* Client-side page visits telemetry */}
          <AnalyticsTracker />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

