import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-blue-800">
          Your Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's a snapshot of your recent activity and progress.
        </p>
        
        {/* Dashboard content goes here */}
        <div className="mt-8 bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-blue-700">Your Stats</h2>
            <p className="mt-4 text-gray-500">
                Charts and visualizations of your coding stats will appear here.
            </p>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default HomePage;