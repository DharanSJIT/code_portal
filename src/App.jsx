import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import Leaderboard from './components/Leaderboard';
import ActivityFeed from './components/ActivityFeed';
import TaskTracker from './components/TaskTracker';

// Admin Components
import AdminSignIn from './components/AdminSignIn';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminUserCreation from './components/AdminUserCreation';
import StudentList from './components/StudentList';
import StudentDetails from './components/StudentDetails';
import ScrapingStatus from './components/ScrapingStatus';
import AdminLeaderboard from './components/AdminLeaderboard';
import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import StudentPasswordManager from './components/StudentPasswordManager';

// Chat Components
import StudentChatPage from './components/Chat/StudentChatPage';
import AdminChatPage from './components/Chat/AdminChatPage';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Debug utilities (remove after fixing the issue)
import { debugUserProfile, createMissingUserProfile } from './utils/debugAuth';
import { createAdminAccount, verifyAdminAccount, checkAllUsers } from './utils/adminSetup';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, hideFooter = false }) => {
  return (
    <>
      <Header />
      {children}
      {!hideFooter && <Footer />}
    </>
  );
};

// Tasks Page Component (Full Page)
const TasksPage = () => {
  const [tasks, setTasks] = React.useState([
    { id: 1, title: 'Solve 3 LeetCode problems', completed: true },
    { id: 2, title: 'Participate in Codeforces contest', completed: false },
    { id: 3, title: 'Complete system design task', completed: false },
    { id: 4, title: 'Push code to GitHub', completed: true },
    { id: 5, title: 'Review pull requests', completed: false },
    { id: 6, title: 'Update technical documentation', completed: false }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Tasks</h1>
          <p className="text-gray-600">
            Track your daily coding goals and stay consistent
          </p>
        </div>
        <TaskTracker tasks={tasks} expanded={true} />
      </div>
    </div>
  );
};

// Activity Page Component (Full Page)
const ActivityPage = () => {
  const [activities] = React.useState([
    { id: 1, platform: 'LeetCode', action: 'Solved "Two Sum" problem', time: '2 hours ago' },
    { id: 2, platform: 'GitHub', action: 'Pushed 12 commits to main', time: '4 hours ago' },
    { id: 3, platform: 'Codeforces', action: 'Participated in Div 2 contest', time: '1 day ago' },
    { id: 4, platform: 'AtCoder', action: 'Solved 3 problems in ABC contest', time: '2 days ago' },
    { id: 5, platform: 'HackerRank', action: 'Earned Gold Badge in Algorithms', time: '3 days ago' },
    { id: 6, platform: 'LeetCode', action: 'Completed daily challenge', time: '3 days ago' },
    { id: 7, platform: 'GitHub', action: 'Created new repository "awesome-project"', time: '4 days ago' },
    { id: 8, platform: 'Codeforces', action: 'Achieved rating of 1800+', time: '5 days ago' }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Recent Activity</h1>
          <p className="text-gray-600">
            Your complete activity history across all platforms
          </p>
        </div>
        <ActivityFeed activities={activities} expanded={true} />
      </div>
    </div>
  );
};

// Profile Page Placeholder
const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Profile</h1>
          <p className="text-gray-600">Profile page coming soon...</p>
        </div>
      </div>
    </div>
  );
};

// Settings Page Placeholder
const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Settings</h1>
          <p className="text-gray-600">Settings page coming soon...</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  // Make debug tools available globally for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugUserProfile = debugUserProfile;
      window.createMissingUserProfile = createMissingUserProfile;
      window.createAdminAccount = createAdminAccount;
      window.verifyAdminAccount = verifyAdminAccount;
      window.checkAllUsers = checkAllUsers;
      console.log('🔧 Debug tools loaded:');
      console.log('  - Run window.debugUserProfile() to debug authentication');
      console.log('  - Run window.createMissingUserProfile({ role: "user" }) to create missing profile');
      console.log('  - Run window.createAdminAccount("email", "password", "Name") to create admin');
      console.log('  - Run window.verifyAdminAccount("email", "password") to verify admin');
      console.log('  - Run window.checkAllUsers() to see all users');
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn isOpen={true} />} />
          <Route path="/admin/signin" element={<AdminSignIn isOpen={true} />} />
          
          {/* Main App Routes - Dashboard (HomePage) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Legacy home route - redirect to dashboard */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          
          {/* Leaderboard Page Route */}
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          } />
          
          {/* Tasks Page Route */}
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />
          
          {/* Activity Page Route */}
          <Route path="/activity" element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          } />
          
          {/* Profile Page Route */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Settings Page Route */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Chat Routes - WITHOUT FOOTER */}
          <Route path="/chat" element={
            <ProtectedRoute hideFooter={true}>
              <StudentChatPage />
            </ProtectedRoute>
          } />
          
          {/* Individual Component Routes (if needed for testing) */}
          <Route path="/components/leaderboard" element={
            <div className="min-h-screen bg-gray-50">
              <Header />
              <div className="container mx-auto py-8 px-4">
                <Leaderboard />
              </div>
              <Footer />
            </div>
          } />
          
          {/* Admin Routes with Authentication Guard */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="add-student" element={<AdminUserCreation />} />
            <Route path="scraping-status" element={<ScrapingStatus />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="passwords" element={<StudentPasswordManager />} />
            <Route path="chat" element={<AdminChatPage />} />
          </Route>
          
          {/* Legacy Routes with Authentication Guard */}
          <Route path="/dash" element={
            <AdminRoute>
              <Navigate to="/admin/dashboard" replace />
            </AdminRoute>
          } />
          
          {/* 404 Route - catch all unmatched routes */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                <p className="text-lg text-gray-600 mb-8">
                  The page you are looking for does not exist or you don't have permission to access it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/" 
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-center"
                  >
                    Return to Homepage
                  </a>
                  <a 
                    href="/dashboard" 
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold text-center"
                  >
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
