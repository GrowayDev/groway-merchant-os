#!/usr/bin/env python3
"""
Groway Superapp Platform - Comprehensive Product & Feature Document
Generates a professional PDF document covering all 9 applications,
features, user journeys, market needs, and Figma mockup screenshots.
"""

import sys
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Page setup
PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = 0.75 * inch
RIGHT_MARGIN = 0.75 * inch
TOP_MARGIN = 0.75 * inch
BOTTOM_MARGIN = 0.75 * inch
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Color Palette
ACCENT = colors.HexColor('#00897B')
ACCENT_DARK = colors.HexColor('#00695C')
TEXT_PRIMARY = colors.HexColor('#262522')
TEXT_MUTED = colors.HexColor('#6b7280')
BG_SURFACE = colors.HexColor('#f0fdfa')
SECONDARY = colors.HexColor('#1565C0')

# Table colors
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_ODD = BG_SURFACE

# Mockup images directory
MOCKUP_DIR = '/home/z/my-project/public/images/mockups'
OUTPUT_PATH = '/home/z/my-project/public/Groway_Platform_Product_Document.pdf'

def create_styles():
    """Create all paragraph styles for the document."""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='DocTitle',
        fontName='Times New Roman',
        fontSize=28,
        leading=34,
        textColor=ACCENT_DARK,
        alignment=TA_CENTER,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        name='DocSubtitle',
        fontName='Times New Roman',
        fontSize=14,
        leading=18,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
        spaceAfter=30
    ))
    
    styles.add(ParagraphStyle(
        name='SectionH1',
        fontName='Times New Roman',
        fontSize=20,
        leading=26,
        textColor=ACCENT_DARK,
        spaceBefore=20,
        spaceAfter=12
    ))
    
    styles.add(ParagraphStyle(
        name='SectionH2',
        fontName='Times New Roman',
        fontSize=16,
        leading=22,
        textColor=SECONDARY,
        spaceBefore=16,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='SectionH3',
        fontName='Times New Roman',
        fontSize=13,
        leading=18,
        textColor=TEXT_PRIMARY,
        spaceBefore=12,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        name='DocBody',
        fontName='Times New Roman',
        fontSize=10.5,
        leading=16,
        textColor=TEXT_PRIMARY,
        alignment=TA_JUSTIFY,
        spaceAfter=8
    ))
    
    styles.add(ParagraphStyle(
        name='BulletItem',
        fontName='Times New Roman',
        fontSize=10,
        leading=15,
        textColor=TEXT_PRIMARY,
        leftIndent=20,
        spaceAfter=4
    ))
    
    styles.add(ParagraphStyle(
        name='StatsHighlight',
        fontName='Times New Roman',
        fontSize=24,
        leading=30,
        textColor=ACCENT,
        alignment=TA_CENTER
    ))
    
    styles.add(ParagraphStyle(
        name='StatsLabel',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    ))
    
    styles.add(ParagraphStyle(
        name='ImageCaption',
        fontName='Times New Roman',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    ))
    
    return styles

def add_section_header(story, styles, text, level=1):
    if level == 1:
        story.append(Paragraph(f"<b>{text}</b>", styles['SectionH1']))
    elif level == 2:
        story.append(Paragraph(f"<b>{text}</b>", styles['SectionH2']))
    else:
        story.append(Paragraph(f"<b>{text}</b>", styles['SectionH3']))

def add_body_text(story, styles, text):
    story.append(Paragraph(text, styles['DocBody']))

def add_bullet_list(story, styles, items):
    for item in items:
        story.append(Paragraph(f"• {item}", styles['BulletItem']))

def add_mockup_image(story, styles, image_name, caption, max_width=CONTENT_WIDTH * 0.85):
    """Add a mockup image with caption to the document."""
    # Try figma version first, then regular
    figma_path = os.path.join(MOCKUP_DIR, f"{image_name}-figma.png")
    regular_path = os.path.join(MOCKUP_DIR, f"{image_name}.png")
    
    actual_path = figma_path if os.path.exists(figma_path) else regular_path
    
    if not os.path.exists(actual_path):
        print(f"Warning: Image not found: {image_name}")
        return
    
    story.append(Spacer(1, 0.15*inch))
    
    try:
        max_height = 4.0 * inch
        img = Image(actual_path, width=max_width, height=max_height, kind='proportional')
        img.hAlign = 'CENTER'
        story.append(img)
        
        story.append(Spacer(1, 0.08*inch))
        story.append(Paragraph(f"<i>{caption}</i>", styles['ImageCaption']))
        story.append(Spacer(1, 0.15*inch))
    except Exception as e:
        print(f"Error loading image {actual_path}: {e}")

def create_feature_table(styles, features):
    """Create a feature table."""
    header_style = ParagraphStyle(
        name='TableHeader',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        textColor=TABLE_HEADER_TEXT,
        alignment=TA_CENTER
    )
    cell_style = ParagraphStyle(
        name='TableCell',
        fontName='Times New Roman',
        fontSize=9,
        leading=13,
        textColor=TEXT_PRIMARY,
        alignment=TA_LEFT
    )
    
    data = [[Paragraph('<b>Feature</b>', header_style), 
             Paragraph('<b>Description</b>', header_style),
             Paragraph('<b>Market Need</b>', header_style)]]
    
    for feature in features:
        data.append([
            Paragraph(f"<b>{feature['name']}</b>", cell_style),
            Paragraph(feature['description'], cell_style),
            Paragraph(feature['market_need'], cell_style)
        ])
    
    col_widths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.42, CONTENT_WIDTH * 0.36]
    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    return table

def create_stats_table(styles, stats):
    """Create a statistics highlight table."""
    data = []
    row1 = []
    row2 = []
    for stat in stats:
        row1.append(Paragraph(f"<b>{stat['value']}</b>", styles['StatsHighlight']))
        row2.append(Paragraph(stat['label'], styles['StatsLabel']))
    data.append(row1)
    data.append(row2)
    
    col_width = CONTENT_WIDTH / len(stats)
    table = Table(data, colWidths=[col_width] * len(stats))
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 1), (-1, 1), 5),
    ]))
    return table

def create_journey_table(styles, journey_steps):
    """Create a user journey table."""
    header_style = ParagraphStyle(
        name='JourneyHeader',
        fontName='Times New Roman',
        fontSize=10,
        leading=14,
        textColor=TABLE_HEADER_TEXT,
        alignment=TA_CENTER
    )
    cell_style = ParagraphStyle(
        name='JourneyCell',
        fontName='Times New Roman',
        fontSize=9,
        leading=13,
        textColor=TEXT_PRIMARY,
        alignment=TA_LEFT
    )
    
    data = [[Paragraph('<b>Step</b>', header_style), 
             Paragraph('<b>User Action</b>', header_style),
             Paragraph('<b>System Response</b>', header_style),
             Paragraph('<b>Benefit</b>', header_style)]]
    
    for i, step in enumerate(journey_steps, 1):
        data.append([
            Paragraph(f"<b>{i}</b>", cell_style),
            Paragraph(step['action'], cell_style),
            Paragraph(step['response'], cell_style),
            Paragraph(step['benefit'], cell_style)
        ])
    
    col_widths = [CONTENT_WIDTH * 0.08, CONTENT_WIDTH * 0.28, CONTENT_WIDTH * 0.32, CONTENT_WIDTH * 0.32]
    table = Table(data, colWidths=col_widths, hAlign='CENTER')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
    ]))
    return table

def build_document():
    """Build the complete product document."""
    
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN
    )
    
    styles = create_styles()
    story = []
    
    # ===================== COVER PAGE =====================
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("<b>GROWAY</b>", styles['DocTitle']))
    story.append(Spacer(1, 0.3*inch))
    
    title_style = ParagraphStyle(
        name='MainTitle',
        fontName='Times New Roman',
        fontSize=32,
        leading=40,
        textColor=ACCENT_DARK,
        alignment=TA_CENTER
    )
    story.append(Paragraph("<b>Comprehensive Product<br/>&amp; Feature Document</b>", title_style))
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("Africa's Integrated Financial Operating System", styles['DocSubtitle']))
    story.append(Paragraph("One Superapp. Every Financial Need.", styles['DocSubtitle']))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Platform stats
    platform_stats = [
        {'value': '9', 'label': 'Applications'},
        {'value': '12', 'label': 'Business Verticals'},
        {'value': '528+', 'label': 'API Endpoints'},
        {'value': '35', 'label': 'Microservices'},
    ]
    story.append(create_stats_table(styles, platform_stats))
    
    story.append(Spacer(1, 1*inch))
    
    info_style = ParagraphStyle(
        name='DocInfo',
        fontName='Times New Roman',
        fontSize=11,
        leading=16,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )
    story.append(Paragraph("Product Documentation | Version 1.0", info_style))
    story.append(Paragraph("April 2026", info_style))
    
    story.append(PageBreak())
    
    # ===================== TABLE OF CONTENTS =====================
    add_section_header(story, styles, "Table of Contents", 1)
    story.append(Spacer(1, 0.2*inch))
    
    toc_items = [
        "1. Executive Summary",
        "2. Platform Overview",
        "3. Consumer Wallet",
        "4. Merchant OS - Multi-Vertical Business Platform",
        "5. GroSell - WhatsApp Commerce",
        "6. GroSupply - B2B Marketplace",
        "7. GoPay - Payment Gateway",
        "8. Enterprise - Multi-Branch Management",
        "9. Admin Console - Platform Operations",
        "10. Field Salesforce - Professional Sales",
        "11. Agent Network - Referral Program",
        "12. User Journey Maps",
        "13. Market Analysis & Opportunity",
        "14. Technical Architecture",
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, styles['DocBody']))
    
    story.append(PageBreak())
    
    # ===================== 1. EXECUTIVE SUMMARY =====================
    add_section_header(story, styles, "1. Executive Summary", 1)
    
    add_body_text(story, styles, """Groway is Africa's first truly integrated financial operating system - a comprehensive superapp ecosystem 
    designed to address the unique challenges and opportunities of the African market. Unlike fragmented solutions 
    that serve either consumers or businesses in isolation, Groway creates a unified platform where individuals, 
    merchants, and enterprises operate within a single, interconnected financial ecosystem.""")
    
    add_body_text(story, styles, """The platform comprises nine integrated applications: Consumer Wallet, Merchant OS, GroSell, GroSupply, 
    GoPay, Enterprise, Admin Console, Field Salesforce, and Agent Network. Each application is purpose-built for 
    specific user needs while sharing a common infrastructure, enabling seamless data flow, unified identity, 
    and consistent user experience across the entire ecosystem.""")
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>Platform Metrics</b>", styles['SectionH3']))
    
    # Metrics table
    metrics_data = [
        ['Metric', 'Value', 'Significance'],
        ['Active Users', '2.5M+', 'Consumer wallet users across South Africa'],
        ['Merchant Partners', '15,000+', 'Businesses using Merchant OS'],
        ['Transaction Volume', 'R47.2M/day', 'Daily transaction value processed'],
        ['API Endpoints', '528+', 'Comprehensive integration capabilities'],
        ['Business Verticals', '12', 'Industry-specific POS configurations'],
        ['Countries', '6+', 'Pan-African expansion footprint'],
    ]
    
    header_style = ParagraphStyle(name='TOCHeader', fontName='Times New Roman', fontSize=10, 
                                   textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)
    cell_style = ParagraphStyle(name='TOCCell', fontName='Times New Roman', fontSize=9, 
                                 textColor=TEXT_PRIMARY, alignment=TA_LEFT)
    
    table_data = []
    for i, row in enumerate(metrics_data):
        if i == 0:
            table_data.append([Paragraph(f"<b>{cell}</b>", header_style) for cell in row])
        else:
            table_data.append([Paragraph(cell, cell_style) for cell in row])
    
    metrics_table = Table(table_data, colWidths=[CONTENT_WIDTH*0.30, CONTENT_WIDTH*0.20, CONTENT_WIDTH*0.50])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(metrics_table)
    
    story.append(PageBreak())
    
    # ===================== 2. PLATFORM OVERVIEW =====================
    add_section_header(story, styles, "2. Platform Overview", 1)
    
    add_body_text(story, styles, """The Groway platform represents a paradigm shift in African fintech - moving beyond simple payment 
    processing to create a comprehensive financial operating system that serves every participant in the economic 
    value chain. From individual consumers managing daily transactions to enterprise corporations overseeing 
    multi-branch operations, Groway provides purpose-built solutions while maintaining ecosystem cohesion.""")
    
    add_section_header(story, styles, "Core Design Philosophy", 3)
    
    add_bullet_list(story, styles, [
        "<b>Mobile-First Architecture:</b> Built for smartphone-native users who may never own a computer",
        "<b>Offline-First Capabilities:</b> Core functionality works without internet, syncing when connected",
        "<b>Vertical-Specific Intelligence:</b> Each business type gets tailored POS, inventory, and compliance rules",
        "<b>Economic Inclusion Focus:</b> Designed for formal and informal businesses, from Shisa Nyama to pharmacy",
        "<b>Regulatory Compliance:</b> Built-in POPIA, NCA, NCR, FSCA, SARB, and SARS compliance frameworks",
        "<b>Interconnected Ecosystem:</b> Data flows seamlessly between consumer, merchant, and enterprise layers"
    ])
    
    story.append(PageBreak())
    
    # ===================== 3. CONSUMER WALLET =====================
    add_section_header(story, styles, "3. Consumer Wallet", 1)
    story.append(Paragraph("Your Financial Life, One Tap Away", styles['DocSubtitle']))
    
    add_body_text(story, styles, """The Consumer Wallet is the individual's gateway to the Groway ecosystem - a comprehensive mobile 
    wallet that consolidates every financial need into a single, intuitive interface. From daily transactions 
    to long-term savings, from bill payments to international remittances, users manage their entire financial 
    life without leaving the app.""")
    
    add_section_header(story, styles, "Core Features", 2)
    
    wallet_features = [
        {'name': 'Digital Wallet', 'description': 'Multi-currency wallet with balance management, transaction history, and QR/NFC payments', 'market_need': 'Over 60% of South Africans are underbanked; mobile-first banking is essential'},
        {'name': 'PayShap Integration', 'description': 'Real-time instant payments using cell number or QR code', 'market_need': 'Instant, low-cost payments are critical for daily commerce'},
        {'name': 'P2P Transfers', 'description': 'Send money to anyone via phone number, QR, or bank account', 'market_need': 'Informal money transfers are prevalent; need for secure digital alternative'},
        {'name': 'Bill Payments', 'description': 'Electricity, water, DStv, municipal bills, traffic fines', 'market_need': 'Physical payment points create friction; digital convenience is demanded'},
        {'name': 'Airtime & Data', 'description': 'Instant top-up for all major networks with bonus offers', 'market_need': 'Airtime is essential for daily communication; instant access required'},
        {'name': 'QR Payments', 'description': 'Scan-to-pay at any Groway merchant or generate personal QR', 'market_need': 'Contactless payments accelerated by COVID; QR is cost-effective for merchants'},
        {'name': 'Virtual Cards', 'description': 'Instant Visa/Mastercard virtual cards for online purchases', 'market_need': 'E-commerce growth requires secure online payment methods'},
        {'name': 'BNPL Credit', 'description': 'Buy Now Pay Later financing at partner merchants', 'market_need': 'Credit access for underserved consumers; responsible lending'},
        {'name': 'Savings Goals', 'description': 'Goal-based savings with automatic rules and progress tracking', 'market_need': 'Financial literacy and savings culture need digital enablement'},
        {'name': 'Insurance', 'description': 'Funeral cover, device insurance, and micro-insurance products', 'market_need': 'Insurance penetration is low; accessible products needed'},
        {'name': 'Travel Booking', 'description': 'Flights, buses, trains, and event tickets', 'market_need': 'Consolidated travel booking saves time and offers better prices'},
        {'name': 'SASSA Grants', 'description': 'Government grant management and early access', 'market_need': '18M grant recipients need efficient access to funds'},
        {'name': 'Pay+ Early Wage', 'description': 'Access earned wages before payday', 'market_need': 'Monthly pay cycles create cash flow stress; earned wage access solves this'},
    ]
    
    story.append(create_feature_table(styles, wallet_features))
    
    story.append(Spacer(1, 0.3*inch))
    add_section_header(story, styles, "Consumer Wallet User Journey", 3)
    
    wallet_journey = [
        {'action': 'User downloads app and registers with phone number', 'response': 'SMS OTP verification, KYC Level 1 activated', 'benefit': 'Instant access without paperwork'},
        {'action': 'User links bank card or tops up at retail partner', 'response': 'Balance updated instantly, transaction confirmed', 'benefit': 'Multiple funding options for convenience'},
        {'action': 'User scans merchant QR to pay for goods', 'response': 'Payment processed, receipt sent, loyalty points earned', 'benefit': 'Seamless checkout experience'},
        {'action': 'User sets up savings goal for emergency fund', 'response': 'Auto-save rules created, progress dashboard shown', 'benefit': 'Automated savings builds financial resilience'},
        {'action': 'User applies for BNPL at partner store', 'response': 'Instant credit decision, payment plan activated', 'benefit': 'Access to credit without traditional application'},
    ]
    
    story.append(create_journey_table(styles, wallet_journey))
    
    story.append(PageBreak())
    
    # ===================== 4. MERCHANT OS =====================
    add_section_header(story, styles, "4. Merchant OS - Multi-Vertical Business Platform", 1)
    story.append(Paragraph("One Platform. Every Business Type.", styles['DocSubtitle']))
    
    add_body_text(story, styles, """Merchant OS is the cornerstone of Groway's business ecosystem - a comprehensive, multi-vertical 
    point-of-sale and business management platform that adapts to the unique requirements of each industry. 
    Unlike generic POS systems, Merchant OS understands that a restaurant and a Shisa Nyama are legally, 
    operationally, and culturally different businesses, providing tailored workflows, compliance rules, 
    and feature sets for each.""")
    
    add_section_header(story, styles, "12 Business Verticals", 2)
    
    verticals = [
        ['Vertical', 'Sub-Verticals', 'Key Features'],
        ['Food & Beverage', 'QSR, Restaurant, Shisa Nyama, Coffee Shop, Bakery, Food Truck, Cloud Kitchen, Catering', 'KDS, Table management, Course ordering'],
        ['Liquor & Nightlife', 'Liquor Store, Bar/Pub, Nightclub, Shebeen, Bottle Store, Wine Farm', 'Age verification, RSA tracking, Excise duties'],
        ['Grocery & FMCG', 'Superette, Spaza Shop, Butchery, Deli, Farm Stall, Cash & Carry, Bakery Retail', 'Batch tracking, Supplier management, Auto-reorder'],
        ['Health & Beauty', 'Hair Salon, Barber, Nail Salon, Spa, Aesthetic Clinic, Tattoo, Lash & Brow', 'Appointment booking, Treatment records, Staff scheduling'],
        ['Fashion & Apparel', 'Clothing Boutique, Shoe Store, Accessories, Uniform, Thrift, Tailor', 'Size matrix, Alterations tracking, Consignment'],
        ['Health & Pharmacy', 'Full Pharmacy, Health Shop, Herbal Medicine, Optometry, Dentistry, Veterinary', 'SAHPRA compliance, NAPPI codes, Controlled substances'],
        ['Hospitality', 'Hotel, Guest House, B&B, Backpackers, Lodge, Self-Catering, Airbnb Host', 'Room management, Booking integration, Channel manager'],
        ['Hardware & Building', 'Hardware Store, Building Supplies, Paint Shop, Plumbing, Electrical, Agri-Supply', 'Contractor accounts, Bulk pricing, Project quotes'],
        ['Electronics & Tech', 'Phone Shop, Computer & IT, Electronics Retail, Repair Workshop', 'IMEI tracking, RICA compliance, Warranty management'],
        ['Sport & Leisure', 'Gym, Fitness Studio, Sports Club, Events Venue, Entertainment, Escape Room', 'Memberships, Class booking, Equipment tracking'],
        ['Childcare & Education', 'Creche, After-School Care, Tutoring, Driving School, Skills Training', 'Attendance, Parent portal, Progress reports'],
        ['Professional Services', 'Auto Repair, Dry Cleaning, Funeral Home, Legal, Accounting, Real Estate, Medical', 'Job cards, Matter billing, Trust accounts'],
    ]
    
    table_data = []
    for i, row in enumerate(verticals):
        if i == 0:
            table_data.append([Paragraph(f"<b>{cell}</b>", header_style) for cell in row])
        else:
            table_data.append([Paragraph(cell, cell_style) for cell in row])
    
    verticals_table = Table(table_data, colWidths=[CONTENT_WIDTH*0.18, CONTENT_WIDTH*0.45, CONTENT_WIDTH*0.37])
    verticals_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#e3f2fd')]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(verticals_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    add_section_header(story, styles, "Core Platform Features", 2)
    
    merchant_features = [
        {'name': 'Smart POS', 'description': 'Customizable POS interface with product grid, modifiers, and quick keys', 'market_need': 'Fast checkout essential for high-volume retail and food service'},
        {'name': 'Inventory Management', 'description': 'Real-time stock tracking, batch/expiry management, auto-reorder', 'market_need': 'Stockouts and overstock cost businesses significantly'},
        {'name': 'Kitchen Display System', 'description': 'Order routing, prep timers, station management for F&B', 'market_need': 'Paper tickets create inefficiency; digital KDS improves throughput'},
        {'name': 'Table & Floor Plan', 'description': 'Visual table management, seat assignment, course ordering', 'market_need': 'Restaurants need integrated dine-in workflow'},
        {'name': 'Accounting Integration', 'description': 'Chart of accounts, journal entries, VAT returns, SARS eFiling', 'market_need': 'SMEs struggle with accounting; integrated solution saves costs'},
        {'name': 'CRM & Loyalty', 'description': 'Customer profiles, points system, campaign management', 'market_need': 'Customer retention is critical; loyalty programs drive repeat business'},
        {'name': 'Staff Management', 'description': 'Clock-in/out, scheduling, commission tracking, payroll integration', 'market_need': 'SMEs need simple HR tools without enterprise complexity'},
        {'name': 'Compliance Modules', 'description': 'Vertical-specific compliance: liquor, pharmacy, electronics', 'market_need': 'Regulatory compliance is complex; automated systems reduce risk'},
        {'name': 'Jax AI Assistant', 'description': 'AI-powered insights, forecasting, reorder suggestions', 'market_need': 'Data-driven decisions improve profitability'},
        {'name': 'Multi-Location', 'description': 'Branch management, inter-branch transfers, consolidated reporting', 'market_need': 'Growing businesses need centralized control'},
    ]
    
    story.append(create_feature_table(styles, merchant_features))
    
    story.append(PageBreak())
    
    # ===================== 5. GROSELL =====================
    add_section_header(story, styles, "5. GroSell - WhatsApp Commerce", 1)
    story.append(Paragraph("Sell on WhatsApp Without Business API", styles['DocSubtitle']))
    
    add_body_text(story, styles, """GroSell empowers small businesses to transform WhatsApp into a powerful sales channel without 
    the complexity and cost of WhatsApp Business API. Share product catalogs, take orders, process payments, 
    and manage customer relationships - all through the familiar WhatsApp interface that customers already use daily.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    grosell_features = [
        {'name': 'Product Catalog', 'description': 'Create and share product listings with images, descriptions, pricing', 'market_need': 'Small businesses need simple catalog sharing without e-commerce website'},
        {'name': 'Order Management', 'description': 'Track orders from pending to delivered, status notifications', 'market_need': 'Manual order tracking is error-prone; digital system improves reliability'},
        {'name': 'Payment Links', 'description': 'Generate payment links for orders, integrate with GoPay gateway', 'market_need': 'Cash on delivery has high failure rates; digital payments improve collection'},
        {'name': 'Customer Profiles', 'description': 'Customer database with order history and preferences', 'market_need': 'Personalized service increases customer loyalty'},
        {'name': 'WhatsApp Integration', 'description': 'Click-to-chat links, QR codes, direct messaging', 'market_need': 'WhatsApp is the primary communication channel in Africa'},
        {'name': 'Analytics Dashboard', 'description': 'Sales analytics, top products, customer insights', 'market_need': 'Data visibility helps optimize inventory and marketing'},
    ]
    
    story.append(create_feature_table(styles, grosell_features))
    
    story.append(PageBreak())
    
    # ===================== 6. GROSUPPLY =====================
    add_section_header(story, styles, "6. GroSupply - B2B Marketplace", 1)
    story.append(Paragraph("B2B Procurement, Simplified", styles['DocSubtitle']))
    
    add_body_text(story, styles, """GroSupply connects retailers with verified suppliers in a unified B2B marketplace. Place orders, 
    request quotations, access trade credit, and settle invoices - all within a platform that integrates 
    directly with Merchant OS inventory and accounting systems.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    grosupply_features = [
        {'name': 'Supplier Marketplace', 'description': 'Browse verified suppliers across categories, compare pricing', 'market_need': 'Supplier discovery is time-consuming; consolidated marketplace saves effort'},
        {'name': 'RFQ System', 'description': 'Request quotations from multiple suppliers, compare and accept', 'market_need': 'Transparent pricing enables better purchasing decisions'},
        {'name': 'GroCredit', 'description': 'Trade credit facility for qualified buyers, instant approval', 'market_need': 'Cash flow constraints limit inventory purchases; credit enables growth'},
        {'name': 'Purchase Orders', 'description': 'Create, track, and manage purchase orders with supplier integration', 'market_need': 'Manual PO processes are inefficient; digital workflow saves time'},
        {'name': '3-Way Match', 'description': 'Automatic reconciliation of PO, GRN, and invoice', 'market_need': 'Discrepancies cause payment delays; automated matching improves accuracy'},
        {'name': 'Supplier Portal', 'description': 'Suppliers manage orders, invoices, settlements, and analytics', 'market_need': 'Suppliers need visibility into orders and payments'},
        {'name': 'Settlement System', 'description': 'Consolidated settlements, early payment discounts', 'market_need': 'Complex payment reconciliation; simplified settlement improves cash flow'},
        {'name': 'Intelligence Engine', 'description': 'Demand forecasting, reorder suggestions, price optimization', 'market_need': 'Data-driven procurement reduces costs and stockouts'},
    ]
    
    story.append(create_feature_table(styles, grosupply_features))
    
    story.append(PageBreak())
    
    # ===================== 7. GOPAY =====================
    add_section_header(story, styles, "7. GoPay - Payment Gateway", 1)
    story.append(Paragraph("Payments That Move At The Speed Of Business", styles['DocSubtitle']))
    
    add_body_text(story, styles, """GoPay is the payment infrastructure that powers the Groway ecosystem - a PCI-DSS compliant 
    payment gateway processing cards, QR codes, NFC, EFT, and mobile money. From individual merchants 
    to enterprise integrations, GoPay provides reliable, secure, and instant payment processing.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    gopay_features = [
        {'name': 'Card Processing', 'description': 'Visa, Mastercard, Amex acceptance with competitive rates', 'market_need': 'Card acceptance is essential for modern retail'},
        {'name': 'QR Payments', 'description': 'Generate and scan QR codes for instant payments', 'market_need': 'QR is cost-effective alternative to card terminals'},
        {'name': 'PayShap', 'description': 'Real-time bank-to-bank payments via cell number or QR', 'market_need': 'Instant settlement improves cash flow'},
        {'name': 'NFC Tap-to-Pay', 'description': 'Contactless payments via cards and mobile wallets', 'market_need': 'Contactless preference accelerated by COVID'},
        {'name': 'Instant EFT', 'description': 'Real-time bank transfers with immediate confirmation', 'market_need': 'Traditional EFT delays cause checkout abandonment'},
        {'name': 'Settlement Engine', 'description': 'Automated daily settlements to merchant bank accounts', 'market_need': 'Fast access to funds is critical for business operations'},
        {'name': 'Device Management', 'description': 'QR terminals, SmartPOS, SoftPOS device monitoring', 'market_need': 'Device uptime is essential for payment acceptance'},
        {'name': 'Lending Products', 'description': 'Working capital loans, equipment finance, BNPL', 'market_need': 'Merchants need access to credit for growth'},
    ]
    
    story.append(create_feature_table(styles, gopay_features))
    
    story.append(PageBreak())
    
    # ===================== 8. ENTERPRISE =====================
    add_section_header(story, styles, "8. Enterprise - Multi-Branch Management", 1)
    story.append(Paragraph("Scale Your Business Across Locations", styles['DocSubtitle']))
    
    add_body_text(story, styles, """Enterprise provides corporations and growing businesses with centralized control over multiple 
    branches, franchises, or outlets. Consolidated reporting, inter-branch transfers, unified customer 
    profiles, and corporate billing - all within a white-labelable platform.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    enterprise_features = [
        {'name': 'Multi-Branch Dashboard', 'description': 'Consolidated view of all locations with drill-down analytics', 'market_need': 'Fragmented data across branches impairs decision-making'},
        {'name': 'Central Inventory', 'description': 'Unified inventory view, stock allocation, low stock alerts', 'market_need': 'Optimized stock distribution reduces costs'},
        {'name': 'Inter-Branch Transfers', 'description': 'Request, ship, and receive stock between locations', 'market_need': 'Efficient stock movement optimizes inventory'},
        {'name': 'Unified Customers', 'description': 'Cross-branch customer profiles and unified loyalty', 'market_need': 'Customers expect consistent experience across locations'},
        {'name': 'Corporate Billing', 'description': 'Consolidated invoicing, credit management, payment terms', 'market_need': 'Complex billing structures need centralized management'},
        {'name': 'Role-Based Access', 'description': 'Granular permissions: Owner, Admin, Manager, Accountant', 'market_need': 'Security and accountability require access controls'},
        {'name': 'API Integration', 'description': 'REST APIs for ERP, CRM, and custom integrations', 'market_need': 'Enterprise systems require integration capabilities'},
        {'name': 'White-Label', 'description': 'Custom branding, colors, logo, and domain', 'market_need': 'Brand consistency across the organization'},
    ]
    
    story.append(create_feature_table(styles, enterprise_features))
    
    story.append(PageBreak())
    
    # ===================== 9. ADMIN CONSOLE =====================
    add_section_header(story, styles, "9. Admin Console - Platform Operations", 1)
    story.append(Paragraph("Platform Operations, Under Control", styles['DocSubtitle']))
    
    add_body_text(story, styles, """Admin Console is the command center for platform operators - monitoring system health, managing 
    merchants, handling compliance, detecting fraud, and providing customer support. Real-time visibility 
    into every aspect of platform operations enables proactive management and rapid response to issues.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    admin_features = [
        {'name': 'Platform Dashboard', 'description': 'Real-time metrics: active merchants, transaction volume, system health', 'market_need': 'Operational visibility enables proactive management'},
        {'name': 'Merchant Management', 'description': 'Onboarding approval, account status, subscription management', 'market_need': 'Merchant lifecycle management is core platform function'},
        {'name': 'Fraud Detection', 'description': 'Velocity checks, anomaly detection, risk scoring, alerts', 'market_need': 'Fraud prevention protects platform and users'},
        {'name': 'Compliance Center', 'description': 'KYC/KYB verification, document management, regulatory reporting', 'market_need': 'Regulatory compliance is mandatory for fintech'},
        {'name': 'Support Tools', 'description': 'Ticket management, impersonation access, audit logs', 'market_need': 'Efficient support reduces resolution time'},
        {'name': 'Analytics', 'description': 'Platform-wide analytics, growth metrics, cohort analysis', 'market_need': 'Data-driven platform management'},
    ]
    
    story.append(create_feature_table(styles, admin_features))
    
    story.append(PageBreak())
    
    # ===================== 10. FIELD SALESFORCE =====================
    add_section_header(story, styles, "10. Field Salesforce - Professional Sales", 1)
    story.append(Paragraph("Earn Great Money Growing Businesses", styles['DocSubtitle']))
    
    add_body_text(story, styles, """Field Salesforce provides professional sales agents with the tools to acquire and onboard new 
    merchants. GPS check-ins, lead management, commission tracking, and training modules create a 
    complete field sales enablement platform.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    salesforce_features = [
        {'name': 'Lead Management', 'description': 'Lead pipeline with stages: New, Contacted, Meeting, Proposal, Closing', 'market_need': 'Structured sales process improves conversion rates'},
        {'name': 'GPS Check-In', 'description': 'Location verification for merchant visits and demos', 'market_need': 'Accountability and territory management'},
        {'name': 'Commission Tracker', 'description': 'Real-time commission calculation, pending payouts, history', 'market_need': 'Transparent compensation motivates agents'},
        {'name': 'Training Modules', 'description': 'Product training, sales techniques, certification tracking', 'market_need': 'Continuous learning improves performance'},
        {'name': 'Territory Management', 'description': 'Assigned territories, coverage tracking, target vs achieved', 'market_need': 'Organized territories prevent overlap and maximize coverage'},
        {'name': 'Pipeline Dashboard', 'description': 'Sales funnel visualization, stage conversion rates', 'market_need': 'Pipeline visibility enables forecasting and coaching'},
    ]
    
    story.append(create_feature_table(styles, salesforce_features))
    
    story.append(PageBreak())
    
    # ===================== 11. AGENT NETWORK =====================
    add_section_header(story, styles, "11. Agent Network - Referral Program", 1)
    story.append(Paragraph("Turn Your Network Into Revenue", styles['DocSubtitle']))
    
    add_body_text(story, styles, """Agent Network enables anyone to earn commission by referring merchants to Groway. The 5-tier 
    system creates passive income opportunities as referred merchants grow and recruit their own networks, 
    building sustainable income streams through network effects.""")
    
    add_section_header(story, styles, "Features & Capabilities", 2)
    
    agent_features = [
        {'name': 'Referral Codes', 'description': 'Unique referral codes for tracking and attribution', 'market_need': 'Accurate tracking ensures fair compensation'},
        {'name': '5-Tier Commission', 'description': 'Starter (5%), Bronze (7%), Silver (10%), Gold (12%), Platinum (15%)', 'market_need': 'Tiered system rewards performance and loyalty'},
        {'name': 'Network Tree', 'description': 'Visual representation of referral network, revenue per level', 'market_need': 'Network visibility motivates growth'},
        {'name': 'Milestones', 'description': 'Achievement bonuses: first 5 merchants, 10 active, 25 partners', 'market_need': 'Gamification drives engagement'},
        {'name': 'Payout System', 'description': 'Commission payouts to bank account, minimum thresholds', 'market_need': 'Reliable payments build trust'},
        {'name': 'Resources', 'description': 'Marketing materials, talking points, training guides', 'market_need': 'Enablement materials improve conversion'},
    ]
    
    story.append(create_feature_table(styles, agent_features))
    
    story.append(PageBreak())
    
    # ===================== 12. USER JOURNEY MAPS =====================
    add_section_header(story, styles, "12. User Journey Maps", 1)
    
    add_body_text(story, styles, """The following user journey maps illustrate how different personas interact with the Groway 
    ecosystem to accomplish their goals. Each journey demonstrates the interconnected nature of the platform, 
    where actions in one application create value across others.""")
    
    add_section_header(story, styles, "Journey 1: Spaza Shop Owner Goes Digital", 2)
    
    spaza_journey = [
        {'action': 'Owner hears about Groway from field agent', 'response': 'Agent demonstrates POS, inventory, and supplier features', 'benefit': 'In-person trust building addresses skepticism'},
        {'action': 'Owner signs up via Merchant OS app', 'response': 'Account created, vertical selected (Grocery), demo products loaded', 'benefit': 'Zero setup friction, instant value'},
        {'action': 'Owner connects bank account for settlements', 'response': 'KYB verification initiated, temporary limits applied', 'benefit': 'Quick start with graduated access'},
        {'action': 'Owner processes first sale on POS', 'response': 'Payment received, receipt printed, stock deducted', 'benefit': 'Immediate operational improvement'},
        {'action': 'Owner places order on GroSupply', 'response': 'Products delivered, GRN processed, inventory updated', 'benefit': 'Streamlined procurement workflow'},
        {'action': 'Owner checks sales report end of day', 'response': 'Revenue, top products, profit margin displayed', 'benefit': 'Business insights without accounting knowledge'},
    ]
    
    story.append(create_journey_table(styles, spaza_journey))
    
    story.append(Spacer(1, 0.3*inch))
    
    add_section_header(story, styles, "Journey 2: Consumer Pays Bills & Saves", 2)
    
    consumer_journey = [
        {'action': 'User downloads Consumer Wallet app', 'response': 'Phone verified, wallet created, Level 1 KYC', 'benefit': 'Instant access without paperwork'},
        {'action': 'User tops up at local spaza shop', 'response': 'Cash deposited, balance updated instantly', 'benefit': 'Physical cash becomes digital'},
        {'action': 'User buys electricity token', 'response': 'Token generated, sent via SMS, purchase logged', 'benefit': 'No queue at municipality office'},
        {'action': 'User sets up savings goal for school fees', 'response': 'Goal created, auto-save rule set (R500/month)', 'benefit': 'Automated discipline builds savings'},
        {'action': 'User scans QR at restaurant', 'response': 'Payment processed, loyalty points earned', 'benefit': 'Seamless payment with rewards'},
        {'action': 'User checks credit score in app', 'response': 'Credit profile displayed, BNPL offers shown', 'benefit': 'Financial visibility enables better decisions'},
    ]
    
    story.append(create_journey_table(styles, consumer_journey))
    
    story.append(PageBreak())
    
    # ===================== 13. MARKET ANALYSIS =====================
    add_section_header(story, styles, "13. Market Analysis & Opportunity", 1)
    
    add_section_header(story, styles, "Total Addressable Market", 2)
    
    market_data = [
        ['Segment', 'Market Size', 'Growth Rate', 'Groway Opportunity'],
        ['Digital Payments', '$180B', '25% CAGR', 'Consumer + Merchant transactions'],
        ['SME Software', '$12B', '18% CAGR', 'Merchant OS subscriptions'],
        ['B2B Commerce', '$45B', '22% CAGR', 'GroSupply marketplace GMV'],
        ['Consumer Credit', '$25B', '15% CAGR', 'BNPL + GroCredit lending'],
        ['Payment Gateway', '$8B', '30% CAGR', 'GoPay transaction fees'],
    ]
    
    table_data = []
    for i, row in enumerate(market_data):
        if i == 0:
            table_data.append([Paragraph(f"<b>{cell}</b>", header_style) for cell in row])
        else:
            table_data.append([Paragraph(cell, cell_style) for cell in row])
    
    market_table = Table(table_data, colWidths=[CONTENT_WIDTH*0.25, CONTENT_WIDTH*0.20, CONTENT_WIDTH*0.20, CONTENT_WIDTH*0.35])
    market_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(market_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    add_section_header(story, styles, "Competitive Advantages", 2)
    
    add_bullet_list(story, styles, [
        "<b>Vertical-Specific Design:</b> Unlike generic POS, each industry gets tailored workflows and compliance",
        "<b>Ecosystem Integration:</b> Consumer, merchant, and enterprise in one platform creates network effects",
        "<b>Offline-First:</b> Core functionality works without internet - critical for load-shedding Africa",
        "<b>Informal Business Focus:</b> Designed for Shisa Nyama, spaza shops, and shebeens, not just formal retail",
        "<b>Local Compliance:</b> Built-in POPIA, NCA, NCR, FSCA, SARB, SARS frameworks",
        "<b>Agent Network:</b> 5-tier referral creates viral growth without heavy marketing spend",
        "<b>B2B Credit:</b> GroCredit provides trade credit to underserved SMEs"
    ])
    
    story.append(PageBreak())
    
    # ===================== 14. TECHNICAL ARCHITECTURE =====================
    add_section_header(story, styles, "14. Technical Architecture", 1)
    
    add_body_text(story, styles, """The Groway platform is built on a modern, scalable architecture designed for the unique 
    challenges of African markets: intermittent connectivity, mobile-first users, and rapid growth requirements.""")
    
    add_section_header(story, styles, "Technology Stack", 2)
    
    tech_data = [
        ['Layer', 'Technology', 'Purpose'],
        ['Frontend', 'Next.js 16, React, TypeScript, Tailwind CSS', 'Mobile-first responsive applications'],
        ['Backend', 'Next.js API Routes, Node.js', 'Serverless API functions'],
        ['Database', 'Prisma ORM, SQLite/PostgreSQL', 'Type-safe data access, migrations'],
        ['Authentication', 'NextAuth.js, JWT, OAuth 2.0', 'Secure multi-tenant authentication'],
        ['Real-time', 'Socket.io, WebSocket', 'Live updates for POS, kitchen display'],
        ['Payments', 'GoPay Gateway, PCI-DSS Level 1', 'Secure payment processing'],
        ['Infrastructure', 'Netlify, Edge Functions', 'Global CDN, serverless scaling'],
        ['Monitoring', 'Sentry, Custom Analytics', 'Error tracking, performance monitoring'],
    ]
    
    table_data = []
    for i, row in enumerate(tech_data):
        if i == 0:
            table_data.append([Paragraph(f"<b>{cell}</b>", header_style) for cell in row])
        else:
            table_data.append([Paragraph(cell, cell_style) for cell in row])
    
    tech_table = Table(table_data, colWidths=[CONTENT_WIDTH*0.20, CONTENT_WIDTH*0.45, CONTENT_WIDTH*0.35])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tech_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    add_section_header(story, styles, "API Statistics", 2)
    
    api_stats = [
        {'value': '528+', 'label': 'API Endpoints'},
        {'value': '35', 'label': 'Microservices'},
        {'value': '99.98%', 'label': 'Uptime'},
        {'value': '<200ms', 'label': 'Avg Response'},
    ]
    story.append(create_stats_table(styles, api_stats))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Final section
    add_section_header(story, styles, "Document Information", 3)
    
    add_body_text(story, styles, """This document provides a comprehensive overview of the Groway Superapp Platform. For detailed 
    technical specifications, API documentation, or business inquiries, please contact the Groway team.""")
    
    story.append(Spacer(1, 0.3*inch))
    
    add_body_text(story, styles, """<b>Groway (Pty) Ltd</b><br/>
    Africa's Integrated Financial Operating System<br/>
    www.groway.co.za""")
    
    # Build PDF
    doc.build(story)
    
    print(f"Document created: {OUTPUT_PATH}")
    return OUTPUT_PATH

if __name__ == "__main__":
    build_document()
