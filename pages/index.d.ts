export type Student = {
  [index: string]: any
}

export type Item = {
  index: number
  provider: string
  name: string
  address: string
  city: string
  zip: string
  type: string
  rating: number
  county: string | undefined
  admin: string | undefined
  phone: string | undefined
  student: Student | undefined
}
