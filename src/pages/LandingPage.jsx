import React from 'react';
import { Link } from 'react-router-dom';

// Mock data for upcoming events
const upcomingEvents = [
  {
    name: 'LeetCode Weekly Contest 405',
    platform: 'LeetCode',
    date: 'Oct 5, 2025, 8:00 AM',
  },
  {
    name: 'Codeforces Round #950 (Div. 3)',
    platform: 'Codeforces',
    date: 'Oct 7, 2025, 7:35 PM',
  },
  {
    name: 'HackerRank September Challenge',
    platform: 'HackerRank',
    date: 'Oct 9, 2025, 12:00 PM',
  },
];

const LandingPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Overview Section */}
      <section className="text-center py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 leading-tight">
            Welcome to CodeFolio
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            The ultimate platform for developers to track progress, showcase skills, and connect with opportunities. Your entire coding journey, visualized.
          </p>
          <Link
            to="/home"
            className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Go to Your Dashboard
          </Link>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-blue-800 mb-12">
            Upcoming Contests & Events
          </h2>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-blue-700">{event.name}</h3>
                  <p className="text-gray-500 mt-1">{event.platform} - {event.date}</p>
                </div>
                <button className="mt-4 sm:mt-0 bg-white text-blue-600 font-semibold py-2 px-5 border border-blue-600 rounded-full hover:bg-blue-50 transition duration-300">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;