/**
 * Portfolio Projects Data
 * Professional portfolio projects for Mastersolis Infotech
 * Structured for easy integration with filtering capabilities
 */

export const projects = [
  {
    id: 1,
    title: "Enterprise HRMS Platform",
    description: "A comprehensive Human Resource Management System built for large enterprises with 10,000+ employees. Features include automated payroll processing, performance management, recruitment automation, and AI-powered analytics.",
    completionDate: "2024-01-15",
    technologies: [
      "React",
      "Node.js",
      "MongoDB",
      "Express.js",
      "AI/ML",
      "Docker",
      "AWS"
    ],
    tags: {
      industry: ["Technology", "Enterprise"],
      technology: ["React", "Node.js", "MongoDB", "AI/ML"],
      projectType: ["Web Application", "Enterprise Software"]
    },
    highlight: "Reduced HR processing time by 65% and improved employee satisfaction scores by 40% through automation and AI-powered insights.",
    outcome: "Successfully deployed across 15+ locations, managing 12,000+ employees with 99.9% uptime. Client reported 45% reduction in administrative overhead and $2M annual cost savings."
  },
  {
    id: 2,
    title: "AI-Powered Recruitment System",
    description: "Intelligent recruitment platform with automated resume screening, candidate matching, and interview scheduling. Includes real-time video interview capabilities with AI-powered analysis and scoring.",
    completionDate: "2023-11-20",
    technologies: [
      "React",
      "Python",
      "TensorFlow",
      "WebRTC",
      "PostgreSQL",
      "Redis",
      "WebSocket"
    ],
    tags: {
      industry: ["Technology", "HR Tech"],
      technology: ["AI/ML", "React", "Python", "WebRTC"],
      projectType: ["Web Application", "AI Platform"]
    },
    highlight: "AI resume screening reduced hiring time by 70% and improved candidate quality match by 55% through intelligent skill matching and automated shortlisting.",
    outcome: "Processed 50,000+ applications with 95% accuracy in candidate matching. Client achieved 60% faster time-to-hire and 35% improvement in candidate quality."
  },
  {
    id: 3,
    title: "Healthcare Workforce Management",
    description: "Specialized HRMS solution for healthcare institutions with shift management, credential tracking, compliance monitoring, and HIPAA-compliant data handling. Includes mobile app for on-the-go access.",
    completionDate: "2023-09-10",
    technologies: [
      "React Native",
      "Node.js",
      "MongoDB",
      "HIPAA Compliance",
      "Push Notifications",
      "Biometric Integration"
    ],
    tags: {
      industry: ["Healthcare"],
      technology: ["React Native", "Node.js", "MongoDB"],
      projectType: ["Mobile Application", "Enterprise Software"]
    },
    highlight: "Streamlined shift scheduling for 5,000+ healthcare workers across 8 facilities, reducing scheduling conflicts by 80% and improving staff satisfaction.",
    outcome: "Deployed across 8 hospital facilities managing 5,200+ healthcare professionals. Achieved 100% HIPAA compliance, 85% reduction in scheduling errors, and 50% improvement in staff retention."
  },
  {
    id: 4,
    title: "Financial Services HR Analytics",
    description: "Advanced analytics and reporting platform for financial institutions with predictive workforce analytics, compliance reporting, and real-time dashboards. Includes integration with banking systems.",
    completionDate: "2023-07-25",
    technologies: [
      "React",
      "Python",
      "Tableau Integration",
      "PostgreSQL",
      "Apache Kafka",
      "Machine Learning",
      "Data Visualization"
    ],
    tags: {
      industry: ["Finance", "Banking"],
      technology: ["React", "Python", "Machine Learning", "Data Analytics"],
      projectType: ["Analytics Platform", "Enterprise Software"]
    },
    highlight: "Predictive analytics helped identify 30% of at-risk employees, enabling proactive retention strategies that reduced turnover by 25%.",
    outcome: "Implemented across 200+ branch locations. Delivered real-time insights reducing decision-making time by 60%. Client achieved $1.5M in retention cost savings and improved regulatory compliance scores."
  },
  {
    id: 5,
    title: "E-Learning Platform HR Integration",
    description: "Custom HRMS integration for a leading e-learning platform, connecting employee management with course completion tracking, skill development, and performance-based learning paths.",
    completionDate: "2023-05-18",
    technologies: [
      "React",
      "Node.js",
      "GraphQL",
      "MongoDB",
      "REST APIs",
      "Microservices",
      "Docker"
    ],
    tags: {
      industry: ["Education", "Technology"],
      technology: ["React", "Node.js", "GraphQL", "Microservices"],
      projectType: ["Integration", "Web Application"]
    },
    highlight: "Seamless integration enabled automatic skill tracking and personalized learning recommendations, increasing employee skill development by 45%.",
    outcome: "Integrated with existing e-learning platform serving 8,000+ employees. Achieved 90% employee engagement in skill development programs and 40% improvement in internal promotions."
  },
  {
    id: 6,
    title: "Retail Chain Workforce Optimization",
    description: "Multi-location retail workforce management system with attendance tracking, sales performance integration, and automated scheduling based on foot traffic predictions and sales forecasts.",
    completionDate: "2023-03-12",
    technologies: [
      "React",
      "Node.js",
      "MongoDB",
      "IoT Integration",
      "Predictive Analytics",
      "Mobile App",
      "Cloud Infrastructure"
    ],
    tags: {
      industry: ["Retail"],
      technology: ["React", "Node.js", "IoT", "Predictive Analytics"],
      projectType: ["Web Application", "Mobile Application"]
    },
    highlight: "AI-powered scheduling optimized workforce allocation, reducing labor costs by 20% while maintaining customer service quality across 150+ retail locations.",
    outcome: "Deployed across 150+ retail stores managing 8,500+ employees. Achieved 20% reduction in labor costs, 95% scheduling accuracy, and 30% improvement in employee satisfaction."
  },
  {
    id: 7,
    title: "Manufacturing Plant HR Automation",
    description: "Specialized HRMS for manufacturing with safety compliance tracking, training management, shift rotation automation, and integration with production systems for workforce planning.",
    completionDate: "2022-12-08",
    technologies: [
      "React",
      "Node.js",
      "PostgreSQL",
      "PLC Integration",
      "Safety Compliance",
      "Industrial IoT",
      "Real-time Monitoring"
    ],
    tags: {
      industry: ["Manufacturing"],
      technology: ["React", "Node.js", "IoT", "Industrial Automation"],
      projectType: ["Enterprise Software", "Industrial Automation"]
    },
    highlight: "Automated safety compliance tracking reduced safety incidents by 35% and ensured 100% compliance with industry regulations across all shifts.",
    outcome: "Implemented across 12 manufacturing plants with 6,000+ workers. Achieved 100% safety compliance, 35% reduction in incidents, and 25% improvement in production efficiency through optimized workforce planning."
  },
  {
    id: 8,
    title: "Government Agency HR Transformation",
    description: "Secure, compliant HRMS for government agency with advanced security features, audit trails, role-based access controls, and integration with government systems. Includes citizen service portal.",
    completionDate: "2022-10-22",
    technologies: [
      "React",
      "Node.js",
      "PostgreSQL",
      "Security Hardening",
      "SSO Integration",
      "Compliance Framework",
      "API Gateway"
    ],
    tags: {
      industry: ["Government", "Public Sector"],
      technology: ["React", "Node.js", "Security", "Compliance"],
      projectType: ["Enterprise Software", "Government Solution"]
    },
    highlight: "Enhanced security and compliance features achieved 100% audit compliance and zero security breaches, meeting all government security standards.",
    outcome: "Deployed for 3,500+ government employees. Achieved 100% compliance with government security standards, 80% reduction in manual processes, and improved citizen service response times by 50%."
  }
]

/**
 * Get all unique tags by category
 */
export const getAllTags = () => {
  const industryTags = new Set()
  const technologyTags = new Set()
  const projectTypeTags = new Set()

  projects.forEach(project => {
    project.tags.industry.forEach(tag => industryTags.add(tag))
    project.tags.technology.forEach(tag => technologyTags.add(tag))
    project.tags.projectType.forEach(tag => projectTypeTags.add(tag))
  })

  return {
    industry: Array.from(industryTags).sort(),
    technology: Array.from(technologyTags).sort(),
    projectType: Array.from(projectTypeTags).sort()
  }
}

/**
 * Filter projects based on active filters
 */
export const filterProjects = (activeFilters) => {
  const { industry, technology, projectType } = activeFilters

  return projects.filter(project => {
    // If no filters are active, show all projects
    const hasIndustryFilter = industry.length > 0
    const hasTechnologyFilter = technology.length > 0
    const hasProjectTypeFilter = projectType.length > 0

    if (!hasIndustryFilter && !hasTechnologyFilter && !hasProjectTypeFilter) {
      return true
    }

    // Check industry filter
    const matchesIndustry = !hasIndustryFilter || 
      project.tags.industry.some(tag => industry.includes(tag))

    // Check technology filter
    const matchesTechnology = !hasTechnologyFilter || 
      project.tags.technology.some(tag => technology.includes(tag))

    // Check project type filter
    const matchesProjectType = !hasProjectTypeFilter || 
      project.tags.projectType.some(tag => projectType.includes(tag))

    // Project must match all active filter categories (AND logic)
    // But within each category, any tag match is sufficient (OR logic)
    return matchesIndustry && matchesTechnology && matchesProjectType
  })
}

/**
 * Get project by ID
 */
export const getProjectById = (id) => {
  return projects.find(project => project.id === id)
}

/**
 * Get projects by industry
 */
export const getProjectsByIndustry = (industry) => {
  return projects.filter(project => 
    project.tags.industry.includes(industry)
  )
}

/**
 * Get projects by technology
 */
export const getProjectsByTechnology = (technology) => {
  return projects.filter(project => 
    project.tags.technology.includes(technology)
  )
}

/**
 * Get projects by project type
 */
export const getProjectsByProjectType = (projectType) => {
  return projects.filter(project => 
    project.tags.projectType.includes(projectType)
  )
}

export default projects
