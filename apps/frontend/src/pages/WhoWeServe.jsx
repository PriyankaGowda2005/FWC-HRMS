import React from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Card from '../components/UI/Card'
import Icon from '../components/UI/Icon'
import { staggerContainer, itemFadeIn } from '../components/motionVariants'

/**
 * Who We Serve Page - FWC Design System
 * Showcases the industries and organizations we serve
 */
const WhoWeServe = () => {
  const industries = [
    {
      icon: 'fintech',
      title: 'Financial Technology',
      description: 'Secure, compliant HR solutions for fintech companies with advanced security protocols and regulatory compliance.',
      features: ['GDPR Compliance', 'Advanced Security', 'Audit Trails', 'Role-based Access']
    },
    {
      icon: 'manufacturing',
      title: 'Manufacturing',
      description: 'Comprehensive workforce management for manufacturing facilities with shift management and production optimization.',
      features: ['Shift Management', 'Production Tracking', 'Safety Compliance', 'Workforce Analytics']
    },
    {
      icon: 'healthcare',
      title: 'Healthcare',
      description: 'Specialized HR solutions for healthcare providers with compliance tracking and credential management.',
      features: ['Credential Tracking', 'Compliance Management', 'Staff Scheduling', 'Patient Safety']
    },
    {
      icon: 'retail',
      title: 'Retail & E-commerce',
      description: 'Multi-location workforce management for retail chains with seasonal staffing and inventory integration.',
      features: ['Multi-location Support', 'Seasonal Staffing', 'Inventory Integration', 'Customer Service']
    },
    {
      icon: 'banking',
      title: 'Banking & Finance',
      description: 'Enterprise-grade HR platform for banks with strict compliance requirements and risk management.',
      features: ['Risk Management', 'Compliance Reporting', 'Audit Controls', 'Enterprise Security']
    },
    {
      icon: 'edtech',
      title: 'Education Technology',
      description: 'Academic workforce management with tenure tracking, research collaboration, and student success metrics.',
      features: ['Tenure Tracking', 'Research Collaboration', 'Student Metrics', 'Academic Planning']
    }
  ]

  const organizationSizes = [
    {
      size: 'Startups',
      range: '1-50 employees',
      description: 'Perfect for growing startups that need scalable HR solutions without the complexity.',
      features: ['Quick Setup', 'Essential Features', 'Scalable Pricing', '24/7 Support']
    },
    {
      size: 'SMBs',
      range: '51-500 employees',
      description: 'Comprehensive HR management for small to medium businesses with advanced features.',
      features: ['Advanced Analytics', 'Custom Workflows', 'Integration APIs', 'Dedicated Support']
    },
    {
      size: 'Enterprise',
      range: '500+ employees',
      description: 'Enterprise-grade solutions with custom configurations and dedicated account management.',
      features: ['Custom Configuration', 'Dedicated Support', 'Advanced Security', 'Global Deployment']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <NavBar />
      
      <main className="relative pt-32">
        {/* Hero Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-semibold mb-8 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                Who We Serve
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 font-heading leading-tight">
                Who We <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Serve</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
                We empower organizations across diverse industries and sizes with comprehensive HR solutions tailored to their unique needs and challenges.
              </p>
              
              {/* Stats Section */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <motion.div variants={itemFadeIn} className="text-center group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">500+</div>
                    <div className="text-gray-300">Companies Served</div>
                  </div>
                </motion.div>
                <motion.div variants={itemFadeIn} className="text-center group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="text-4xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">50+</div>
                    <div className="text-gray-300">Industries</div>
                  </div>
                </motion.div>
                <motion.div variants={itemFadeIn} className="text-center group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="text-4xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">99.9%</div>
                    <div className="text-gray-300">Satisfaction Rate</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Industries We <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Serve</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our platform is designed to meet the specific requirements of various industries, 
                from highly regulated sectors to fast-paced technology companies.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {industries.map((industry, index) => (
                <motion.div key={index} variants={itemFadeIn} className="group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon name={industry.icon} size="xl" className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{industry.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 group-hover:text-white transition-colors">{industry.description}</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-white text-sm">Key Features:</h4>
                        <ul className="space-y-2">
                          {industry.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-300 group-hover:text-white transition-colors">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Organization Sizes Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Organizations of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">All Sizes</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                From startups to enterprise corporations, we provide scalable solutions 
                that grow with your organization.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {organizationSizes.map((org, index) => (
                <motion.div key={index} variants={itemFadeIn} className="group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 h-full text-center">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{org.size}</h3>
                        <p className="text-blue-400 font-semibold text-lg">{org.range}</p>
                      </div>
                      
                      <p className="text-gray-300 group-hover:text-white transition-colors">{org.description}</p>
                      
                      <div className="space-y-3">
                        {org.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center justify-center text-sm text-gray-300 group-hover:text-white transition-colors">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mr-3 group-hover:scale-125 transition-transform"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                    Ready to Transform Your HR Operations?
                  </h2>
                  <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                    Join thousands of organizations already using our platform to streamline 
                    their HR processes and create better employee experiences.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:bg-gray-100"
                      onClick={() => window.location.href = '/login'}
                    >
                      Start Free Trial
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300"
                      onClick={() => window.location.href = '/contact'}
                    >
                      Contact Sales
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WhoWeServe
