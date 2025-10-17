import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Icon from './UI/Icon'
import { staggerContainer, itemFadeIn } from './motionVariants'

/**
 * Footer Link Component
 * Individual footer link with hover effects and proper navigation handling
 */
const FooterLink = ({ href, children, external = false, ...props }) => {
  if (external) {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm cursor-pointer"
          {...props}
        >
          {children}
        </a>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={href}
        className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm cursor-pointer"
        {...props}
      >
        {children}
      </Link>
    </motion.div>
  )
}

/**
 * Social Link Component
 * Social media link with icon and hover animation
 */
const SocialLink = ({ href, icon, label }) => {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      className="w-10 h-10 bg-gray-100 hover:bg-primary-100 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <Icon name={icon} size="md" />
    </motion.a>
  )
}

/**
 * Footer Component - FWC Design System
 * Multi-column footer with office addresses, social links, and company information
 */
const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Product',
      links: [
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/integrations', label: 'Integrations' },
        { href: '/api', label: 'API' },
        { href: '/security', label: 'Security' },
        { href: '/roadmap', label: 'Roadmap' }
      ]
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '/careers', label: 'Careers' },
        { href: '/press', label: 'Press' },
        { href: '/blog', label: 'Blog' },
        { href: '/partners', label: 'Partners' },
        { href: '/contact', label: 'Contact' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/help-center', label: 'Help Center' },
        { href: '/documentation', label: 'Documentation' },
        { href: '/support', label: 'Support' },
        { href: '/blog', label: 'Blog' },
        { href: '/api', label: 'API' },
        { href: '/style-guide', label: 'Style Guide' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/security', label: 'Security' },
        { href: '/about', label: 'About Us' },
        { href: '/contact', label: 'Contact' }
      ]
    }
  ]

  const offices = [
    {
      city: 'New York',
      address: '123 Business Ave, Suite 100',
      details: 'New York, NY 10001, USA'
    },
    {
      city: 'London',
      address: '45 Innovation Street',
      details: 'London EC1A 4HD, UK'
    },
    {
      city: 'Singapore',
      address: '78 Tech Hub Plaza',
      details: 'Singapore 018956'
    }
  ]

  const socialLinks = [
    { href: 'https://linkedin.com/company/fwc-hrms', icon: 'linkedin', label: 'LinkedIn' },
    { href: 'https://twitter.com/fwc_hrms', icon: 'twitter', label: 'Twitter' },
    { href: 'https://facebook.com/fwc.hrms', icon: 'facebook', label: 'Facebook' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
            {/* Company Info */}
            <motion.div
              variants={itemFadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="lg:col-span-4 space-y-6"
            >
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold font-heading">FWC HRMS</span>
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed max-w-md">
                Empowering organizations worldwide with comprehensive Human Resource Management 
                solutions that streamline operations and enhance employee experiences.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <SocialLink
                    key={social.icon}
                    href={social.href}
                    icon={social.icon}
                    label={social.label}
                  />
                ))}
              </div>
            </motion.div>

            {/* Footer Sections */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8"
            >
              {footerSections.map((section, index) => (
                <motion.div key={section.title} variants={itemFadeIn}>
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <FooterLink href={link.href}>
                          {link.label}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Office Locations */}
          <motion.div
            variants={itemFadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-gray-800"
          >
            <h3 className="text-lg font-semibold mb-6 text-white">Our Offices</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {offices.map((office, index) => (
                <motion.div
                  key={office.city}
                  variants={itemFadeIn}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <h4 className="font-semibold text-primary-400">{office.city}</h4>
                  <p className="text-gray-300 text-sm">{office.address}</p>
                  <p className="text-gray-400 text-sm">{office.details}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemFadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="py-6 border-t border-gray-800"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} FWC HRMS. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Made with ❤️ for HR professionals</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer