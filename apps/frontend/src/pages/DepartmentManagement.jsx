import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { departmentAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const DepartmentManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  // Fetch departments
  const { data: departmentsData, isLoading, error } = useQuery(
    'departments',
    () => departmentAPI.getDepartments(),
    {
      keepPreviousData: true,
    }
  )

  // Add department mutation
  const addDepartmentMutation = useMutation(
    (data) => departmentAPI.createDepartment(data),
    {
      onSuccess: () => {
        toast.success('Department created successfully')
        queryClient.invalidateQueries('departments')
        setShowAddModal(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create department')
      }
    }
  )

  // Update department mutation
  const updateDepartmentMutation = useMutation(
    ({ id, data }) => departmentAPI.updateDepartment(id, data),
    {
      onSuccess: () => {
        toast.success('Department updated successfully')
        queryClient.invalidateQueries('departments')
        setShowEditModal(false)
        setSelectedDepartment(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update department')
      }
    }
  )

  // Delete department mutation
  const deleteDepartmentMutation = useMutation(
    (id) => departmentAPI.deleteDepartment(id),
    {
      onSuccess: () => {
        toast.success('Department deleted successfully')
        queryClient.invalidateQueries('departments')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete department')
      }
    }
  )

  const handleAddDepartment = (data) => {
    addDepartmentMutation.mutate(data)
  }

  const handleUpdateDepartment = (data) => {
    updateDepartmentMutation.mutate({ id: selectedDepartment._id, data })
  }

  const handleDeleteDepartment = (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      deleteDepartmentMutation.mutate(departmentId)
    }
  }

  const handleEditDepartment = (department) => {
    setSelectedDepartment(department)
    setShowEditModal(true)
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading departments</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  const departments = departmentsData?.departments || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Department Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational departments and their configurations
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Department
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Departments</h3>
          <p className="text-3xl font-bold text-blue-600">{departments.length}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Active Departments</h3>
          <p className="text-3xl font-bold text-green-600">
            {departments.filter(d => d.isActive).length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Employees</h3>
          <p className="text-3xl font-bold text-purple-600">
            {departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Budget</h3>
          <p className="text-3xl font-bold text-orange-600">
            ${departments.reduce((sum, d) => sum + (d.budget || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Departments Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Departments</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => exportDepartments(departments)}
              className="btn-secondary"
              disabled={departments.length === 0}
            >
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {department.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {department.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {department.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {department.managerName || 'No manager assigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {department.employeeCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${(department.budget || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(user?.role === 'ADMIN' || user?.role === 'HR') && (
                        <>
                          <button
                            onClick={() => handleEditDepartment(department)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(department._id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteDepartmentMutation.isLoading}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <DepartmentModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDepartment}
          isLoading={addDepartmentMutation.isLoading}
        />
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => {
            setShowEditModal(false)
            setSelectedDepartment(null)
          }}
          onSubmit={handleUpdateDepartment}
          isLoading={updateDepartmentMutation.isLoading}
        />
      )}
    </div>
  )
}

// Department Modal Component
const DepartmentModal = ({ department, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
    budget: department?.budget || '',
    managerId: department?.managerId || '',
    isActive: department?.isActive !== undefined ? department.isActive : true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {department ? 'Edit Department' : 'Add New Department'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Budget
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active Department
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (department ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Export function
const exportDepartments = (departments) => {
  try {
    const csvContent = generateDepartmentsCSV(departments)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `departments_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Departments data exported successfully')
  } catch (error) {
    toast.error('Failed to export departments data')
  }
}

// Helper function to generate CSV
const generateDepartmentsCSV = (departments) => {
  const headers = ['Name', 'Description', 'Manager', 'Employees', 'Budget', 'Status', 'Created At']
  const csvRows = [headers.join(',')]
  
  departments.forEach(dept => {
    const row = [
      dept.name,
      dept.description || 'N/A',
      dept.managerName || 'N/A',
      dept.employeeCount || 0,
      dept.budget || 0,
      dept.isActive ? 'Active' : 'Inactive',
      new Date(dept.createdAt).toLocaleDateString()
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}

export default DepartmentManagement
