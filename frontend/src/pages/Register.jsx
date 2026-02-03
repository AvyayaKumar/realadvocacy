import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ADVOCACY_TOPICS = [
  { id: 'climate', label: 'Climate & Environment' },
  { id: 'education', label: 'Education Reform' },
  { id: 'civil-rights', label: 'Civil Rights & Equality' },
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'gun-violence', label: 'Gun Violence Prevention' },
  { id: 'immigration', label: 'Immigration' },
  { id: 'healthcare', label: 'Healthcare Access' },
  { id: 'poverty', label: 'Poverty & Homelessness' },
  { id: 'democracy', label: 'Democracy & Voting' },
  { id: 'youth-empowerment', label: 'Youth Empowerment' },
  { id: 'lgbtq', label: 'LGBTQ+ Rights' },
  { id: 'racial-justice', label: 'Racial Justice' },
  { id: 'womens-rights', label: "Women's Rights" },
  { id: 'technology', label: 'Technology & Privacy' },
  { id: 'criminal-justice', label: 'Criminal Justice Reform' },
  { id: 'other', label: 'Other' }
];

const ACCOUNT_TYPES = [
  {
    id: 'competitor',
    label: 'Speaker',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    description: 'Share speeches, connect with organizers, build your portfolio',
    color: 'secondary',
    features: ['Upload speeches', 'Connect with causes', 'Get discovered']
  },
  {
    id: 'organizer',
    label: 'Organizer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    description: 'Find passionate speakers for your events and causes',
    color: 'accent',
    features: ['Discover talent', 'Post opportunities', 'Build community']
  },
  {
    id: 'guest',
    label: 'Guest',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
    description: 'Browse and watch speeches from talented young advocates',
    color: 'muted',
    features: ['Watch speeches', 'Explore topics', 'Stay informed']
  }
];

function Register() {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState('competitor');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [school, setSchool] = useState('');
  const [advocacyFocus, setAdvocacyFocus] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password, accountType, organization, school, advocacyFocus);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type) => {
    setAccountType(type);
    setStep(2);
  };

  return (
    <div className="auth-page">
      <div className={`auth-container ${step === 1 ? 'wide' : ''}`}>
        {step === 1 ? (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <span className="logo-letter-auth">A</span>
              </div>
              <h1>Join Amplify</h1>
              <p>How will you use your voice?</p>
            </div>

            <div className="account-type-grid">
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.id}
                  className={`account-type-card ${type.color}`}
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <div className="type-icon">{type.icon}</div>
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                  <ul className="type-features">
                    {type.features.map((feature, i) => (
                      <li key={i}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="auth-footer">
              <span>Already have an account?</span>
              <Link to="/login">Sign in</Link>
            </div>
          </>
        ) : (
          <>
            <div className="auth-header">
              <button className="back-btn" onClick={() => setStep(1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="auth-logo">
                <span className="logo-letter-auth">A</span>
              </div>
              <h1>Create Account</h1>
              <p>
                Signing up as{' '}
                <span className={`type-badge ${accountType}`}>
                  {ACCOUNT_TYPES.find(t => t.id === accountType)?.label}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {accountType === 'competitor' && (
                <div className="form-group">
                  <label htmlFor="school">School (optional)</label>
                  <input
                    type="text"
                    id="school"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Your school or institution"
                  />
                </div>
              )}

              {accountType === 'organizer' && (
                <>
                  <div className="form-group">
                    <label htmlFor="organization">Organization</label>
                    <input
                      type="text"
                      id="organization"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Your organization name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Advocacy Focus</label>
                    <p className="field-hint">Select the causes your organization focuses on (choose up to 3)</p>
                    <div className="advocacy-grid">
                      {ADVOCACY_TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className={`advocacy-chip ${advocacyFocus.includes(topic.id) ? 'selected' : ''}`}
                          onClick={() => {
                            if (advocacyFocus.includes(topic.id)) {
                              setAdvocacyFocus(advocacyFocus.filter(t => t !== topic.id));
                            } else if (advocacyFocus.length < 3) {
                              setAdvocacyFocus([...advocacyFocus, topic.id]);
                            }
                          }}
                        >
                          {topic.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <span>Already have an account?</span>
              <Link to="/login">Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
