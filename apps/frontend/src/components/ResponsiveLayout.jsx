// Responsive Layout Component for consistent mobile-first design
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const ResponsiveLayout = ({ 
  children, 
  sidebar, 
  header, 
  footer,
  className = '',
  sidebarCollapsed = false,
  onSidebarToggle,
  mobileMenuOpen = false,
  onMobileMenuToggle
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={onMobileMenuToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors btn-touch"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">FWC HRMS</h1>
          </div>
          {header}
        </header>
      )}

      {/* Desktop Header */}
      {!isMobile && header && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          {header}
        </header>
      )}

      <div className="flex flex-1">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobile && mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onMobileMenuToggle}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                    <button
                      onClick={onMobileMenuToggle}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  {sidebar}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        {!isMobile && sidebar && (
          <aside className={`
            bg-white shadow-sm border-r border-gray-200 transition-all duration-300
            ${sidebarCollapsed ? 'w-16' : 'w-64'}
            ${isTablet ? 'w-16' : ''}
          `}>
            <div className="h-full overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`
          flex-1 flex flex-col min-h-screen
          ${isMobile ? 'pt-0' : ''}
        `}>
          {/* Content Area */}
          <div className="flex-1 container-responsive py-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <footer className="bg-white border-t border-gray-200 mt-auto">
              {footer}
            </footer>
          )}
        </main>
      </div>
    </div>
  )
}

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  className = ''
}) => {
  const getGridCols = () => {
    const { mobile, tablet, desktop } = cols
    return `
      grid-cols-${mobile}
      sm:grid-cols-${tablet}
      lg:grid-cols-${desktop}
    `
  }

  return (
    <div className={`grid ${getGridCols()} ${gap} ${className}`}>
      {children}
    </div>
  )
}

// Responsive Card Component
export const ResponsiveCard = ({ 
  children, 
  className = '',
  padding = 'p-responsive',
  shadow = 'shadow-sm',
  hover = true
}) => {
  return (
    <div className={`
      bg-white rounded-lg border border-gray-200
      ${padding}
      ${shadow}
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// Responsive Button Component
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 hover:bg-primary-700 text-white'
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white'
      default:
        return 'bg-primary-600 hover:bg-primary-700 text-white'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm'
      case 'md':
        return 'px-4 py-2 text-base'
      case 'lg':
        return 'px-6 py-3 text-lg'
      case 'touch':
        return 'px-4 py-3 text-base btn-touch'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  return (
    <button
      className={`
        rounded-lg font-medium transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

// Responsive Form Component
export const ResponsiveForm = ({ 
  children, 
  className = '',
  onSubmit,
  ...props
}) => {
  return (
    <form
      className={`space-y-6 ${className}`}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  )
}

// Responsive Form Field Component
export const ResponsiveFormField = ({ 
  label,
  error,
  required = false,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

// Responsive Input Component
export const ResponsiveInput = ({ 
  className = '',
  error = false,
  ...props
}) => {
  return (
    <input
      className={`
        w-full px-4 py-3 border rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
        transition-colors duration-200
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
        ${className}
      `}
      {...props}
    />
  )
}

// Responsive Table Component
export const ResponsiveTable = ({ 
  children, 
  className = '',
  striped = true,
  hover = true
}) => {
  return (
    <div className="overflow-x-auto">
      <table className={`
        min-w-full divide-y divide-gray-200
        ${striped ? 'bg-white' : ''}
        ${className}
      `}>
        {children}
      </table>
    </div>
  )
}

// Responsive Table Header Component
export const ResponsiveTableHeader = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  )
}

// Responsive Table Body Component
export const ResponsiveTableBody = ({ children, className = '' }) => {
  return (
    <tbody className={`
      bg-white divide-y divide-gray-200
      ${className}
    `}>
      {children}
    </tbody>
  )
}

// Responsive Table Row Component
export const ResponsiveTableRow = ({ 
  children, 
  className = '',
  hover = true,
  onClick
}) => {
  return (
    <tr 
      className={`
        ${hover ? 'hover:bg-gray-50 cursor-pointer' : ''}
        transition-colors duration-150
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

// Responsive Table Cell Component
export const ResponsiveTableCell = ({ 
  children, 
  className = '',
  header = false
}) => {
  const Component = header ? 'th' : 'td'
  
  return (
    <Component className={`
      ${header 
        ? 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' 
        : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'
      }
      ${className}
    `}>
      {children}
    </Component>
  )
}

// Responsive Modal Component
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-lg'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      default:
        return 'max-w-lg'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className={`
          relative bg-white rounded-lg shadow-xl w-full
          ${getSizeClasses()}
          ${className}
        `}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveLayout
