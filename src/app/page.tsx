import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UrlForm from "@/components/UrlForm";
import FeatureList from "@/components/FeatureList";
import RecentScans from "@/components/RecentScans";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content" className="shell">
        <section className="home-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-dot" /> YOUR PRELAUNCH CHECK
            </span>
            <h1>
              Ready to go live?
              <br />
              <span>Check the details.</span>
            </h1>
            <p>
              Catch missing metadata, broken sharing previews, and overlooked
              essentials before your next launch.
            </p>
            <UrlForm />
          </div>
          <aside className="hero-aside" aria-label="How it works">
            <div className="aside-top">
              <span className="eyebrow">LESS GUESSWORK</span>
              <span className="aside-symbol" aria-hidden="true">
                ✳
              </span>
            </div>
            <h2>
              A fresh set of eyes
              <br />
              for your website.
            </h2>
            <ol>
              <li>
                <span>01</span>Paste your website address
              </li>
              <li>
                <span>02</span>We inspect the page and headers
              </li>
              <li>
                <span>03</span>See what needs your attention
              </li>
            </ol>
            <p>
              No installations. Just an address
              <br />
              and a clearer next step.
            </p>
          </aside>
        </section>
        <RecentScans />
        <FeatureList />
        <section className="scope-section">
          <h2>
            A starting point.
            <br />
            <span>You make the final call.</span>
          </h2>
          <p>
            Inspectr reads the HTML your server returns. It doesn’t execute
            JavaScript or measure Core Web Vitals. Use the report alongside
            browser testing and a manual accessibility review.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
