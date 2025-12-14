// HR Service - Employee, Contract, Payroll, and Attendance Management

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive' | 'on-leave' | 'contract-ending';
  hireDate: Date;
  salary: number;
  baseSalary: number;
  employmentType: 'full-time' | 'part-time' | 'contract';
  reportsTo?: string;
  avatar?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  bankAccount?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  type: 'permanent' | 'fixed-term' | 'probation';
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
  duration?: string;
  salary: number;
  benefits: string[];
  daysUntilExpiry?: number;
  document?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  taxes: number;
  netSalary: number;
  paymentDate: Date;
  paymentMethod: 'bank-transfer' | 'check' | 'cash';
  status: 'pending' | 'processed' | 'paid';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  checkIn: string;
  checkOut?: string;
  hours: number;
  status: 'present' | 'absent' | 'late' | 'early-leave';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'maternity' | 'unpaid' | 'emergency';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  position: string;
  description: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  postedDate: Date;
  closingDate: Date;
  status: 'open' | 'closed' | 'on-hold';
  applicants: number;
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
  headName?: string;
  members: number;
  budget?: number;
  location: string;
  description: string;
}

// Mock Data
const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    firstName: 'John',
    lastName: 'Anderson',
    email: 'john.anderson@company.com',
    phone: '(555) 123-4567',
    position: 'Director of Operations',
    department: 'Operations',
    status: 'active',
    hireDate: new Date('2020-01-15'),
    salary: 145000,
    baseSalary: 130000,
    employmentType: 'full-time',
    avatar: '👨‍💼',
    address: '123 Executive Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    ssn: '***-**-1234',
    emergencyContact: {
      name: 'Mary Anderson',
      relationship: 'Spouse',
      phone: '(555) 123-4568',
    },
  },
  {
    id: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@company.com',
    phone: '(555) 234-5678',
    position: 'HR Manager',
    department: 'Human Resources',
    status: 'active',
    hireDate: new Date('2021-03-22'),
    salary: 95000,
    baseSalary: 85000,
    employmentType: 'full-time',
    reportsTo: 'EMP001',
    avatar: '👩‍💼',
    address: '456 Corporate Blvd',
    city: 'New York',
    state: 'NY',
    zipCode: '10002',
    ssn: '***-**-5678',
    emergencyContact: {
      name: 'David Mitchell',
      relationship: 'Brother',
      phone: '(555) 234-5679',
    },
  },
  {
    id: 'EMP003',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@company.com',
    phone: '(555) 345-6789',
    position: 'Senior Procurement Specialist',
    department: 'Procurement',
    status: 'active',
    hireDate: new Date('2019-06-10'),
    salary: 105000,
    baseSalary: 95000,
    employmentType: 'full-time',
    reportsTo: 'EMP001',
    avatar: '👨‍💼',
    address: '789 Business Park',
    city: 'New York',
    state: 'NY',
    zipCode: '10003',
    ssn: '***-**-9876',
    emergencyContact: {
      name: 'Lisa Chen',
      relationship: 'Sister',
      phone: '(555) 345-6790',
    },
  },
  {
    id: 'EMP004',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    email: 'emma.rodriguez@company.com',
    phone: '(555) 456-7890',
    position: 'Warehouse Manager',
    department: 'Logistics',
    status: 'active',
    hireDate: new Date('2018-11-05'),
    salary: 78000,
    baseSalary: 70000,
    employmentType: 'full-time',
    reportsTo: 'EMP001',
    avatar: '👩‍💼',
    address: '321 Industrial Way',
    city: 'New York',
    state: 'NY',
    zipCode: '10004',
    ssn: '***-**-4567',
    emergencyContact: {
      name: 'Carlos Rodriguez',
      relationship: 'Father',
      phone: '(555) 456-7891',
    },
  },
  {
    id: 'EMP005',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@company.com',
    phone: '(555) 567-8901',
    position: 'Finance Manager',
    department: 'Accounting',
    status: 'active',
    hireDate: new Date('2020-08-17'),
    salary: 98000,
    baseSalary: 88000,
    employmentType: 'full-time',
    reportsTo: 'EMP001',
    avatar: '👨‍💼',
    address: '654 Finance Plaza',
    city: 'New York',
    state: 'NY',
    zipCode: '10005',
    ssn: '***-**-8901',
    emergencyContact: {
      name: 'Jennifer Thompson',
      relationship: 'Spouse',
      phone: '(555) 567-8902',
    },
  },
];

const mockContracts: Contract[] = [
  {
    id: 'CNT001',
    employeeId: 'EMP001',
    employeeName: 'John Anderson',
    position: 'Director of Operations',
    type: 'permanent',
    startDate: new Date('2020-01-15'),
    status: 'active',
    salary: 130000,
    benefits: ['Health Insurance', '401(k)', 'Stock Options', 'Flexible Hours'],
  },
  {
    id: 'CNT002',
    employeeId: 'EMP002',
    employeeName: 'Sarah Mitchell',
    position: 'HR Manager',
    type: 'permanent',
    startDate: new Date('2021-03-22'),
    status: 'active',
    salary: 85000,
    benefits: ['Health Insurance', '401(k)', 'Professional Development'],
  },
  {
    id: 'CNT003',
    employeeId: 'EMP003',
    employeeName: 'Michael Chen',
    position: 'Senior Procurement Specialist',
    type: 'permanent',
    startDate: new Date('2019-06-10'),
    status: 'active',
    salary: 95000,
    benefits: ['Health Insurance', '401(k)', 'Performance Bonus', 'Vehicle Allowance'],
  },
];

const mockPayroll: PayrollRecord[] = [
  {
    id: 'PAY001',
    employeeId: 'EMP001',
    employeeName: 'John Anderson',
    period: 'November 2025',
    basicSalary: 10833.33,
    allowances: 2500,
    deductions: 500,
    taxes: 3500,
    netSalary: 9333.33,
    paymentDate: new Date('2025-11-30'),
    paymentMethod: 'bank-transfer',
    status: 'paid',
  },
  {
    id: 'PAY002',
    employeeId: 'EMP002',
    employeeName: 'Sarah Mitchell',
    period: 'November 2025',
    basicSalary: 7083.33,
    allowances: 1000,
    deductions: 200,
    taxes: 2000,
    netSalary: 5883.33,
    paymentDate: new Date('2025-11-30'),
    paymentMethod: 'bank-transfer',
    status: 'paid',
  },
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: 'ATT001',
    employeeId: 'EMP001',
    employeeName: 'John Anderson',
    date: new Date(),
    checkIn: '08:30 AM',
    checkOut: '05:45 PM',
    hours: 9.25,
    status: 'present',
  },
  {
    id: 'ATT002',
    employeeId: 'EMP002',
    employeeName: 'Sarah Mitchell',
    date: new Date(),
    checkIn: '09:00 AM',
    checkOut: '06:00 PM',
    hours: 9,
    status: 'present',
  },
];

const mockJobPostings: JobPosting[] = [
  {
    id: 'JOB001',
    title: 'Senior Accountant',
    department: 'Accounting',
    position: 'Senior Accountant',
    description: 'Looking for an experienced accountant with 5+ years in corporate accounting.',
    requirements: ['BA in Accounting', '5+ years experience', 'CPA preferred', 'Strong Excel skills'],
    salary: {
      min: 75000,
      max: 95000,
      currency: 'USD',
    },
    location: 'New York, NY',
    postedDate: new Date('2025-12-01'),
    closingDate: new Date('2025-12-31'),
    status: 'open',
    applicants: 12,
  },
  {
    id: 'JOB002',
    title: 'Logistics Coordinator',
    department: 'Logistics',
    position: 'Logistics Coordinator',
    description: 'Coordinate warehouse operations and shipments.',
    requirements: ['High school diploma', '2+ years logistics experience', 'Strong organization skills'],
    salary: {
      min: 45000,
      max: 55000,
      currency: 'USD',
    },
    location: 'New York, NY',
    postedDate: new Date('2025-12-05'),
    closingDate: new Date('2026-01-15'),
    status: 'open',
    applicants: 8,
  },
];

const mockDepartments: Department[] = [
  {
    id: 'DEPT001',
    name: 'Operations',
    headId: 'EMP001',
    headName: 'John Anderson',
    members: 15,
    budget: 1200000,
    location: 'Building A',
    description: 'Core operations and strategy',
  },
  {
    id: 'DEPT002',
    name: 'Human Resources',
    headId: 'EMP002',
    headName: 'Sarah Mitchell',
    members: 5,
    budget: 400000,
    location: 'Building A',
    description: 'Employee management and development',
  },
  {
    id: 'DEPT003',
    name: 'Procurement',
    headId: 'EMP003',
    headName: 'Michael Chen',
    members: 8,
    budget: 600000,
    location: 'Building B',
    description: 'Vendor management and purchasing',
  },
  {
    id: 'DEPT004',
    name: 'Logistics',
    headId: 'EMP004',
    headName: 'Emma Rodriguez',
    members: 20,
    budget: 1500000,
    location: 'Building C',
    description: 'Warehouse and distribution operations',
  },
  {
    id: 'DEPT005',
    name: 'Accounting',
    headId: 'EMP005',
    headName: 'David Thompson',
    members: 10,
    budget: 700000,
    location: 'Building A',
    description: 'Financial management and reporting',
  },
];

// Service Functions
export const hrService = {
  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockEmployees), 300);
    });
  },

  async getEmployee(id: string): Promise<Employee | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockEmployees.find((e) => e.id === id));
      }, 200);
    });
  },

  async searchEmployees(query: string): Promise<Employee[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = mockEmployees.filter(
          (e) =>
            e.firstName.toLowerCase().includes(query.toLowerCase()) ||
            e.lastName.toLowerCase().includes(query.toLowerCase()) ||
            e.email.toLowerCase().includes(query.toLowerCase()) ||
            e.position.toLowerCase().includes(query.toLowerCase())
        );
        resolve(results);
      }, 200);
    });
  },

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockEmployees.filter((e) => e.department === department));
      }, 200);
    });
  },

  // Contract Methods
  async getContracts(): Promise<Contract[]> {
    const contracts = mockContracts.map((c) => {
      if (c.endDate) {
        const today = new Date();
        const daysUntil = Math.ceil((c.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const status: 'active' | 'expiring' | 'expired' | 'terminated' = daysUntil < 0 ? 'expired' : daysUntil < 30 ? 'expiring' : 'active';
        return {
          ...c,
          daysUntilExpiry: daysUntil,
          status,
        };
      }
      return c;
    });
    return new Promise<Contract[]>((resolve) => {
      setTimeout(() => resolve(contracts as Contract[]), 300);
    });
  },

  async getEmployeeContract(employeeId: string): Promise<Contract | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockContracts.find((c) => c.employeeId === employeeId));
      }, 200);
    });
  },

  // Payroll Methods
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockPayroll), 300);
    });
  },

  async getEmployeePayroll(employeeId: string): Promise<PayrollRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPayroll.filter((p) => p.employeeId === employeeId));
      }, 200);
    });
  },

  // Attendance Methods
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAttendance), 300);
    });
  },

  async getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAttendance.filter((a) => a.employeeId === employeeId));
      }, 200);
    });
  },

  // Job Posting Methods
  async getJobPostings(): Promise<JobPosting[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockJobPostings), 300);
    });
  },

  async getOpenPositions(): Promise<JobPosting[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockJobPostings.filter((j) => j.status === 'open'));
      }, 200);
    });
  },

  // Department Methods
  async getDepartments(): Promise<Department[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDepartments), 300);
    });
  },

  async getDepartment(id: string): Promise<Department | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDepartments.find((d) => d.id === id));
      }, 200);
    });
  },
};

export default hrService;
