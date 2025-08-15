
import React, { useState } from 'react';
import Layout from '../components/Layout';

const faqs = [
  {
    question: 'What is BookingDriving?',
    answer: 'BookingDriving is a web platform that lets you book professional drivers for trips, hourly, or daily rides. It connects you with trusted, verified drivers in your area.'
  },
  {
    question: 'How do I book a driver?',
    answer: 'Simply sign up or log in, search for available drivers, and book a ride for your preferred route, date, and time.'
  },
  {
    question: 'Are the drivers verified?',
    answer: 'Yes, all drivers on BookingDriving are verified and rated by users for your safety and peace of mind.'
  },
  {
    question: 'Can I manage or cancel my bookings?',
    answer: 'Absolutely! You can view, manage, or cancel your bookings anytime from your dashboard.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use secure protocols and best practices to protect your data and privacy.'
  }
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div className="max-w-2xl mx-auto mt-16 mb-10">
      <h3 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Frequently Asked Questions</h3>
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-indigo-100 rounded-xl bg-white shadow-sm">
            <button
              className="w-full flex justify-between items-center px-6 py-4 text-lg font-semibold text-indigo-700 focus:outline-none"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              aria-expanded={openIndex === idx}
            >
              {faq.question}
              <span className="ml-2 text-indigo-400">{openIndex === idx ? '-' : '+'}</span>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-4 text-gray-600 animate-fade-in">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout>
      {/* Hero Section with Image */}
      <section className="w-full max-w-5xl mx-auto text-center mt-14 px-4">
        <div className="flex flex-col md:flex-row items-center gap-10 mb-10">
          <div className="flex-1 text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-700 mb-4 animate-fade-in">
              Welcome to BookingDriving
            </h1>
            <p className="text-xl md:text-2xl text-indigo-500 mb-6 animate-fade-in-delay">
              Book professional drivers for any occasion—trips, hourly rides, or daily commutes. Fast, secure, and reliable.
            </p>
            <div className="flex gap-4 mb-4">
              <a href="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold rounded-2xl text-xl shadow-lg transition">
                Get Started
              </a>
              <a href="/login" className="px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold rounded-2xl text-xl shadow border border-indigo-200 transition">
                Log In
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/home.png"
              alt="BookingDriving hero"
              className="w-102 h-82 object-contain drop-shadow-2xl animate-fade-in"
            />
          </div>
        </div>

        {/* Feature Highlights with Images */}
        <div className="grid md:grid-cols-3 gap-8 my-14">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center">
            
            <h3 className="text-xl font-bold text-indigo-600 mb-2">Easy Online Booking</h3>
            <p className="text-gray-700">Book a driver in just a few clicks. Choose your route, time, and ride type—done!</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center">
            
            <h3 className="text-xl font-bold text-indigo-600 mb-2">Verified Drivers</h3>
            <p className="text-gray-700">All drivers are background-checked and rated by users for your safety and peace of mind.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center">
            
            <h3 className="text-xl font-bold text-indigo-600 mb-2">Real-time Booking Status</h3>
            <p className="text-gray-700">Track your bookings, see driver details, and manage your rides from your dashboard.</p>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="flex flex-col md:flex-row gap-8 justify-center mb-14">
          <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-indigo-600 mb-4">How it Works</h3>
            <ol className="space-y-4 text-left">
              <li className="flex items-start gap-3">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                <span>
                  <span className="font-semibold">Sign up or log in</span> to your account.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                <span>
                  <span className="font-semibold">Search and book</span> a driver for your preferred route, date, and time.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                <span>
                  <span className="font-semibold">Track and manage</span> your bookings, rate drivers, and update your profile anytime.
                </span>
              </li>
            </ol>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-8 border border-indigo-100 flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold text-indigo-600 mb-2">Why Choose Us?</h3>
            <ul className="text-gray-600 space-y-2 text-left">
              <li>✔️ Fast, intuitive booking process</li>
              <li>✔️ Only verified and rated drivers</li>
              <li>✔️ Real-time booking status</li>
              <li>✔️ Flexible for trips, hourly, or daily needs</li>
              <li>✔️ Secure payment and data protection</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <FAQSection />

        
      </section>
    </Layout>
  );
}
