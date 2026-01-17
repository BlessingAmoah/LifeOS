import { Link, useNavigate } from 'react-router-dom';
import './TermsOfService.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using LifeOS ("the Service"), you accept and agree to be bound by the terms and provision 
            of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            LifeOS is a personal dashboard application designed to help individuals manage their spiritual growth, 
            health, habits, career development, and daily execution. The Service includes features such as:
          </p>
          <ul>
            <li>Identity and vision tracking</li>
            <li>Journaling and reflection tools</li>
            <li>Habit tracking and streak monitoring</li>
            <li>Task and sprint management</li>
            <li>Health logging and goal tracking</li>
            <li>Financial tracking and budgeting</li>
            <li>Document storage and organization</li>
            <li>And other personal productivity features</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            To use certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and update your information to keep it accurate, current, and complete</li>
            <li>Maintain the security of your password and identification</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>

          <h3>3.2 Account Responsibility</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account. We are not liable for any loss or damage arising from your failure to 
            comply with this section.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit any malicious code, viruses, or harmful data</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Impersonate any person or entity</li>
            <li>Collect or store personal data about other users</li>
          </ul>
        </section>

        <section>
          <h2>5. User Content</h2>
          <h3>5.1 Ownership</h3>
          <p>
            You retain all ownership rights to the content you create, upload, or store using the Service ("User Content"). 
            By using the Service, you grant us a limited, non-exclusive license to store, process, and display your User 
            Content solely for the purpose of providing the Service to you.
          </p>

          <h3>5.2 Content Responsibility</h3>
          <p>
            You are solely responsible for your User Content. You represent and warrant that:
          </p>
          <ul>
            <li>You have the right to submit, post, or display such content</li>
            <li>Your content does not violate any third-party rights</li>
            <li>Your content complies with all applicable laws and regulations</li>
          </ul>

          <h3>5.3 Content Removal</h3>
          <p>
            We reserve the right to remove any User Content that violates these Terms or that we determine, in our sole 
            discretion, is harmful, offensive, or inappropriate.
          </p>
        </section>

        <section>
          <h2>6. Privacy and Data Protection</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy, which also 
            governs your use of the Service, to understand our practices regarding the collection and use of your information.
          </p>
        </section>

        <section>
          <h2>7. Service Availability</h2>
          <p>
            We strive to provide reliable and continuous access to the Service. However, we do not guarantee that the Service 
            will be available at all times. The Service may be unavailable due to:
          </p>
          <ul>
            <li>Scheduled maintenance</li>
            <li>Technical issues or failures</li>
            <li>Circumstances beyond our control</li>
          </ul>
          <p>
            We are not liable for any loss or damage resulting from Service unavailability.
          </p>
        </section>

        <section>
          <h2>8. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by LifeOS and are protected by 
            international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not 
            copy, modify, distribute, sell, or lease any part of the Service without our prior written consent.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          <h3>9.1 Termination by You</h3>
          <p>
            You may terminate your account at any time by contacting us or using the account deletion feature, if available.
          </p>

          <h3>9.2 Termination by Us</h3>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates 
            these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>

          <h3>9.3 Effect of Termination</h3>
          <p>
            Upon termination, your right to use the Service will immediately cease. We may delete your account and all 
            associated data within 30 days of termination, except where we are required to retain it for legal or regulatory purposes.
          </p>
        </section>

        <section>
          <h2>10. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
            INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
            NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
        </section>

        <section>
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, 
            OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless LifeOS and its officers, directors, employees, and agents 
            from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, 
            arising out of or in any way connected with your access to or use of the Service, your User Content, or your 
            violation of these Terms.
          </p>
        </section>

        <section>
          <h2>13. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting 
            the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such 
            modifications constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LifeOS 
            operates, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2>15. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us:
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

export default TermsOfService;
