import { NextResponse } from 'next/server'

interface ContactFormData {
  name: string
  email: string
  phone?: string
  enquiryType: 'consumer' | 'merchant' | 'enterprise' | 'partnership' | 'general'
  message: string
  businessName?: string
  businessType?: string
}

export async function POST(request: Request) {
  try {
    const data: ContactFormData = await request.json()
    
    // Validate required fields
    if (!data.name || !data.email || !data.enquiryType || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // In production, you would send this email via a service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll log the enquiry and return success
    // The email would be sent to info@groway.co.za
    
    const emailContent = {
      to: 'info@groway.co.za',
      from: 'noreply@groway.co.za',
      subject: `Groway ${data.enquiryType.charAt(0).toUpperCase() + data.enquiryType.slice(1)} Enquiry from ${data.name}`,
      body: `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Enquiry Type: ${data.enquiryType}
${data.businessName ? `Business Name: ${data.businessName}` : ''}
${data.businessType ? `Business Type: ${data.businessType}` : ''}

Message:
${data.message}
      `.trim()
    }

    // Log for development (in production, this would send the email)
    console.log('📧 Contact Form Submission:')
    console.log(JSON.stringify(emailContent, null, 2))

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({ 
      success: true, 
      message: 'Your enquiry has been submitted successfully. We will be in touch soon!' 
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit enquiry. Please try again.' },
      { status: 500 }
    )
  }
}
