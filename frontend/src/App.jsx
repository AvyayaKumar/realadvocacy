import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import Upload from './pages/Upload';
import Watch from './pages/Watch';
import Channel from './pages/Channel';
import Matches from './pages/Matches';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/video/:id" element={<Watch />} />
              <Route path="/profile/:id" element={<Channel />} />
              <Route path="/channel/:id" element={<Channel />} />
              <Route path="/matches" element={<Matches />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
