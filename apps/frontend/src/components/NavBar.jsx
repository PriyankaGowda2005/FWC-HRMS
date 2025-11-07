import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Dialog } from '@headlessui/react'
import Button from './UI/Button'
import Icon from './UI/Icon'

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
    { name: 'Home', href: '/' },
    { name: 'Who we serve', href: '/who-we-serve' },
    { name: 'What we do', href: '/what-we-do' },
    { name: 'Who we are', href: '/who-we-are' },
    { name: 'Why choose us', href: '/why-choose-us' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white shadow-lg'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link 
            to="/" 
            className="-m-1.5 p-1.5 flex items-center group transition-all duration-200 hover:scale-105"
            title="Go to Home Page"
          >
            <span className="sr-only">FWC HRMS - Go to Home</span>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <span className="text-white font-bold text-lg sm:text-xl">F</span>
            </div>
            <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              FWC HRMS
            </span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open main menu"
          >
            <span className="sr-only">Open main menu</span>
            <Icon name="menu" size="md" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-8 xl:gap-x-12">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              to={item.href} 
              className="text-sm font-medium leading-6 text-gray-900 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
          <Button variant="secondary" className="text-sm px-3 py-2 xl:px-4" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
          <Button className="text-sm px-3 py-2 xl:px-4" onClick={() => window.location.href = '/login'}>
            Get Started
          </Button>
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-50" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-4 py-6 sm:px-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="-m-1.5 p-1.5 flex items-center group transition-all duration-200 hover:scale-105"
              title="Go to Home Page"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">FWC HRMS - Go to Home</span>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <span className="text-white font-bold text-lg sm:text-xl">F</span>
              </div>
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                FWC HRMS
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close main menu"
            >
              <span className="sr-only">Close menu</span>
              <Icon name="close" size="md" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-1 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6 space-y-3">
                <Button variant="secondary" className="w-full" onClick={() => { window.location.href = '/login'; setMobileMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button className="w-full" onClick={() => { window.location.href = '/login'; setMobileMenuOpen(false); }}>
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