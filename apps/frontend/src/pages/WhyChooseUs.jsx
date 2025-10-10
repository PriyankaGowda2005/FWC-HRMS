import React from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Card from '../components/UI/Card'
import Icon from '../components/UI/Icon'
import { staggerContainer, itemFadeIn } from '../components/motionVariants'

/**
 * Why Choose Us Page - FWC Design System
 * Competitive advantages, benefits, and differentiators
 */
const WhyChooseUs = () => {
  const advantages = [
    {
      icon: 'zap',
      title: 'Lightning Fast Implementation',
      description: 'Get up and running in days, not months. Our streamlined onboarding process gets you started quickly.',
      metric: '7 days',
      metricLabel: 'Average Setup Time'
    },
    {
      icon: 'shield',
      title: 'Enterprise-Grade Security',
      description: 'Bank-level security with SOC 2 compliance, end-to-end encryption, and regular security audits.',
      metric: '99.9%',
      metricLabel: 'Security Uptime'
    },
    {
      icon: 'chart',
      title: 'AI-Powered Insights',
      description: 'Advanced analytics and machine learning provide actionable insights to improve your HR operations.',
      metric: '40%',
      metricLabel: 'Efficiency Improvement'
    },
    {
      icon: 'users',
      title: '24/7 Expert Support',
      description: 'Round-the-clock support from our team of HR and technology experts to help you succeed.',
      metric: '< 2 min',
      metricLabel: 'Response Time'
    },
    {
      icon: 'star',
      title: 'Proven Results',
      description: 'Join thousands of satisfied customers who have transformed their HR operations with our platform.',
      metric: '1000+',
      metricLabel: 'Happy Customers'
    },
    {
      icon: 'check',
      title: 'Easy Integration',
      description: 'Seamlessly integrate with your existing systems and workflows with our comprehensive API.',
      metric: '50+',
      metricLabel: 'Integrations Available'
    }
  ]

  const comparisons = [
    {
      feature: 'Setup Time',
      fwc: '7 days',
      competitor: '30-90 days',
      advantage: '4x faster'
    },
    {
      feature: 'User Training',
      fwc: '2 hours',
      competitor: '2-3 days',
      advantage: '12x faster'
    },
    {
      feature: 'Support Response',
      fwc: '< 2 minutes',
      competitor: '24-48 hours',
      advantage: '720x faster'
    },
    {
      feature: 'Feature Updates',
      fwc: 'Monthly',
      competitor: 'Quarterly',
      advantage: '3x more frequent'
    },
    {
      feature: 'Customization',
      fwc: 'Unlimited',
      competitor: 'Limited',
      advantage: 'Complete flexibility'
    },
    {
      feature: 'Mobile App',
      fwc: 'Included',
      competitor: 'Extra cost',
      advantage: 'No additional fees'
    }
  ]

  const testimonials = [
    {
      quote: "FWC HRMS transformed our HR operations completely. The AI insights helped us reduce hiring time by 50% and improve employee satisfaction significantly.",
      author: "Sarah Johnson",
      role: "CHRO, TechCorp Solutions",
      company: "TechCorp Solutions"
    },
    {
      quote: "The implementation was incredibly smooth. We were up and running in just 5 days, and our team was productive from day one.",
      author: "Michael Chen",
      role: "HR Director, Manufacturing Plus",
      company: "Manufacturing Plus"
    },
    {
      quote: "The support team is phenomenal. They're always available when we need help, and their expertise has been invaluable.",
      author: "Emily Rodriguez",
      role: "VP of People, HealthFirst Medical",
      company: "HealthFirst Medical"
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
                Why Choose <span className="gradient-text">FWC HRMS</span>
              </h1>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                Discover what makes us the preferred choice for organizations worldwide 
                looking to transform their HR operations.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Advantages Section */}
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
                Our Competitive Advantages
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                We don't just provide HR software – we deliver transformative solutions 
                that drive real business results.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {advantages.map((advantage, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                          <Icon name={advantage.icon} size="xl" className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-h4 font-semibold text-gray-900">{advantage.title}</h3>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">{advantage.description}</p>
                      
                      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-600 mb-1">{advantage.metric}</div>
                        <div className="text-sm text-gray-600">{advantage.metricLabel}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Comparison Section */}
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
                How We Compare
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                See how FWC HRMS outperforms traditional HR solutions across key metrics.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-fwc-lg overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600">FWC HRMS</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Competitors</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-green-600">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisons.map((comparison, index) => (
                      <motion.tr key={index} variants={itemFadeIn}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{comparison.feature}</td>
                        <td className="px-6 py-4 text-sm text-center text-primary-600 font-semibold">{comparison.fwc}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-600">{comparison.competitor}</td>
                        <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">{comparison.advantage}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
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
                What Our Customers Say
              </h2>
              <p className="text-body-lg text-gray-600 max-w-3xl mx-auto">
                Don't just take our word for it – hear from the organizations that have 
                transformed their HR operations with FWC HRMS.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={itemFadeIn}>
                  <Card variant="elevated" className="h-full">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Icon key={i} name="star" size="sm" className="text-yellow-400" />
                        ))}
                      </div>
                      
                      <blockquote className="text-gray-700 italic">
                        "{testimonial.quote}"
                      </blockquote>
                      
                      <div className="border-t pt-4">
                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                        <div className="text-sm text-primary-600 font-medium">{testimonial.company}</div>
                      </div>
                    </div>
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
                Ready to Experience the Difference?
              </h2>
              <p className="text-body-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of organizations that have chosen FWC HRMS to transform 
                their HR operations and achieve remarkable results.
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

export default WhyChooseUs
