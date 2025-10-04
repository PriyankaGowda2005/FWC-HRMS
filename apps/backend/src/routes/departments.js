const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateQuery, validateSchema } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(verifyToken);

// Validation schemas
const departmentCreateSchema = {
  body: [
    body('name').notEmpty().withMessage('Department name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('costCenter').optional().isLength({ max: 20 }).withMessage('Cost center too long'),
    body('budget').optional().isFloat({ gt: 0 }).withMessage('Budget must be positive'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location too long'),
    body('parentDepartmentId').optional().isMongoId().withMessage('Invalid parent department ID'),
    body('managerId').optional().isMongoId().withMessage('Invalid manager ID')
  ]
};

const departmentUpdateSchema = {
  body: [
    body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('costCenter').optional().isLength({ max: 20 }).withMessage('Cost center too long'),
    body('budget').optional().isFloat({ gt: 0 }).withMessage('Budget must be positive'),
    body('location').optional().isLength({ max: 100 }).withMessage('Location too long'),
    body('parentDepartmentId').optional().isMongoId().withMessage('Invalid parent department ID'),
    body('managerId').optional().isMongoId().withMessage('Invalid manager ID'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ]
};

// Query validation
const querySchema = {
  query: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    query('sortBy').optional().isIn(['name', 'createdAt', 'budget', 'employeeCount']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ]
};

// Get all departments with filtering, pagination, and sorting
router.get('/', [
  ...querySchema.query,
  validateQuery(require('../middleware/validation').commonSchemas.pagination)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { page, limit, search, isActive, sortBy = 'name', sortOrder = 'asc' } = req.validatedQuery;

  // Build where clause
  const where = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Build order clause
  const orderBy = {};
  if (sortBy === 'employeeCount') {
    // For employee count, we'll need a different approach
    orderBy.employees = { _count: sortOrder };
  } else {
    orderBy[sortBy] = sortOrder;
  }

  const skip = (page - 1) * limit;

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      skip,
      take: limit,
      where,
      orderBy: sortBy === 'employeeCount' 
        ? { employees: { _count: sortOrder } }
        : { [sortBy]: sortOrder },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true
          }
        },
        parentDepartment: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            employees: true,
            subDepartments: true
          }
        }
      }
    }),
    prisma.department.count({ where })
  ]);

  res.json({
    departments: departments.map(dept => ({
      ...dept,
      employeeCount: dept._count.employees,
      subDepartmentCount: dept._count.subDepartments
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get department by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid department ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      },
      parentDepartment: {
        select: {
          id: true,
          name: true,
          description: true
        }
      },
      employees: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          isActive: true,
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      },
      subDepartments: {
        select: {
          id: true,
          name: true,
          description: true,
          budget: true,
          _计数: {
            select: {
              employees: true
            }
          }
        }
      },
      _计数: {
        select: {
          employees: true,
          subDepartments: true
        }
      }
    }
  });

  if (!department) {
    return res.status(404).json({ message: 'Department not found' });
  }

  res.json({
    ...department,
    employeeCount: department._计数.employees,
    subDepartmentCount: department._计数.subDepartments
  });
}));

// Create department (Admin/HR only)
router.post('/', [
  checkRole('ADMIN', 'HR'),
  ...departmentCreateSchema.body,
  validateSchema(require('../middleware/validation'))
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { 
    name, description, costCenter, budget, location, 
    parentDepartmentId, managerId 
  } = req.body;

  // Check if department name already exists
  const existingDept = await prisma.department.findFirst({
    where: { name }
  });

  if (existingDept) {
    return res.status(400).json({ 
      message: 'Department with this name already exists' 
    });
  }

  // Validate parent department exists
  if (parentDepartmentId) {
    const parentDept = await prisma.department.findUnique({
      where: { id: parentDepartmentId }
    });
    if (!parentDept) {
      return res.status(400).json({ 
        message: 'Parent department not found' 
      });
    }
  }

  // Validate manager exists
  if (managerId) {
    const manager = await prisma.employee.findUnique({
      where: { id: managerId }
    });
    if (!manager) {
      return res.status(400).json({ 
        message: 'Manager not found' 
      });
    }
  }

  const department = await prisma.department.create({
    data: {
      name,
      description,
      costCenter,
      budget,
      location,
      parentDepartmentId,
      managerId
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true
        }
      },
      parentDepartment: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.status(201).json({
    message: 'Department created successfully',
    department
  });
}));

// Update department (Admin/HR only)
router.put('/:id', [
  checkRole('ADMIN', 'HR'),
  param('id').isMongoId().withMessage('Invalid department ID'),
  ...departmentUpdateSchema.body,
  validateSchema(require('../middleware/validation'))
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = {};

  // Filter allowed fields
  const allowedFields = [
    'name', 'description', 'costCenter', 'budget', 'location', 
    'parentDepartmentId', 'managerId', 'isActive'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Check if department exists
  const existingDept = await prisma.department.findUnique({
    where: { id }
  });

  if (!existingDept) {
    return res.status(404).json({ 
      message: 'Department not found' 
    });
  }

  // Check if new name conflicts with existing departments
  if (updateData.name && updateData.name !== existingDept.name) {
    const conflictDept = await prisma.department.findFirst({
      where: { 
        name: updateData.name,
        id: { not: id }
      }
    });

    if (conflictDept) {
      return res.status(400).json({ 
        message: 'Department with this name already exists' 
      });
    }
  }

  // Validate parent department (prevent circular references)
  if (updateData.parentDepartmentId) {
    if (updateData.parentDepartmentId === id) {
      return res.status(400).json({ 
        message: 'Department cannot be its own parent' 
      });
    }

    const parentDept = await prisma.department.findUnique({
      where: { id: updateData.parentDepartmentId }
    });
    if (!parentDept) {
      return res.status(400).json({ 
        message: 'Parent department not found' 
      });
    }
  }

  const department = await prisma.department.update({
    where: { id },
    data: updateData,
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true
        }
      },
      parentDepartment: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  res.json({
    message: 'Department updated successfully',
    department
  });
}));

// Delete department (Admin only)
router.delete('/:id', [
  checkRole('ADMIN'),
  param('id').isMongoId().withMessage('Invalid department ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { id } = req.params;

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      _计数: {
        select: {
          employees: true,
          subDepartments: true
        }
      }
    }
  });

  if (!department) {
    return res.status(404).json({ 
      message: 'Department not found' 
    });
  }

  // Can't delete if has employees
  if (department._计数.employees > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete department with employees. Please reassign employees first.' 
    });
  }

  // Can't delete if has sub-departments
  if (department._计数.subDepartments > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete department with sub-departments. Please delete or move sub-departments first.' 
    });
  }

  await prisma.department.delete({
    where: { id }
  });

  res.json({ 
    message: 'Department deleted successfully' 
  });
}));

// Get department hierarchy
router.get('/hierarchy/tree', asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      parentDepartmentId: true,
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      _计数: {
        select: {
          employees: true
        }
      }
    }
  });

  // Build hierarchy tree
  const buildHierarchy = (parentId = null) => {
    return departments
      .filter(dept => dept.parentDepartmentId === parentId)
      .map(dept => ({
        ...dept,
        employeeCount: dept._计数.employees,
        children: buildHierarchy(dept.id)
      }));
  };

  const hierarchy = buildHierarchy();

  res.json({
    departments: hierarchy,
    flatView: departments.map(dept => ({
      ...dept,
      employeeCount: dept._计数.employees
    }))
  });
}));

module.exports = router;
