import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Dialog } from '@headlessui/react'
import Button from './UI/Button'
import Icon from './UI/Icon'
import Logo from './Logo'

/**
 * NavBar Component - FWC Design System
 * Sticky navigation with backdrop blur and mobile menu
 */
const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Who we serve', href: '/who-we-serve' },
    { name: 'What we do', href: '/what-we-do' },
    { name: 'Who we are', href: '/who-we-are' },
    { name: 'Why choose us', href: '/why-choose-us' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white shadow-2xl border-b border-gray-200' 
          : 'bg-white shadow-lg'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Global">
        {/* Logo Section */}
        <div className="flex lg:flex-1">
          <Logo size="xl" href="/" />
        </div>
        
        {/* Mobile Menu Button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-xl p-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open main menu"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-1 xl:gap-x-2">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              to={item.href} 
              className="relative text-base font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-all duration-300 px-4 py-2.5 rounded-lg hover:bg-blue-50/80 group"
            >
              <span className="relative z-10">{item.name}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
          ))}
        </div>
        
        {/* Desktop CTA Button */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:ml-8">
          <Button 
            className="text-base px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border-0" 
            onClick={() => window.location.href = '/login'}
          >
            Get Started
          </Button>
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-4 py-6 sm:px-6 sm:max-w-sm shadow-2xl">
          <div className="flex items-center justify-between">
            <div onClick={() => setMobileMenuOpen(false)}>
              <Logo size="lg" href="/" />
            </div>
            <button
              type="button"
              className="-m-2.5 rounded-xl p-2.5 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close main menu"
            >
              <span className="sr-only">Close menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-8 flow-root">
            <div className="-my-6 divide-y divide-gray-200/50">
              <div className="space-y-1 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-mx-3 block rounded-lg px-4 py-3 text-lg font-semibold leading-7 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <Button 
                  className="w-full text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" 
                  onClick={() => { window.location.href = '/login'; setMobileMenuOpen(false); }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </motion.header>
  )
}

export default NavBar