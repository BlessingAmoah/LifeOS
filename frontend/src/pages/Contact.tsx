import { Link, useNavigate } from 'react-router-dom';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="contact-page">
      <div className="contact-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Contact Us</h1>
        <p className="contact-intro">
          Have questions, feedback, or need support? We'd love to hear from you!
        </p>

        <div className="contact-sections">
          <section className="contact-section">
            <h2>📧 Email</h2>
            <p>
              For general inquiries, support, or feedback, please email us at:
            </p>
            <p className="contact-email">
              <a href="mailto:blessingamoah2@gmail.com">blessingamoah2@gmail.com</a>
            </p>
            <p className="contact-note">
              We typically respond within 24-48 hours.
            </p>
          </section>

          <section className="contact-section">
            <h2>🔒 Privacy & Security</h2>
            <p>
              If you have concerns about privacy or security, or need to report a security issue, 
              please contact us immediately at the email above with "SECURITY" in the subject line.
            </p>
          </section>

          <section className="contact-section">
            <h2>📋 Account Support</h2>
            <p>
              For account-related issues, password resets, or data export requests, please include 
              your account email address in your message.
            </p>
          </section>

          <section className="contact-section">
            <h2>💡 Feature Requests</h2>
            <p>
              We're always looking to improve LifeOS. If you have ideas for new features or 
              enhancements, we'd love to hear them!
            </p>
          </section>

          <section className="contact-section">
            <h2>📄 Legal</h2>
            <p>
              For questions about our Privacy Policy or Terms of Service, please review:
            </p>
            <ul className="legal-links">
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
            </ul>
          </section>
        </div>

        <div className="contact-footer">
          <p>
            <strong>LifeOS</strong> - Your Personal Operating System for Intentional Living
          </p>
          <p className="contact-footer-note">
            Your data is secure and private. Hosted on Microsoft Azure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
