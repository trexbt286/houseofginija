import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StoreLayout({ children }) {
  return (
    <>
      <Header />
      <main style={mainContentStyle} className="store-main">
        {children}
      </main>
      <Footer />

    </>
  );
}

const mainContentStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};
