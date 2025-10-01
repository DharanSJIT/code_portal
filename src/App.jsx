import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';

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

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
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
        
        <Route path="/leaderboard" element={
          <>
            <Header />
            <div className="container mx-auto py-8 px-4">
              <Leaderboard />
            </div>
            <Footer />
          </>
        } />
        
        {/* Admin Routes with Authentication Guard */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
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
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">The page you are looking for does not exist.</p>
            <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Return to Homepage
            </a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
