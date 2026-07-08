import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

export default function StoreLayout({ children }) {
  return (
    <>
      <Header />
      <main style={mainContentStyle} className="store-main">
        {children}
      </main>
      <Footer />
      <LoginModal />
    </>
  );
}

const mainContentStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};
