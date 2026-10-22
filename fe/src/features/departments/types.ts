export interface Department {
  id: string
  name: string
  code: string
  userCount: number
  jobCount: number
  createdAt: string
}

export interface DepartmentInput {
  name: string
  code: string
}
