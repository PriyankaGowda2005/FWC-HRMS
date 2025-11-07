import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Chatbot from '../components/Chatbot'
import { projects, getAllTags, filterProjects } from '../data/projects'
import { staggerContainer, itemFadeIn } from '../components/motionVariants'
import Icon from '../components/UI/Icon'

/**
 * Portfolio Page - Mastersolis Infotech Design System
 * Professional portfolio section with tag-based filtering
 */
const Portfolio = () => {
  const [activeFilters, setActiveFilters] = useState({
    industry: [],
    technology: [],
    projectType: []
  })

  const allTags = useMemo(() => getAllTags(), [])
  const filteredProjects = useMemo(() => filterProjects(activeFilters), [activeFilters])

  const toggleFilter = (category, tag) => {
    setActiveFilters(prev => {
      const currentTags = prev[category] || []
      const isActive = currentTags.includes(tag)
      
      return {
        ...prev,
        [category]: isActive
          ? currentTags.filter(t => t !== tag)
          : [...currentTags, tag]
      }
    })
  }

  const clearFilters = () => {
    setActiveFilters({
      industry: [],
      technology: [],
      projectType: []
    })
  }

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <NavBar />
      
      <main className="relative pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-12 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-semibold mb-8 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                Our Portfolio
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 font-heading leading-tight">
                Projects & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Portfolio</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
                Explore our portfolio of successful projects across various industries. 
                Each project showcases our expertise in delivering innovative solutions 
                that drive real business value.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 lg:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 lg:mb-0">
                  Filter Projects
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 transition-colors duration-200"
                  >
                    <Icon name="x" size="sm" />
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Industry Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Industry
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.industry.map(tag => {
                    const isActive = activeFilters.industry.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFilter('industry', tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Technology Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Technology
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.technology.map(tag => {
                    const isActive = activeFilters.technology.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFilter('technology', tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Project Type Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Project Type
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.projectType.map(tag => {
                    const isActive = activeFilters.projectType.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleFilter('projectType', tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-300">
                  Showing <span className="font-semibold text-white">{filteredProjects.length}</span> of{' '}
                  <span className="font-semibold text-white">{projects.length}</span> projects
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-12 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <AnimatePresence mode="wait">
              {filteredProjects.length > 0 ? (
                <motion.div
                  key="projects-grid"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      variants={itemFadeIn}
                      layout
                      className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 lg:p-8 h-full hover:bg-white/15 transition-all duration-300 group flex flex-col"
                    >
                      {/* Project Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                            {project.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          Completed: {formatDate(project.completionDate)}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-gray-300 mb-6 flex-grow leading-relaxed">
                        {project.description}
                      </p>

                      {/* Technologies */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3">Technologies Used:</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {[...project.tags.industry, ...project.tags.technology, ...project.tags.projectType].slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Highlight */}
                      <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-start gap-3">
                          <Icon name="star" size="sm" className="text-yellow-400 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Key Highlight:</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {project.highlight}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Outcome */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-start gap-3">
                          <Icon name="check" size="sm" className="text-green-400 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-2">Outcome:</h4>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {project.outcome}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Projects Found</h3>
                  <p className="text-gray-400 mb-6">
                    Try adjusting your filters to see more projects.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Next Project?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Let's discuss how we can help bring your vision to life with innovative 
                solutions tailored to your business needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                  onClick={() => window.location.href = '/contact'}
                >
                  Get in Touch
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-300"
                  onClick={() => window.location.href = '/what-we-do'}
                >
                  View Our Services
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}

export default Portfolio

