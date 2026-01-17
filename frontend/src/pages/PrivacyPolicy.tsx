import { Link, useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            LifeOS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our personal dashboard application.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Email address and password (for account creation and authentication)</li>
            <li>Profile information (name, avatar, location, timezone)</li>
            <li>Identity statements, core values, and vision boards</li>
            <li>Journal entries, habits, tasks, reviews, and health logs</li>
            <li>Financial data, career information, and other personal data you choose to store</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>We may automatically collect certain information when you use our service:</p>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>IP address and location data</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Authenticate your identity and manage your account</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          <h3>4.1 Data Storage</h3>
          <p>
            Your data is stored securely on Microsoft Azure infrastructure:
          </p>
          <ul>
            <li><strong>Database:</strong> Azure PostgreSQL Flexible Server with SSL encryption</li>
            <li><strong>Files:</strong> Azure Blob Storage with private containers and SAS tokens</li>
            <li><strong>Backups:</strong> Automated 7-day backups enabled</li>
          </ul>

          <h3>4.2 Security Measures</h3>
          <p>We implement appropriate technical and organizational measures to protect your data:</p>
          <ul>
            <li>Password hashing using bcrypt</li>
            <li>JWT-based authentication with secure tokens</li>
            <li>HTTPS encryption for all data transmission</li>
            <li>Firewall rules restricting database access</li>
            <li>Regular security updates and monitoring</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our service (e.g., Azure hosting, email services)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal data</li>
            <li><strong>Correction:</strong> Update or correct your personal information through your account settings</li>
            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
            <li><strong>Export:</strong> Export your data in CSV or PDF format (available for certain modules)</li>
            <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
          </ul>
          <p>To exercise these rights, please contact us using the information provided in the Contact section.</p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you services. 
            If you delete your account, we will delete or anonymize your personal information within 30 days, 
            except where we are required to retain it for legal or regulatory purposes.
          </p>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our service is not intended for children under the age of 13. We do not knowingly collect personal information 
            from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </p>
        </section>

        <section>
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. 
            These countries may have data protection laws that differ from those in your country. 
            By using our service, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section>
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy 
            periodically for any changes.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul>
            <li>Email: <a href="mailto:blessingamoah2@gmail.com">blessingamoah2@gmail.com</a></li>
            <li>Visit our <Link to="/contact">Contact page</Link> for more information</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
