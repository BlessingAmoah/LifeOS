import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3><strong>LifeOS</strong></h3>
          <p>Your Personal Operating System for Intentional Living</p>
        </div>

        <div className="footer-section">
          <h4>Features</h4>
          <ul>
            <li>Identity-Based Goal Setting</li>
            <li>Sprint-Based Workflow</li>
            <li>Reflection-Driven Design</li>
            <li>Secure & Private</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Get Started</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Legal & Support</h4>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service">Terms of Service</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} LifeOS. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span> | </span>
          <Link to="/terms-of-service">Terms of Service</Link>
          <span> | </span>
          <Link to="/faq">FAQ</Link>
          <span> | </span>
          <Link to="/contact">Contact</Link>
        </div>
        <p>Your data is secure and private. Hosted on Azure.</p>
      </div>
    </footer>
  );
};

export default Footer;
