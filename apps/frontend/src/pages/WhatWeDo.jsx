import React from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Card from '../components/UI/Card'
import Icon from '../components/UI/Icon'
import { staggerContainer, itemFadeIn } from '../components/motionVariants'

/**
 * What We Do Page - FWC Design System
 * Showcases our comprehensive HRMS platform features and capabilities
 */
const WhatWeDo = () => {
  const coreFeatures = [
    {
      icon: 'users',
      title: 'Employee Management',
      description: 'Complete employee lifecycle management from onboarding to offboarding with automated workflows.',
      features: ['Employee Profiles', 'Onboarding Automation', 'Document Management', 'Performance Tracking']
    },
    {
      icon: 'chart',
      title: 'Analytics & Reporting',
      description: 'Real-time insights and customizable reports to drive data-driven HR decisions.',
      features: ['Real-time Dashboards', 'Custom Reports', 'Predictive Analytics', 'KPI Tracking']
    },
    {
      icon: 'clock',
      title: 'Time & Attendance',
      description: 'Advanced time tracking, shift management, and automated attendance monitoring.',
      features: ['Time Tracking', 'Shift Management', 'Attendance Monitoring', 'Overtime Calculation']
    },
    {
      icon: 'shield',
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with GDPR compliance and role-based access controls.',
      features: ['GDPR Compliance', 'Role-based Access', 'Audit Trails', 'Data Encryption']
    },
    {
      icon: 'zap',
      title: 'Performance Management',
      description: '360-degree reviews, goal setting, and continuous performance tracking.',
      features: ['360 Reviews', 'Goal Setting', 'Performance Tracking', 'Feedback Systems']
    },
    {
      icon: 'star',
      title: 'AI-Powered Insights',
      description: 'Machine learning algorithms for predictive analytics and intelligent recommendations.',
      features: ['Predictive Analytics', 'Smart Recommendations', 'Trend Analysis', 'Risk Assessment']
    }
  ]

  const solutions = [
    {
      title: 'Recruitment & Onboarding',
      description: 'Streamline your hiring process with AI-powered candidate screening and automated onboarding workflows.',
      icon: 'users',
      benefits: ['Faster Hiring', 'Better Candidate Matching', 'Reduced Time-to-Hire', 'Improved Onboarding Experience']
    },
    {
      title: 'Payroll Management',
      description: 'Automated payroll processing with tax calculations, benefits management, and compliance reporting.',
      icon: 'chart',
      benefits: ['Automated Processing', 'Tax Compliance', 'Benefits Management', 'Error Reduction']
    },
    {
      title: 'Leave Management',
      description: 'Comprehensive leave tracking with approval workflows, policy management, and calendar integration.',
      icon: 'clock',
      benefits: ['Automated Approvals', 'Policy Compliance', 'Calendar Integration', 'Leave Analytics']
    },
    {
      title: 'Performance Reviews',
      description: '360-degree performance reviews with goal tracking, feedback collection, and development planning.',
      icon: 'star',
      benefits: ['360 Reviews', 'Goal Tracking', 'Development Planning', 'Performance Analytics']
    }
  ]

  const technologies = [
    { name: 'Cloud Infrastructure', description: 'Scalable, secure cloud-based platform' },
    { name: 'AI & Machine Learning', description: 'Intelligent automation and predictive analytics' },
    { name: 'Mobile-First Design', description: 'Responsive design for all devices' },
    { name: 'API Integration', description: 'Seamless integration with existing systems' },
    { name: 'Real-time Analytics', description: 'Live dashboards and reporting' },
    { name: 'Enterprise Security', description: 'Bank-level security and compliance' }
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
                What We <span className="gradient-text">Do</span>
              </h1>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                We provide comprehensive Human Resource Management solutions that streamline operations, 
                boost productivity, and create exceptional employee experiences through cutting-edge technology.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Core Features Section */}
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
                Core Platform Features
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                Our comprehensive HRMS platform provides all the tools you need to manage your workforce 
                effectively and efficiently.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {coreFeatures.map((feature, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                          <Icon name={feature.icon} size="xl" className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-h4 font-semibold text-gray-900">{feature.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{feature.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Key Capabilities:</h4>
                        <ul className="space-y-1">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <Icon name="check" size="sm" className="text-green-500 mr-2" />
                              {item}
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

        {/* Solutions Section */}
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
                Complete HR Solutions
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                End-to-end HR solutions that address every aspect of workforce management 
                from recruitment to retirement.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {solutions.map((solution, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-primary-100 rounded-2xl flex items-center justify-center">
                          <Icon name={solution.icon} size="xl" className="text-accent-600" />
                        </div>
                        <div>
                          <h3 className="text-h4 font-semibold text-gray-900">{solution.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{solution.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Key Benefits:</h4>
                        <ul className="space-y-1">
                          {solution.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <Icon name="check" size="sm" className="text-green-500 mr-2" />
                              {benefit}
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

        {/* Technology Stack Section */}
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
                Powered by Advanced Technology
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                Built on cutting-edge technology to deliver performance, security, and scalability 
                that your organization needs.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {technologies.map((tech, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card className="text-center p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{tech.name}</h3>
                    <p className="text-sm text-gray-600">{tech.description}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary-900 to-accent-500">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-h2 font-bold text-white mb-4">
                Ready to Experience the Future of HR?
              </h2>
              <p className="text-body-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of organizations already using our platform to transform 
                their HR operations and create better employee experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-white text-primary-900 font-semibold rounded-lg shadow-fwc hover:shadow-fwc-lg transition-all duration-300"
                  onClick={() => window.location.href = '/login'}
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-900 transition-all duration-300"
                  onClick={() => window.location.href = '/contact'}
                >
                  Schedule Demo
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default WhatWeDo
