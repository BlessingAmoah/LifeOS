import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/AuthContext';
import { SEOHead } from './components/SEOHead';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Identity from './pages/Identity';
import Vision from './pages/Vision';
import Profile from './pages/Profile';
import Journals from './pages/Journals';
import Habits from './pages/Habits';
import Tasks from './pages/Tasks';
import Reviews from './pages/Reviews';
import Health from './pages/Health';
import Documents from './pages/Documents';
import Projects from './pages/Projects';
import Financial from './pages/Financial';
import Spiritual from './pages/Spiritual';
import Career from './pages/Career';
import TechnicalGrowth from './pages/TechnicalGrowth';
import RelationalPatterns from './pages/RelationalPatterns';
import Books from './pages/Books';
import Immigration from './pages/Immigration';
import Analytics from './pages/Analytics';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <SEOHead />
      <Router>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="identity" element={<Identity />} />
          <Route path="vision" element={<Vision />} />
          <Route path="profile" element={<Profile />} />
          <Route path="journals" element={<Journals />} />
          <Route path="habits" element={<Habits />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="health" element={<Health />} />
          <Route path="documents" element={<Documents />} />
          <Route path="projects" element={<Projects />} />
              <Route path="financial" element={<Financial />} />
              <Route path="spiritual" element={<Spiritual />} />
              <Route path="career" element={<Career />} />
              <Route path="technical-growth" element={<TechnicalGrowth />} />
              <Route path="relational-patterns" element={<RelationalPatterns />} />
              <Route path="books" element={<Books />} />
              <Route path="immigration" element={<Immigration />} />
              <Route path="analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
