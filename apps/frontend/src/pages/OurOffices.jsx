import React from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Chatbot from '../components/Chatbot'

const OurOffices = () => {
  const offices = [
    {
      city: 'New York',
      country: 'United States',
      address: '123 Business Street, Suite 100',
      cityState: 'New York, NY 10001',
      phone: '+1 (555) 123-4567',
      email: 'ny@mastersolis.com'
    },
    {
      city: 'London',
      country: 'United Kingdom',
      address: '456 Innovation Avenue',
      cityState: 'London, EC1A 1BB',
      phone: '+44 20 1234 5678',
      email: 'london@mastersolis.com'
    },
    {
      city: 'Singapore',
      country: 'Singapore',
      address: '789 Tech Hub, Level 15',
      cityState: 'Singapore 018956',
      phone: '+65 6123 4567',
      email: 'singapore@mastersolis.com'
    },
    {
      city: 'Bangalore',
      country: 'India',
      address: '321 Digital Park, Tower A',
      cityState: 'Bangalore, Karnataka 560001',
      phone: '+91 80 1234 5678',
      email: 'bangalore@mastersolis.com'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Offices
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Visit us at any of our global locations. We're here to help you transform your business with intelligent solutions.
            </p>
          </div>

          {/* Offices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
            {offices.map((office, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {office.city}
                    </h3>
                    <p className="text-sm text-gray-500">{office.country}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {office.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {office.cityState}
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{office.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{office.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Need to reach us?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our team is available 24/7 to assist you. Contact any of our offices or reach out through our support channels.
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}

export default OurOffices

