import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="shell">
        <section className="error-state">
          <span className="eyebrow">404 · PAGE NOT FOUND</span>
          <h1>Nothing to inspect here.</h1>
          <p>This page may have moved, or the address may be incorrect.</p>
          <Link href="/" className="button primary" style={{ marginTop: 24 }}>
            Start a website check →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
