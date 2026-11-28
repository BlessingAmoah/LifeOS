import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/AuthContext';
import { SEOHead } from './components/SEOHead';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Identity from './pages/Identity';
import Profile from './pages/Profile';
import GrowthPillar from './pages/GrowthPillar';
import Habits from './pages/Habits';
import Health from './pages/Health';
import Documents from './pages/Documents';
import Financial from './pages/Financial';
import Career from './pages/Career';
import Immigration from './pages/Immigration';
import EvidenceOfGrace from './pages/EvidenceOfGrace';
import QuarterlyAudit from './pages/QuarterlyAudit';
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
          <Route path="profile" element={<Profile />} />
          <Route path="christian-life" element={<GrowthPillar key="christian_life" pillar="christian_life" />} />
          <Route path="personal" element={<GrowthPillar key="personal_growth" pillar="personal_growth" />} />
          <Route path="employment" element={<Career />} />
          <Route path="finance" element={<Financial />} />
          <Route path="habits" element={<Habits />} />
          <Route path="health" element={<Health />} />
          <Route path="documents" element={<Documents />} />
          <Route path="immigration" element={<Immigration />} />
          <Route path="evidence-of-grace" element={<EvidenceOfGrace />} />
          <Route path="quarterly-audit" element={<QuarterlyAudit />} />
          {/* Legacy routes for backward compatibility */}
          <Route path="financial" element={<Financial />} />
          <Route path="career" element={<Career />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
