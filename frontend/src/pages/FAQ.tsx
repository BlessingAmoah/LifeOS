import { Link, useNavigate } from 'react-router-dom';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click the "Get Started" or "Sign Up" button on the landing page. You\'ll need to provide your email address and create a password. After registration, you\'ll receive a verification code via email to complete the signup process.'
        },
        {
          q: 'Is LifeOS free to use?',
          a: 'Yes, LifeOS is currently free to use. We believe in making personal growth tools accessible to everyone.'
        },
        {
          q: 'Do I need to install anything?',
          a: 'No, LifeOS is a web-based application. You can access it from any device with a modern web browser. No installation required.'
        },
        {
          q: 'What browsers are supported?',
          a: 'LifeOS works best with modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.'
        }
      ]
    },
    {
      category: 'Features & Usage',
      questions: [
        {
          q: 'What can I track in LifeOS?',
          a: 'LifeOS allows you to track multiple aspects of your life including: identity and vision, journal entries, daily habits, tasks and sprints, health logs, financial data, career goals, spiritual growth, books you\'re reading, immigration status, and more. It\'s designed to be your comprehensive personal operating system.'
        },
        {
          q: 'How do I set up my identity and vision?',
          a: 'Navigate to the Identity page to define your core values, identity statement, life pillars, and personal rules. Then go to the Vision page to create short-term (3-6 months) and long-term (1-5 years) vision boards. These serve as your north star for all your daily actions.'
        },
        {
          q: 'Can I export my data?',
          a: 'Yes! Many modules support data export in CSV and PDF formats. Look for the export buttons in Journals, Tasks, Habits, Health, and Financial pages. This allows you to keep backups of your data or analyze it in other tools.'
        },
        {
          q: 'How does habit tracking work?',
          a: 'Create habits with a name, category, and frequency (daily or weekly). Log your habit completion status each day using the calendar view or list view. LifeOS automatically calculates your streak and weekly success rate to help you build consistency.'
        },
        {
          q: 'What is sprint-based task management?',
          a: 'Sprint-based workflow helps you organize tasks into time-bound periods (sprints). You can create sprints, assign tasks to them, track progress on a Kanban board, and conduct retrospectives. This approach helps break down long-term goals into manageable daily actions.'
        }
      ]
    },
    {
      category: 'Privacy & Security',
      questions: [
        {
          q: 'Is my data secure?',
          a: 'Yes, your data is stored securely on Microsoft Azure infrastructure with encryption at rest and in transit. We use industry-standard security practices including password hashing, JWT authentication, and SSL encryption. Your data is private and accessible only to you.'
        },
        {
          q: 'Where is my data stored?',
          a: 'Your data is stored on Microsoft Azure cloud infrastructure. The database uses Azure PostgreSQL Flexible Server, and files are stored in Azure Blob Storage. All data is encrypted and backed up automatically.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can request account deletion at any time. Contact us through the Contact page, and we\'ll delete your account and all associated data within 30 days, except where we\'re required to retain it for legal purposes.'
        },
        {
          q: 'Do you sell my data?',
          a: 'No, we do not sell, trade, or rent your personal information to third parties. Your data is yours, and we\'re committed to keeping it private and secure.'
        }
      ]
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'What if I forget my password?',
          a: 'Use the "Forgot Password" link on the login page. You\'ll receive a verification code via email to reset your password securely.'
        },
        {
          q: 'Can I use LifeOS on mobile devices?',
          a: 'Yes, LifeOS is responsive and works on mobile devices, tablets, and desktops. While we\'re continuously improving mobile experience, the full feature set is available across all devices.'
        },
        {
          q: 'How often is data backed up?',
          a: 'Your data is automatically backed up daily with 7-day retention. This ensures your information is safe even in the event of unexpected issues.'
        },
        {
          q: 'What happens if the service is down?',
          a: 'We strive to maintain high availability, but occasional maintenance or technical issues may occur. Your data is always safe and will be available once service is restored. We recommend exporting your data periodically as a backup.'
        }
      ]
    },
    {
      category: 'Support',
      questions: [
        {
          q: 'How can I get help?',
          a: 'You can contact us via email at blessingamoah2@gmail.com or visit our Contact page. We typically respond within 24-48 hours. For security concerns, please include "SECURITY" in the subject line.'
        },
        {
          q: 'Can I request new features?',
          a: 'Absolutely! We love hearing from users about features they\'d like to see. Send us your ideas through the Contact page, and we\'ll consider them for future updates.'
        },
        {
          q: 'How do I report a bug?',
          a: 'Please contact us through the Contact page with details about the issue you\'re experiencing, including what you were doing when it occurred and any error messages you saw. This helps us fix issues quickly.'
        }
      ]
    }
  ];

  return (
    <div className="faq-page">
      <div className="faq-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Frequently Asked Questions</h1>
        <p className="faq-intro">
          Find answers to common questions about LifeOS. Can't find what you're looking for? 
          <Link to="/contact"> Contact us</Link> and we'll be happy to help!
        </p>

        {faqs.map((category, categoryIndex) => (
          <section key={categoryIndex} className="faq-category">
            <h2>{category.category}</h2>
            <div className="faq-list">
              {category.questions.map((faq, index) => (
                <div key={index} className="faq-item">
                  <h3 className="faq-question">{faq.q}</h3>
                  <p className="faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="faq-footer">
          <p>Still have questions?</p>
          <Link to="/contact" className="btn btn-primary">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
