import XLSX from 'xlsx'
import path from 'path'

const filePath = './upload/Groway_Wholesale_CashCarry_Directory_SA_v1.0.xlsx'
const workbook = XLSX.readFile(filePath)
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]

// Print first 5 rows to see structure
for (let i = 1; i <= 5; i++) {
  const rowData: string[] = []
  for (let j = 1; j <= 20; j++) {
    const cellAddress = XLSX.utils.encode_cell({ r: i, c: j })
    const cell = worksheet[cellAddress]
    rowData.push(cell ? String(cell.v) : '')
  }
  console.log(`Row ${i}:`, rowData.slice(0, 15))
}
