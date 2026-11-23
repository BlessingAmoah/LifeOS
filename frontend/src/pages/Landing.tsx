import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      <div className="landing-content">
      <div className="landing-hero">
        <h1><strong>LifeOS</strong></h1>
        <p className="landing-tagline">Your Personal Operating System for Intentional Living</p>
        <p className="landing-description">
          LifeOS is a private, cloud-hosted personal dashboard designed to help you intentionally 
          manage your spiritual growth, health, habits, career development, and daily execution 
          from a single platform.
        </p>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Identity-Based Goal Setting</h3>
          <p>
            Turn your long-term vision into consistent daily action. Define your identity, 
            set short and long-term visions, and align your daily habits with who you want to become.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Structured Planning</h3>
          <p>
            Organize your goals and actions effectively. Plan, execute,
            and reflect on your progress with regular reviews.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>Reflection-Driven Design</h3>
          <p>
            Capture insights through journaling, track your habits, and review your growth 
            over time. LifeOS serves as both a personal operating system and a living record 
            of your journey.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure & Private</h3>
          <p>
            Your data is stored securely on Azure with encryption at rest. All your information 
            is private and accessible only to you.
          </p>
        </div>
      </div>

      <div className="landing-how-it-works">
        <h2>How It Works</h2>
        <div className="how-it-works-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Define Your Identity</h4>
            <p>Create your identity statement and set your short and long-term vision. This becomes your north star.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Track Daily Habits</h4>
            <p>Build consistency by tracking daily and weekly habits that align with your identity and vision.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Plan & Execute Goals</h4>
            <p>Use structured planning to break down your goals into actionable steps.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Reflect & Grow</h4>
            <p>Journal your insights, conduct weekly and quarterly reviews, and watch your growth over time.</p>
          </div>
        </div>
      </div>

      <div className="landing-cta">
        <h2>Ready to take control of your life?</h2>
        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </div>

      </div>
      <Footer />
    </div>
  );
};

export default Landing;
