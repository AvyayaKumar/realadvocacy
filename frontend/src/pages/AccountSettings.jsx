import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './AccountSettings.css';

function AccountSettings() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Update email state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailLoading(true);

    try {
      const res = await authAPI.updateEmail(newEmail, emailPassword);
      setUser(res.data.user);
      setEmailSuccess('Email updated successfully');
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setEmailError(err.response?.data?.error || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);

    try {
      await authAPI.deleteAccount(deletePassword);
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Account Settings</h1>

        <section className="settings-section">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            {passwordError && <div className="settings-error">{passwordError}</div>}
            {passwordSuccess && <div className="settings-success">{passwordSuccess}</div>}

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" disabled={passwordLoading} className="settings-btn">
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </section>

        <section className="settings-section">
          <h2>Update Email</h2>
          <p className="current-value">Current email: {user.email}</p>
          <form onSubmit={handleUpdateEmail}>
            {emailError && <div className="settings-error">{emailError}</div>}
            {emailSuccess && <div className="settings-success">{emailSuccess}</div>}

            <div className="form-group">
              <label htmlFor="newEmail">New Email</label>
              <input
                type="email"
                id="newEmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="emailPassword">Confirm Password</label>
              <input
                type="password"
                id="emailPassword"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={emailLoading} className="settings-btn">
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </section>

        <section className="settings-section danger-zone">
          <h2>Delete Account</h2>
          <p className="danger-warning">
            This action is permanent and cannot be undone. All your videos, comments, and data will be deleted.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="settings-btn danger-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              {deleteError && <div className="settings-error">{deleteError}</div>}

              <div className="form-group">
                <label htmlFor="deletePassword">Enter Password</label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="deleteConfirm">Type DELETE to confirm</label>
                <input
                  type="text"
                  id="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  required
                />
              </div>

              <div className="delete-actions">
                <button
                  type="button"
                  className="settings-btn cancel-btn"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                    setDeleteConfirm('');
                    setDeleteError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="settings-btn danger-btn"
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default AccountSettings;
