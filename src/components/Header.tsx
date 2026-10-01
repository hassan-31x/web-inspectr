import Link from "next/link";
export default function Header({ report = false }: { report?: boolean }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="Inspectr home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          inspectr<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/" aria-current={!report ? "page" : undefined}>
            Website check
          </Link>
          <Link href="/#checks">
            What we check <span aria-hidden="true">↗</span>
          </Link>
        </nav>
        <span className="header-note">A little clarity before you launch.</span>
      </div>
    </header>
  );
}
