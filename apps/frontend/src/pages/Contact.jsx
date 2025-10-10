import React, { useState } from 'react'
import Footer from '../components/Footer'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    alert('Thank you for your message! We\'ll get back to you soon.')
  }

  const contactMethods = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      description: 'Get in touch via email',
      contact: 'hello@fwchrms.com',
      action: 'Send Email'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Phone',
      description: 'Call us directly',
      contact: '+1 (555) 123-4567',
      action: 'Call Now'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Office',
      description: 'Visit our headquarters',
      contact: '123 Business St, San Francisco, CA 94105',
      action: 'Get Directions'
    }
  ]

  const faqs = [
    {
      question: 'How do I get started with FWC HRMS?',
      answer: 'Getting started is easy! Sign up for a free trial, and our team will help you set up your account and import your employee data.'
    },
    {
      question: 'Do you offer training for new users?',
      answer: 'Yes, we provide comprehensive onboarding and training sessions for all new users, including live webinars and documentation.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer 24/7 email support, live chat during business hours, and phone support for enterprise customers.'
    },
    {
      question: 'Can I integrate FWC HRMS with my existing systems?',
      answer: 'Absolutely! We offer integrations with popular accounting software, time tracking tools, and other business applications.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">FWC HRMS</h1>
                <p className="text-sm text-gray-500">Human Resource Management System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about FWC HRMS? We're here to help! Get in touch with our team 
              and we'll get back to you as soon as possible.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg text-center">
                <div className="text-blue-600 mb-4 flex justify-center">
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {method.description}
                </p>
                <p className="text-gray-900 font-medium mb-4">
                  {method.contact}
                </p>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  {method.action} →
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="sales">Sales Question</option>
                      <option value="support">Technical Support</option>
                      <option value="demo">Request Demo</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Still have questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Check out our comprehensive help center or schedule a call with our team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                    Help Center
                  </button>
                  <button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                    Schedule Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Office Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Hours</h3>
                <p className="text-gray-600">Monday - Friday</p>
                <p className="text-gray-600">9:00 AM - 6:00 PM PST</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Hours</h3>
                <p className="text-gray-600">Monday - Friday</p>
                <p className="text-gray-600">8:00 AM - 7:00 PM PST</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Support</h3>
                <p className="text-gray-600">24/7 for Enterprise</p>
                <p className="text-gray-600">Critical Issues Only</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default Contact
