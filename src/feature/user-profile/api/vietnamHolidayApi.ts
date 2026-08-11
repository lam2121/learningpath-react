export type VietnamHoliday = {
  date: string
  localName: string
  name: string
  global: boolean
  counties: string[] | null
  launchYear: number | null
  fixed: boolean
}

export async function fetchVietnamPublicHolidays(year: number): Promise<VietnamHoliday[]> {
  const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/VN`)

  if (!response.ok) {
    throw new Error(`Failed to load Vietnam holidays for ${year}`)
  }

  return response.json() as Promise<VietnamHoliday[]>
}
