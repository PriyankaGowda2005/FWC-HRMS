import React from 'react'
import Footer from '../components/Footer'

const About = () => {
  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      bio: 'Former HR Director with 15+ years experience in enterprise HR management.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      bio: 'Tech leader with expertise in scalable SaaS platforms and AI integration.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      bio: 'Product strategist focused on user experience and HR workflow optimization.'
    },
    {
      name: 'David Kim',
      role: 'Head of Engineering',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
      bio: 'Full-stack engineer passionate about building robust and scalable systems.'
    }
  ]

  const milestones = [
    { year: '2020', event: 'FWC HRMS founded with vision to simplify HR management' },
    { year: '2021', event: 'Launched MVP with core employee management features' },
    { year: '2022', event: 'Reached 1,000+ active users across 50+ companies' },
    { year: '2023', event: 'Introduced AI-powered features and advanced analytics' },
    { year: '2024', event: 'Expanded globally with multi-language support' }
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
              About FWC HRMS
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to revolutionize human resource management by making it simple, 
              efficient, and accessible for businesses of all sizes.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  At FWC HRMS, we believe that managing human resources shouldn't be complicated. 
                  Our mission is to provide businesses with intuitive, powerful tools that streamline 
                  HR processes and empower teams to focus on what matters most - their people.
                </p>
                <p className="text-gray-600">
                  We're committed to creating software that grows with your business, adapts to 
                  your needs, and makes HR management a seamless part of your daily operations.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Values</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Simplicity in design and functionality
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Security and privacy first
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Continuous innovation
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Customer-centric approach
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Meet Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-lg text-center">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-gray-600">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white rounded-lg p-8 shadow-lg mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Our Journey
            </h2>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="ml-6">
                    <p className="text-gray-900 font-medium">
                      {milestone.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">5,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-gray-600">Companies</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Join Our Mission
              </h2>
              <p className="text-blue-100 mb-6">
                Be part of the future of HR management. Experience the difference with FWC HRMS.
              </p>
              <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
                Get Started Today
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default About
