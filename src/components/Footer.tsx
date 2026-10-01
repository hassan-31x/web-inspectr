export default function Footer() {
  return (
    <footer className="shell site-footer">
      <span className="footer-brand">inspectr.</span>
      <p>Built for the details that are easy to miss.</p>
      <span>© {new Date().getFullYear()} Inspectr</span>
    </footer>
  );
}
