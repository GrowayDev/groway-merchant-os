#!/usr/bin/env python3
"""
Generate supplier onboarding document templates for GroSupply.
Creates PDF templates for:
1. CIPC Registration Certificate
2. B-BBEE Certificate
3. VAT Registration Certificate
4. Bank Confirmation Letter
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Output directory
OUTPUT_DIR = "/home/z/my-project/public/documents"

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

def create_styles():
    """Create document styles"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='DocTitle',
        fontName='Times New Roman',
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=12,
        textColor=colors.HexColor('#1A1A1A')
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='DocSubtitle',
        fontName='Times New Roman',
        fontSize=14,
        leading=18,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.HexColor('#00897B')
    ))
    
    # Section header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontName='Times New Roman',
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        spaceBefore=16,
        spaceAfter=8,
        textColor=colors.HexColor('#1A1A1A')
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='DocBody',
        fontName='Times New Roman',
        fontSize=11,
        leading=16,
        alignment=TA_LEFT,
        spaceAfter=8,
        textColor=colors.HexColor('#333333')
    ))
    
    # Form field label
    styles.add(ParagraphStyle(
        name='FieldLabel',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#666666')
    ))
    
    # Footer
    styles.add(ParagraphStyle(
        name='Footer',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#757575')
    ))
    
    return styles

def create_form_table(fields, styles):
    """Create a form table with fields and blank spaces"""
    data = []
    for label, width in fields:
        data.append([
            Paragraph(f"<b>{label}</b>", styles['FieldLabel']),
            "_" * width
        ])
    
    table = Table(data, colWidths=[3*inch, 3.5*inch])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    return table

def add_header_footer(canvas, doc, title):
    """Add header and footer to each page"""
    canvas.saveState()
    
    # Header line
    canvas.setStrokeColor(colors.HexColor('#00897B'))
    canvas.setLineWidth(2)
    canvas.line(50, A4[1] - 40, A4[0] - 50, A4[1] - 40)
    
    # GroSupply logo text
    canvas.setFont('Times New Roman', 10)
    canvas.setFillColor(colors.HexColor('#00897B'))
    canvas.drawString(50, A4[1] - 30, "GroSupply - Supplier Onboarding")
    
    # Footer
    canvas.setFillColor(colors.HexColor('#757575'))
    canvas.setFont('Times New Roman', 8)
    canvas.drawString(50, 30, f"{title} Template")
    canvas.drawRightString(A4[0] - 50, 30, "Page %d" % doc.page)
    
    # Footer line
    canvas.setStrokeColor(colors.HexColor('#E0E0E0'))
    canvas.setLineWidth(0.5)
    canvas.line(50, 45, A4[0] - 50, 45)
    
    canvas.restoreState()

def create_cipc_certificate():
    """Create CIPC Registration Certificate Template"""
    output_path = os.path.join(OUTPUT_DIR, "cipc-registration-certificate-template.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = create_styles()
    story = []
    
    # Title
    story.append(Paragraph("CIPC REGISTRATION CERTIFICATE", styles['DocTitle']))
    story.append(Paragraph("Company Registration Document Template", styles['DocSubtitle']))
    story.append(Spacer(1, 20))
    
    # Instructions
    story.append(Paragraph(
        "This document serves as a template for suppliers to provide their CIPC (Companies and Intellectual Property Commission) "
        "registration details. Please complete all fields and attach your official CIPC certificate.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 20))
    
    # Company Details Section
    story.append(Paragraph("1. COMPANY DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    company_fields = [
        ("Company Name:", 50),
        ("Trading Name (if different):", 50),
        ("CIPC Registration Number:", 50),
        ("Enterprise Number:", 50),
        ("Date of Registration:", 50),
        ("Company Type:", 50),
    ]
    story.append(create_form_table(company_fields, styles))
    story.append(Spacer(1, 20))
    
    # Registered Address Section
    story.append(Paragraph("2. REGISTERED ADDRESS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    address_fields = [
        ("Street Address:", 50),
        ("City:", 50),
        ("Province:", 50),
        ("Postal Code:", 50),
    ]
    story.append(create_form_table(address_fields, styles))
    story.append(Spacer(1, 20))
    
    # Directors Section
    story.append(Paragraph("3. DIRECTORS / MEMBERS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    director_fields = [
        ("Director 1 - Full Name:", 50),
        ("Director 1 - ID Number:", 50),
        ("Director 2 - Full Name:", 50),
        ("Director 2 - ID Number:", 50),
        ("Director 3 - Full Name:", 50),
        ("Director 3 - ID Number:", 50),
    ]
    story.append(create_form_table(director_fields, styles))
    story.append(Spacer(1, 20))
    
    # Declaration
    story.append(Paragraph("4. DECLARATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "I hereby declare that the information provided above is true and correct. I understand that providing false "
        "information may result in the rejection of my supplier application or termination of my supplier agreement.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 30))
    
    # Signature
    sig_fields = [
        ("Authorized Signature:", 50),
        ("Full Name:", 50),
        ("Designation:", 50),
        ("Date:", 50),
    ]
    story.append(create_form_table(sig_fields, styles))
    story.append(Spacer(1, 30))
    
    # Note
    story.append(Paragraph(
        "<b>Note:</b> Please attach a certified copy of your CIPC Registration Certificate (not older than 3 months).",
        styles['FieldLabel']
    ))
    
    doc.build(story, onFirstPage=lambda c, d: add_header_footer(c, d, "CIPC Registration Certificate"))
    print(f"Created: {output_path}")

def create_bbbee_certificate():
    """Create B-BBEE Certificate Template"""
    output_path = os.path.join(OUTPUT_DIR, "bbbee-certificate-template.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = create_styles()
    story = []
    
    # Title
    story.append(Paragraph("B-BBEE CERTIFICATE", styles['DocTitle']))
    story.append(Paragraph("Broad-Based Black Economic Empowerment Verification", styles['DocSubtitle']))
    story.append(Spacer(1, 20))
    
    # Instructions
    story.append(Paragraph(
        "This document serves as a template for suppliers to provide their B-BBEE (Broad-Based Black Economic Empowerment) "
        "certification details. Please complete all fields and attach your valid B-BBEE certificate from an accredited verification agency.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 20))
    
    # Company Details Section
    story.append(Paragraph("1. COMPANY DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    company_fields = [
        ("Company Name:", 50),
        ("CIPC Registration Number:", 50),
        ("Trading Name:", 50),
    ]
    story.append(create_form_table(company_fields, styles))
    story.append(Spacer(1, 20))
    
    # B-BBEE Status Section
    story.append(Paragraph("2. B-BBEE STATUS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    bbbee_fields = [
        ("B-BBEE Level (1-8):", 50),
        ("B-BBEE Recognition Level (%):", 50),
        ("Black Ownership (%):", 50),
        ("Black Women Ownership (%):", 50),
        ("Scorecard Type:", 50),
    ]
    story.append(create_form_table(bbbee_fields, styles))
    story.append(Spacer(1, 20))
    
    # Verification Agency Section
    story.append(Paragraph("3. VERIFICATION AGENCY DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    agency_fields = [
        ("Verification Agency Name:", 50),
        ("SANAS Accreditation Number:", 50),
        ("Certificate Number:", 50),
        ("Certificate Issue Date:", 50),
        ("Certificate Expiry Date:", 50),
    ]
    story.append(create_form_table(agency_fields, styles))
    story.append(Spacer(1, 20))
    
    # Scorecard Elements
    story.append(Paragraph("4. SCORECARD ELEMENTS (OPTIONAL)", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    # Create a table for scorecard elements
    scorecard_data = [
        [Paragraph("<b>Element</b>", styles['FieldLabel']), 
         Paragraph("<b>Points</b>", styles['FieldLabel']), 
         Paragraph("<b>Target</b>", styles['FieldLabel'])],
        ["Ownership", "____", "____"],
        ["Management Control", "____", "____"],
        ["Skills Development", "____", "____"],
        ["Enterprise Development", "____", "____"],
        ["Supplier Development", "____", "____"],
        ["Socio-Economic Development", "____", "____"],
    ]
    
    scorecard_table = Table(scorecard_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
    scorecard_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0F2F1')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E0E0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(scorecard_table)
    story.append(Spacer(1, 20))
    
    # Declaration
    story.append(Paragraph("5. DECLARATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "I hereby confirm that the B-BBEE certificate attached is valid, authentic, and obtained from a SANAS-accredited "
        "verification agency. I understand that misrepresentation of B-BBEE status is a serious offense.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 30))
    
    # Signature
    sig_fields = [
        ("Authorized Signature:", 50),
        ("Full Name:", 50),
        ("Designation:", 50),
        ("Date:", 50),
    ]
    story.append(create_form_table(sig_fields, styles))
    story.append(Spacer(1, 30))
    
    # Note
    story.append(Paragraph(
        "<b>Note:</b> Please attach a valid B-BBEE certificate from a SANAS-accredited verification agency. "
        "Certificates must not be expired.",
        styles['FieldLabel']
    ))
    
    doc.build(story, onFirstPage=lambda c, d: add_header_footer(c, d, "B-BBEE Certificate"))
    print(f"Created: {output_path}")

def create_vat_certificate():
    """Create VAT Registration Certificate Template"""
    output_path = os.path.join(OUTPUT_DIR, "vat-registration-certificate-template.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = create_styles()
    story = []
    
    # Title
    story.append(Paragraph("VAT REGISTRATION CERTIFICATE", styles['DocTitle']))
    story.append(Paragraph("South African Revenue Service (SARS) VAT Registration", styles['DocSubtitle']))
    story.append(Spacer(1, 20))
    
    # Instructions
    story.append(Paragraph(
        "This document serves as a template for suppliers to provide their VAT (Value Added Tax) registration details. "
        "Please complete all fields and attach your SARS VAT registration certificate or VAT103 letter.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 20))
    
    # Company Details Section
    story.append(Paragraph("1. COMPANY DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    company_fields = [
        ("Registered Name:", 50),
        ("Trading Name:", 50),
        ("CIPC Registration Number:", 50),
    ]
    story.append(create_form_table(company_fields, styles))
    story.append(Spacer(1, 20))
    
    # VAT Details Section
    story.append(Paragraph("2. VAT REGISTRATION DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    vat_fields = [
        ("VAT Registration Number:", 50),
        ("Date of VAT Registration:", 50),
        ("VAT Category:", 50),
        ("VAT Filing Frequency:", 50),
        ("Tax Reference Number:", 50),
    ]
    story.append(create_form_table(vat_fields, styles))
    story.append(Spacer(1, 20))
    
    # Registered Address Section
    story.append(Paragraph("3. REGISTERED ADDRESS FOR TAX PURPOSES", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    address_fields = [
        ("Street Address:", 50),
        ("City:", 50),
        ("Province:", 50),
        ("Postal Code:", 50),
    ]
    story.append(create_form_table(address_fields, styles))
    story.append(Spacer(1, 20))
    
    # Contact Details
    story.append(Paragraph("4. TAX CONTACT DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    contact_fields = [
        ("Tax Practitioner / Contact Person:", 50),
        ("Contact Number:", 50),
        ("Email Address:", 50),
    ]
    story.append(create_form_table(contact_fields, styles))
    story.append(Spacer(1, 20))
    
    # Declaration
    story.append(Paragraph("5. DECLARATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "I hereby confirm that the VAT registration information provided is accurate and that our company is currently "
        "registered for VAT with SARS. I understand that providing incorrect information may result in rejection of "
        "our supplier application.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 30))
    
    # Signature
    sig_fields = [
        ("Authorized Signature:", 50),
        ("Full Name:", 50),
        ("Designation:", 50),
        ("Date:", 50),
    ]
    story.append(create_form_table(sig_fields, styles))
    story.append(Spacer(1, 30))
    
    # Note
    story.append(Paragraph(
        "<b>Note:</b> Please attach a copy of your SARS VAT Registration Certificate (VAT103) or eFiling confirmation letter.",
        styles['FieldLabel']
    ))
    
    doc.build(story, onFirstPage=lambda c, d: add_header_footer(c, d, "VAT Registration Certificate"))
    print(f"Created: {output_path}")

def create_bank_confirmation():
    """Create Bank Confirmation Letter Template"""
    output_path = os.path.join(OUTPUT_DIR, "bank-confirmation-letter-template.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = create_styles()
    story = []
    
    # Title
    story.append(Paragraph("BANK CONFIRMATION LETTER", styles['DocTitle']))
    story.append(Paragraph("Business Bank Account Verification", styles['DocSubtitle']))
    story.append(Spacer(1, 20))
    
    # Instructions
    story.append(Paragraph(
        "This document serves as a template for suppliers to provide bank account verification details. "
        "Please complete all fields and attach a bank confirmation letter (not older than 3 months) or cancelled cheque. "
        "The bank letter must be on the bank's letterhead and stamped.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 20))
    
    # Company Details Section
    story.append(Paragraph("1. COMPANY DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    company_fields = [
        ("Company Name (as per bank):", 50),
        ("Trading Name:", 50),
        ("CIPC Registration Number:", 50),
    ]
    story.append(create_form_table(company_fields, styles))
    story.append(Spacer(1, 20))
    
    # Bank Details Section
    story.append(Paragraph("2. BANK ACCOUNT DETAILS", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    bank_fields = [
        ("Bank Name:", 50),
        ("Bank Code / Universal Code:", 50),
        ("Branch Name:", 50),
        ("Branch Code:", 50),
        ("Account Number:", 50),
        ("Account Type:", 50),
        ("Account Holder Name:", 50),
    ]
    story.append(create_form_table(bank_fields, styles))
    story.append(Spacer(1, 20))
    
    # Account Verification Section
    story.append(Paragraph("3. ACCOUNT VERIFICATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "The bank account details above have been verified by our bank. This account is active and registered "
        "in the name of the business entity listed above.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 20))
    
    verify_fields = [
        ("Date of Bank Letter:", 50),
        ("Bank Reference Number:", 50),
    ]
    story.append(create_form_table(verify_fields, styles))
    story.append(Spacer(1, 30))
    
    # Bank Stamp Section
    story.append(Paragraph("4. BANK STAMP & AUTHORIZATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "I confirm that the above account details are correct and the account is held at this bank branch.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 30))
    
    # Bank official signature
    bank_sig = [
        ("Bank Official Name:", 50),
        ("Bank Official Signature:", 50),
        ("Position:", 50),
        ("Date:", 50),
    ]
    story.append(create_form_table(bank_sig, styles))
    story.append(Spacer(1, 40))
    
    # Stamp box
    story.append(Paragraph("<b>BANK STAMP</b>", styles['FieldLabel']))
    stamp_box = Table([[""]], colWidths=[4*inch], rowHeights=[2*inch])
    stamp_box.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAFAFA')),
    ]))
    story.append(stamp_box)
    story.append(Spacer(1, 20))
    
    # Supplier Declaration
    story.append(Paragraph("5. SUPPLIER DECLARATION", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E0E0E0')))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph(
        "I confirm that this bank account belongs to the company and is the account to be used for all "
        "payment settlements from GroSupply.",
        styles['DocBody']
    ))
    story.append(Spacer(1, 30))
    
    # Supplier signature
    supplier_sig = [
        ("Authorized Signature:", 50),
        ("Full Name:", 50),
        ("Designation:", 50),
        ("Date:", 50),
    ]
    story.append(create_form_table(supplier_sig, styles))
    story.append(Spacer(1, 30))
    
    # Note
    story.append(Paragraph(
        "<b>Note:</b> Please attach a bank confirmation letter (not older than 3 months) on bank letterhead, "
        "stamped and signed by a bank official. Alternatively, attach a cancelled cheque.",
        styles['FieldLabel']
    ))
    
    doc.build(story, onFirstPage=lambda c, d: add_header_footer(c, d, "Bank Confirmation Letter"))
    print(f"Created: {output_path}")

if __name__ == "__main__":
    print("Generating supplier document templates...")
    print("-" * 50)
    
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate all templates
    create_cipc_certificate()
    create_bbbee_certificate()
    create_vat_certificate()
    create_bank_confirmation()
    
    print("-" * 50)
    print("All templates generated successfully!")
    print(f"Output directory: {OUTPUT_DIR}")
