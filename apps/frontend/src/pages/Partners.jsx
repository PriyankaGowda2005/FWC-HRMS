import React, { useState } from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Chatbot from '../components/Chatbot'

const Partners = () => {
  const [imageErrors, setImageErrors] = useState({})
  const partners = [
    {
      name: 'Microsoft',
      logo: 'https://img.icons8.com/fluency/240/microsoft.png',
      description: 'Azure integration and Office 365 connectivity',
      category: 'Cloud & Productivity'
    },
    {
      name: 'Salesforce',
      logo: 'https://img.icons8.com/color/240/salesforce.png',
      description: 'CRM integration and customer data sync',
      category: 'CRM'
    },
    {
      name: 'ADP',
      logo: 'https://logos-world.net/wp-content/uploads/2021/03/ADP-Logo.png',
      description: 'Payroll processing and benefits administration',
      category: 'Payroll'
    },
    {
      name: 'Slack',
      logo: 'https://img.icons8.com/color/240/slack-new.png',
      description: 'Team communication and notifications',
      category: 'Communication'
    },
    {
      name: 'Zoom',
      logo: 'https://img.icons8.com/color/240/zoom.png',
      description: 'Video interviews and virtual meetings',
      category: 'Video Conferencing'
    },
    {
      name: 'Google Workspace',
      logo: 'https://img.icons8.com/color/240/google-logo.png',
      description: 'Gmail, Calendar, and Drive integration',
      category: 'Productivity'
    }
  ]

  const partnershipBenefits = [
    'Seamless data synchronization',
    'Reduced manual data entry',
    'Enhanced workflow automation',
    'Improved user experience',
    'Cost-effective solutions',
    '24/7 technical support'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      {/* Main Content */}
      <main className="pt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Partners
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We work with industry-leading partners to provide you with the best HR management solutions 
              and seamless integrations.
            </p>
          </div>

          {/* Partners Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Integration Partners</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((partner, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-lg text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="h-20 mb-4 flex items-center justify-center">
                    {imageErrors[partner.name] ? (
                      <div className="h-16 w-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white font-bold text-sm">
                        {partner.name}
                      </div>
                    ) : (
                      <img 
                        src={partner.logo} 
                        alt={`${partner.name} logo`}
                        className="max-h-16 max-w-full object-contain"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [partner.name]: true }))
                        }}
                      />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {partner.name}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {partner.description}
                  </p>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {partner.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Partnership Benefits */}
          <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Partnership Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnershipBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Become a Partner */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Become a Partner
              </h2>
              <p className="text-blue-100 mb-6">
                Join our partner ecosystem and help businesses streamline their HR processes.
              </p>
              <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
                Partner with Us
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}

export default Partners