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
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-display font-bold text-gray-900 mb-6">
                Who We <span className="gradient-text">Serve</span>
              </h1>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                We empower organizations across diverse industries and sizes with comprehensive HR solutions 
                tailored to their unique needs and challenges.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 font-bold text-gray-900 mb-4">
                Industries We Serve
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
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
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                          <Icon name={industry.icon} size="xl" className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-h4 font-semibold text-gray-900">{industry.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{industry.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Key Features:</h4>
                        <ul className="space-y-1">
                          {industry.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <Icon name="check" size="sm" className="text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Organization Sizes Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 font-bold text-gray-900 mb-4">
                Organizations of All Sizes
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
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
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full text-center">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-h3 font-bold text-gray-900 mb-2">{org.size}</h3>
                        <p className="text-primary-600 font-semibold">{org.range}</p>
                      </div>
                      
                      <p className="text-gray-600">{org.description}</p>
                      
                      <div className="space-y-3">
                        {org.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center justify-center text-sm text-gray-600">
                            <Icon name="check" size="sm" className="text-green-500 mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Card variant="gradient" className="p-12">
                <h2 className="text-h2 font-bold text-gray-900 mb-4">
                  Ready to Transform Your HR Operations?
                </h2>
                <p className="text-body-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join thousands of organizations already using our platform to streamline 
                  their HR processes and create better employee experiences.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-lg shadow-fwc hover:shadow-fwc-lg transition-all duration-300"
                    onClick={() => window.location.href = '/login'}
                  >
                    Start Free Trial
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-500 hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/contact'}
                  >
                    Contact Sales
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WhoWeServe
