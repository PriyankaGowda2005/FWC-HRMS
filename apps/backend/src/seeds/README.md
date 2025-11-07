# Database Seed Scripts

This directory contains scripts to populate the database with sample data for development and demonstration purposes.

## Available Seed Scripts

### 1. `comprehensiveSeedData.js` - Complete Sample Data
**Recommended for demos and testing**

This script creates comprehensive sample data for all modules:

- ✅ **5 Departments**: HR, IT, Finance, Marketing, Sales
- ✅ **10 Employees**: Admin, HR Manager, 3 Managers, 5 Employees with different roles
- ✅ **Attendance Records**: Past month attendance for all employees
- ✅ **Leave Requests**: Approved, pending, and rejected leave requests
- ✅ **Payroll Records**: Last 3 months payroll for all employees
- ✅ **Recruitment Data**: Job postings, candidates, applications, interviews
- ✅ **Performance Reviews**: Sample performance reviews for employees
- ✅ **Summary Reports**: Attendance, leave, payroll, and performance summaries

**Usage:**
```bash
cd apps/backend
npm run db:seed-comprehensive
```

### 2. `seedData.js` - Basic Seed Data
Creates basic departments, users (Admin & HR), and job postings.

**Usage:**
```bash
cd apps/backend
npm run db:seed
```

### 3. `createAllDemoUsers.js` - Demo Users Only
Creates/updates demo users with login credentials.

**Usage:**
```bash
cd apps/backend
npm run db:create-demo-users
```

## Login Credentials (After Running Comprehensive Seed)

After running the comprehensive seed script, you can log in with:

- **Admin**: `admin@mastersolisinfotech.com` / `admin123`
- **HR Manager**: `hr@mastersolisinfotech.com` / `HR@2024!`
- **IT Manager**: `manager@mastersolisinfotech.com` / `manager123`
- **Finance Manager**: `finance.manager@mastersolisinfotech.com` / `finance123`
- **Marketing Manager**: `marketing.manager@mastersolisinfotech.com` / `marketing123`
- **Employee (IT)**: `employee@mastersolisinfotech.com` / `employee123`
- **Employee (IT)**: `jane.smith@mastersolisinfotech.com` / `employee123`
- **Employee (Finance)**: `robert.brown@mastersolisinfotech.com` / `employee123`
- **Employee (Marketing)**: `lisa.anderson@mastersolisinfotech.com` / `employee123`
- **Employee (HR)**: `james.wilson@mastersolisinfotech.com` / `employee123`
- **Candidate**: `candidate.demo@mastersolisinfotech.com` / `candidate123`

## Sample Data Details

### Employees
- 1 Admin (System Administrator)
- 1 HR Manager
- 3 Managers (IT, Finance, Marketing)
- 5 Employees across different departments

### Attendance
- Past month attendance records for all employees
- Includes present, absent, sick, and late entries
- Some work-from-home days included

### Leave Requests
- Mix of approved, pending, and rejected requests
- Different leave types: Vacation, Sick, Personal

### Payroll
- Last 3 months of payroll records
- Includes salary, deductions, and net pay calculations

### Recruitment
- 3 active job postings
- 3 candidates with applications
- Interview records

### Performance Reviews
- Sample reviews for IT and Finance employees
- Includes ratings, strengths, areas for improvement, and goals

## Notes

- The comprehensive seed script will create realistic relationships between data
- Manager-employee relationships are properly set up
- All data includes proper timestamps
- Data is designed to be realistic for demonstration purposes

## Warning

⚠️ **These scripts will add data to your database. In production, use with caution or on a separate database.**

