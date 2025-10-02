import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage'; // New leaderboard page

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import SignIn from './components/SignIn';
import Leaderboard from './components/Leaderboard';

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

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Debug utilities (remove after fixing the issue)
import { debugUserProfile, createMissingUserProfile } from './utils/debugAuth';
import { createAdminAccount, verifyAdminAccount, checkAllUsers } from './utils/adminSetup';

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
          
          {/* Main App Routes */}
          <Route path="/home" element={
            <>
              <Header />
              <HomePage />
              <Footer />
            </>
          } />
          
          {/* Leaderboard Page Route */}
          <Route path="/leaderboard" element={
            <>
              <Header />
              <LeaderboardPage />
              <Footer />
            </>
          } />
          
          {/* Individual Component Routes (if needed) */}
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
                    href="/leaderboard" 
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold text-center"
                  >
                    View Leaderboard
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