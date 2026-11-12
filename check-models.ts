import { db } from './src/lib/db'

async function main() {
  // Check if models exist
  const models = Object.keys(db).filter(k => !k.startsWith('$') && !k.startsWith('_'))
  console.log('Available models:', models.join(', '))
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
