import React from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Card from '../components/UI/Card'
import Icon from '../components/UI/Icon'
import { staggerContainer, itemFadeIn } from '../components/motionVariants'

/**
 * Who We Are Page - FWC Design System
 * Company information, team, mission, and values
 */
const WhoWeAre = () => {
  const values = [
    {
      icon: 'star',
      title: 'Innovation',
      description: 'We continuously push the boundaries of HR technology to deliver cutting-edge solutions.',
      color: 'from-yellow-100 to-yellow-200'
    },
    {
      icon: 'users',
      title: 'People-First',
      description: 'We believe that great technology should enhance human potential, not replace it.',
      color: 'from-blue-100 to-blue-200'
    },
    {
      icon: 'shield',
      title: 'Trust & Security',
      description: 'We prioritize data security and privacy in everything we build and deliver.',
      color: 'from-green-100 to-green-200'
    },
    {
      icon: 'zap',
      title: 'Excellence',
      description: 'We strive for excellence in every interaction, feature, and customer experience.',
      color: 'from-purple-100 to-purple-200'
    }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Chief Executive Officer',
      bio: 'Former VP of HR at Fortune 500 companies with 15+ years of experience in workforce management.',
      image: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Chief Technology Officer',
      bio: 'Tech veteran with expertise in AI, machine learning, and scalable cloud architectures.',
      image: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      bio: 'Product strategist focused on creating intuitive user experiences and innovative features.',
      image: 'ER'
    },
    {
      name: 'David Park',
      role: 'Head of Customer Success',
      bio: 'Customer advocate with deep understanding of HR challenges and solution implementation.',
      image: 'DP'
    }
  ]

  const milestones = [
    { year: '2020', event: 'Company Founded', description: 'Started with a vision to revolutionize HR technology' },
    { year: '2021', event: 'First Product Launch', description: 'Launched our core HRMS platform with 100+ features' },
    { year: '2022', event: 'AI Integration', description: 'Introduced AI-powered insights and automation capabilities' },
    { year: '2023', event: 'Global Expansion', description: 'Expanded to serve customers across 25+ countries' },
    { year: '2024', event: 'Enterprise Growth', description: 'Reached 1000+ enterprise customers worldwide' },
    { year: '2025', event: 'Future Vision', description: 'Continuing to innovate with next-generation HR solutions' }
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
                Who We <span className="gradient-text">Are</span>
              </h1>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                We are a team of passionate innovators, technologists, and HR experts dedicated to 
                transforming how organizations manage and empower their workforce.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-h2 font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-body-lg text-gray-600 mb-6">
                  To empower organizations worldwide with intelligent HR solutions that streamline operations, 
                  boost productivity, and create exceptional employee experiences through cutting-edge technology.
                </p>
                <p className="text-gray-600 mb-8">
                  We believe that great technology should enhance human potential, not replace it. 
                  Our platform is designed to make HR professionals more effective and employees more engaged.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-lg shadow-fwc hover:shadow-fwc-lg transition-all duration-300"
                    onClick={() => window.location.href = '/login'}
                  >
                    Join Our Mission
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-500 hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/careers'}
                  >
                    View Careers
                  </motion.button>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                  <Icon name="users" size="2xl" className="text-primary-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                These core values guide everything we do, from product development to customer service.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {values.map((value, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full text-center">
                    <div className="space-y-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mx-auto`}>
                        <Icon name={value.icon} size="xl" className="text-gray-700" />
                      </div>
                      <h3 className="text-h4 font-semibold text-gray-900">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 font-bold text-gray-900 mb-4">Meet Our Leadership</h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                Our diverse team of leaders brings together decades of experience in technology, 
                HR, and business strategy.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {team.map((member, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full text-center">
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-xl">{member.image}</span>
                      </div>
                      <div>
                        <h3 className="text-h4 font-semibold text-gray-900 mb-1">{member.name}</h3>
                        <p className="text-primary-600 font-medium">{member.role}</p>
                      </div>
                      <p className="text-gray-600 text-sm">{member.bio}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 font-bold text-gray-900 mb-4">Our Journey</h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                From startup to industry leader, here's how we've grown and evolved over the years.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {milestones.map((milestone, index) => (
                <motion.div key={index} variants={itemFadeIn} className="flex items-center space-x-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{milestone.year}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h4 font-semibold text-gray-900 mb-2">{milestone.event}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
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
                  Ready to Join Our Story?
                </h2>
                <p className="text-body-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Whether you're looking to transform your HR operations or join our team, 
                  we'd love to hear from you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-lg shadow-fwc hover:shadow-fwc-lg transition-all duration-300"
                    onClick={() => window.location.href = '/login'}
                  >
                    Get Started Today
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 border-2 border-primary-500 text-primary-500 font-semibold rounded-lg hover:bg-primary-500 hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/contact'}
                  >
                    Contact Us
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

export default WhoWeAre
