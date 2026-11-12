export default function TestPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#00897B', fontSize: '32px' }}>Server is Working!</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>If you can see this, the Next.js server is running correctly.</p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#E0F2F1', borderRadius: '8px' }}>
        <p><strong>Server Status:</strong> ✅ Running</p>
        <p><strong>Port:</strong> 3000</p>
        <p><strong>Time:</strong> {new Date().toISOString()}</p>
      </div>
    </div>
  )
}
