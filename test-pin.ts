import { db } from './src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Get staff
  const staff = await db.restaurantStaff.findMany({
    where: { status: 'active' }
  })
  
  console.log('Staff count:', staff.length)
  
  // Test PIN verification
  const testPins = ['1234', '5678', '1111', '2222', '3333', '0000']
  
  for (const testPin of testPins) {
    let found = false
    for (const s of staff) {
      if (s.pin) {
        const isValid = await bcrypt.compare(testPin, s.pin)
        if (isValid) {
          console.log(`PIN ${testPin} matches ${s.name} (${s.role})`)
          found = true
          break
        }
      }
    }
    if (!found) {
      console.log(`PIN ${testPin} - no match`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
