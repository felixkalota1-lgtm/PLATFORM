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

// Mock Data - REMOVED: Use actual backend/Firestore integration
// All mock arrays have been removed for production use

// Service Functions
// TODO: Connect to actual Firestore database or backend API
export const hrService = {
  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    return Promise.resolve([]);
  },

  async getEmployee(id: string): Promise<Employee | undefined> {
    return Promise.resolve(undefined);
  },

  async searchEmployees(query: string): Promise<Employee[]> {
    return Promise.resolve([]);
  },

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return Promise.resolve([]);
  },

  // Contract Methods
  async getContracts(): Promise<Contract[]> {
    return Promise.resolve([]);
  },

  async getEmployeeContract(employeeId: string): Promise<Contract | undefined> {
    return Promise.resolve(undefined);
  },

  // Payroll Methods
  async getPayrollRecords(): Promise<PayrollRecord[]> {
    return Promise.resolve([]);
  },

  async getEmployeePayroll(employeeId: string): Promise<PayrollRecord[]> {
    return Promise.resolve([]);
  },

  // Attendance Methods
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    return Promise.resolve([]);
  },

  async getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
    return Promise.resolve([]);
  },

  // Job Posting Methods
  async getJobPostings(): Promise<JobPosting[]> {
    return Promise.resolve([]);
  },

  async getOpenPositions(): Promise<JobPosting[]> {
    return Promise.resolve([]);
  },

  // Department Methods
  async getDepartments(): Promise<Department[]> {
    return Promise.resolve([]);
  },

  async getDepartment(id: string): Promise<Department | undefined> {
    return Promise.resolve(undefined);
  },
};

export default hrService;
