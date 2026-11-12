async function test() {
  try {
    const res = await fetch('http://localhost:3000/', {
      headers: { 'Accept': 'text/html' }
    })
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('Length:', text.length)
    console.log('First 500 chars:', text.substring(0, 500))
  } catch (e) {
    console.error('Error:', e.message)
  }
}
test()
