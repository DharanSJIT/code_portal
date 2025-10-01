// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { authService, logOutEnhanced } from '../../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOutEnhanced();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSetAdmin = async (email) => {
    try {
      await authService.setUserAsAdmin(email);
      alert(`Admin privileges granted to ${email}`);
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Failed to set admin:', error);
      alert('Failed to grant admin privileges');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <h2>All Users</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>UID</th>
            <th>Email Verified</th>
            <th>Is Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uid}>
              <td>{user.email}</td>
              <td>{user.uid}</td>
              <td>{user.emailVerified ? 'Yes' : 'No'}</td>
              <td>{user.customClaims?.admin ? 'Yes' : 'No'}</td>
              <td>
                {!user.customClaims?.admin && (
                  <button onClick={() => handleSetAdmin(user.email)}>
                    Make Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}