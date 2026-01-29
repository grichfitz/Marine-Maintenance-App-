import './Footer.css';

type FooterProps = {
  onLogout: () => void;
};

export default function Footer({ onLogout }: FooterProps) {
  return (
    <footer className="footer">
      <button className="footer-link" onClick={onLogout}>
        Logout
      </button>
    </footer>
  );
}
