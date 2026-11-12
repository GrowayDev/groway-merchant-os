import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents, LevelFormat
} from 'docx';
import * as fs from 'fs';

// Colors - "Midnight Code" palette for tech document
const colors = {
  primary: "020617",      // Midnight Black
  body: "1E293B",         // Deep Slate Blue
  secondary: "64748B",    // Cool Blue-Gray
  accent: "94A3B8",       // Steady Silver
  tableBg: "F8FAFC",      // Glacial Blue-White
  headerBg: "E2E8F0",     // Slate 200
};

// Table borders
const tableBorder = { style: BorderStyle.SINGLE, size: 6, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Numbering config for bullet lists
const numberingConfig = {
  config: [
    {
      reference: "bullet-list",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    },
    {
      reference: "bullet-list-2",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    },
    {
      reference: "numbered-list-1",
      levels: [{
        level: 0,
        format: LevelFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }
  ]
};

// Helper functions
function createHeading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Times New Roman", color: colors.primary })]
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman", color: colors.primary })]
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Times New Roman", color: colors.body })]
  });
}

function createBody(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100, line: 250 },
    children: [new TextRun({ text, size: 22, font: "Times New Roman", color: colors.body })]
  });
}

function createBullet(text: string, reference: string = "bullet-list"): Paragraph {
  return new Paragraph({
    numbering: { reference, level: 0 },
    spacing: { before: 50, after: 50, line: 250 },
    children: [new TextRun({ text, size: 22, font: "Times New Roman", color: colors.body })]
  });
}

function createTableCell(text: string, isHeader: boolean = false, width: number = 2340): TableCell {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: isHeader ? colors.headerBg : colors.tableBg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: isHeader, size: 20, font: "Times New Roman", color: colors.body })]
    })]
  });
}

// Document content
const doc = new Document({
  numbering: numberingConfig,
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Times New Roman", color: colors.primary },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman", color: colors.primary },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Times New Roman", color: colors.body },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [
    // Cover Page Section
    {
      properties: {
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
      },
      children: [
        new Paragraph({ spacing: { before: 4000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "GROWAY", bold: true, size: 72, font: "Times New Roman", color: colors.primary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "MERCHANT OS", bold: true, size: 56, font: "Times New Roman", color: colors.secondary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Product Document", size: 36, font: "Times New Roman", color: colors.body })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "Version 5.0 | February 2026", size: 24, font: "Times New Roman", color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 2000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Multi-Vertical Business Operating System", size: 28, font: "Times New Roman", color: colors.body })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "12 Business Verticals | 74 Sub-Verticals | 528+ API Endpoints", size: 22, font: "Times New Roman", color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 1500 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CONFIDENTIAL", bold: true, size: 20, font: "Times New Roman", color: colors.accent })]
        }),
      ]
    },
    // TOC Section
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Groway Merchant OS Product Document", size: 18, font: "Times New Roman", color: colors.secondary })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ text: " of ", size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Times New Roman", color: colors.secondary })
            ]
          })]
        })
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Times New Roman" })]
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3"
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "Note: Right-click the TOC and select 'Update Field' to refresh page numbers.", size: 18, font: "Times New Roman", color: colors.secondary, italics: true })]
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ]
    },
    // Main Content Section
    {
      properties: {
        page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Groway Merchant OS v5.0", size: 18, font: "Times New Roman", color: colors.secondary })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ text: " of ", size: 18, font: "Times New Roman", color: colors.secondary }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Times New Roman", color: colors.secondary })
            ]
          })]
        })
      },
      children: [
        // Executive Summary
        createHeading1("1. Executive Summary"),
        createBody("Groway Merchant OS is Africa's first multi-vertical business operating system, purpose-built for the South African market. Unlike generic POS systems, Merchant OS understands that a restaurant and a Shisa Nyama are legally, operationally, and culturally different businesses—each requiring its own POS layout, SKU catalogue, compliance rules, and chart of accounts."),
        createBody("This document provides a comprehensive specification of the Merchant OS product as implemented in the current build, covering all 12 business verticals, 74 sub-verticals, and integrated modules including GroSupply Pro, GroMarketing, GroCredit, and GoPay."),

        createHeading2("1.1 Platform Statistics"),
        new Table({
          columnWidths: [4680, 4680],
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          rows: [
            new TableRow({
              children: [
                createTableCell("Metric", true, 4680),
                createTableCell("Value", true, 4680)
              ]
            }),
            new TableRow({ children: [createTableCell("Business Verticals", false, 4680), createTableCell("12", false, 4680)] }),
            new TableRow({ children: [createTableCell("Sub-Verticals", false, 4680), createTableCell("74", false, 4680)] }),
            new TableRow({ children: [createTableCell("API Endpoints", false, 4680), createTableCell("528+", false, 4680)] }),
            new TableRow({ children: [createTableCell("Microservices", false, 4680), createTableCell("35", false, 4680)] }),
            new TableRow({ children: [createTableCell("Database Tables", false, 4680), createTableCell("206+", false, 4680)] }),
            new TableRow({ children: [createTableCell("Countries Supported", false, 4680), createTableCell("6+", false, 4680)] }),
            new TableRow({ children: [createTableCell("Active Merchants", false, 4680), createTableCell("15,000+", false, 4680)] }),
          ]
        }),

        createHeading2("1.2 Core Differentiators"),
        createBullet("Vertical-specific POS layouts with industry-appropriate workflows"),
        createBullet("Pre-loaded SKU catalogues with 150-2,500 items per vertical"),
        createBullet("Auto-configured Chart of Accounts per vertical"),
        createBullet("Built-in compliance overlays (Liquor License, Health & Beauty, Pharmacy)"),
        createBullet("Integrated B2B procurement via GroSupply Marketplace"),
        createBullet("Working capital financing via GroCredit with NCA compliance"),
        createBullet("Multi-channel marketing automation via GroMarketing"),
        createBullet("Instant payment processing via GoPay with PayShap rail"),

        // Business Verticals
        createHeading1("2. Business Verticals"),
        createBody("Merchant OS supports 12 distinct business verticals, each with specialized sub-verticals, pre-configured settings, and vertical-specific features. When a merchant selects their vertical and sub-vertical, the system auto-configures POS layouts, SKU catalogues, compliance rules, and accounting structures."),

        // Vertical 1: Food & Beverage
        createHeading2("2.1 Food & Beverage"),
        createBody("The Food & Beverage vertical covers all food service establishments from Quick Service Restaurants to Cloud Kitchens. Each sub-vertical has specialized features for their unique operational needs."),
        createHeading3("Sub-Verticals (8):"),
        createBullet("Quick Service Restaurant (QSR) - 245 SKUs: Drive-through mode, combo builder, KDS integration"),
        createBullet("Sit-Down Restaurant - 312 SKUs: Table management, course ordering, bill splitting"),
        createBullet("Shisa Nyama - 178 SKUs: Braai pit tracking, meat by weight, pap & sides combos"),
        createBullet("Coffee Shop - 156 SKUs: Coffee customization, loyalty stamps, mobile ordering"),
        createBullet("Bakery - 189 SKUs: Batch tracking, expiry alerts, custom orders"),
        createBullet("Food Truck - 89 SKUs: GPS tracking, mobile POS, event mode"),
        createBullet("Cloud Kitchen - 234 SKUs: Multi-brand orders, delivery integration, prep timer"),
        createBullet("Catering Service - 167 SKUs: Event quotes, menu packages, deposit handling"),

        // Vertical 2: Liquor & Nightlife
        createHeading2("2.2 Liquor & Nightlife"),
        createBody("The Liquor & Nightlife vertical includes comprehensive compliance features for South African liquor licensing requirements, including RSA certifications, age verification, and excise register management."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Liquor Store - 456 SKUs: Age verification, case discounts, loyalty points"),
        createBullet("Bar/Pub - 234 SKUs: Tab management, happy hour, table tabs"),
        createBullet("Nightclub - 167 SKUs: Entry tickets, VIP sections, guest list"),
        createBullet("Shebeen - 89 SKUs: Simple pricing, credit tabs, wholesale"),
        createBullet("Bottle Store - 312 SKUs: Bulk pricing, deposit system, delivery"),
        createBullet("Wine Farm - 198 SKUs: Tasting menu, cellar door, wine club"),

        // Vertical 3: Grocery & FMCG
        createHeading2("2.3 Grocery & FMCG"),
        createBody("The Grocery & FMCG vertical serves retail establishments selling fast-moving consumer goods, with support for high-volume barcode scanning, promotions, and supplier integration via GroSupply."),
        createHeading3("Sub-Verticals (7):"),
        createBullet("Superette - 1,234 SKUs: Barcode scanning, promotions, loyalty"),
        createBullet("Spaza Shop - 567 SKUs: Simple POS, credit customers, airtime"),
        createBullet("Butchery - 234 SKUs: Weight pricing, custom cuts, bulk orders"),
        createBullet("Deli - 345 SKUs: Weight items, made-to-order, platters"),
        createBullet("Farm Stall - 289 SKUs: Fresh produce, seasonal items, local products"),
        createBullet("Cash & Carry - 2,345 SKUs: Wholesale pricing, bulk discounts, business accounts"),
        createBullet("Bakery Retail - 178 SKUs: Fresh daily, custom orders, wholesale"),

        // Vertical 4: Health & Beauty
        createHeading2("2.4 Health & Beauty"),
        createBody("The Health & Beauty vertical focuses on appointment-based services with integrated booking, staff management, and customer loyalty features. Includes specialized appointment scheduling and treatment packages."),
        createHeading3("Sub-Verticals (7):"),
        createBullet("Hair Salon - 145 SKUs: Appointment booking, stylist roster, service combos"),
        createBullet("Barber Shop - 78 SKUs: Quick services, queue management, membership"),
        createBullet("Nail Salon - 134 SKUs: Design catalog, appointment, loyalty"),
        createBullet("Spa & Wellness - 189 SKUs: Treatment menu, package deals, gift vouchers"),
        createBullet("Aesthetic Clinic - 156 SKUs: Consultations, treatment plans, consent forms"),
        createBullet("Tattoo Studio - 89 SKUs: Custom quotes, deposit handling, aftercare"),
        createBullet("Lash & Brow Studio - 67 SKUs: Service menu, appointments, loyalty"),

        // Vertical 5: Fashion & Apparel
        createHeading2("2.5 Fashion & Apparel"),
        createBody("The Fashion & Apparel vertical supports retail clothing and accessories businesses with size matrix management, lay-bye functionality, and gift card integration."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Clothing Boutique - 345 SKUs: Size matrix, style catalog, lay-bye"),
        createBullet("Shoe Store - 234 SKUs: Size/width matrix, special orders, repairs"),
        createBullet("Accessories Store - 267 SKUs: Style matching, gift wrapping, returns"),
        createBullet("Uniform Supplier - 189 SKUs: Bulk orders, embroidery, corporate accounts"),
        createBullet("Second-hand/Thrift - 456 SKUs: Unique items, consignment, donations"),
        createBullet("Tailor Shop - 89 SKUs: Custom measurements, alterations, fittings"),

        // Vertical 6: Health & Pharmacy
        createHeading2("2.6 Health & Pharmacy"),
        createBody("The Health & Pharmacy vertical includes comprehensive compliance features for pharmaceutical retail, including SAHPRA compliance, script processing, and medical aid claims integration."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Full Pharmacy - 1,567 SKUs: Script processing, SAHPRA compliance, dispensing labels"),
        createBullet("Health Shop (OTC) - 567 SKUs: OTC only, supplements, advice notes"),
        createBullet("Herbal Medicine - 234 SKUs: Traditional remedies, consultations, custom blends"),
        createBullet("Optometry Practice - 345 SKUs: Eye tests, frame catalog, lens options"),
        createBullet("Dental Practice - 189 SKUs: Treatment codes, medical aid, appointments"),
        createBullet("Veterinary Practice - 267 SKUs: Pet records, vaccinations, prescriptions"),

        // Vertical 7: Hospitality
        createHeading2("2.7 Hospitality"),
        createBody("The Hospitality vertical provides comprehensive accommodation management with room bookings, guest folios, and integration with online booking platforms."),
        createHeading3("Sub-Verticals (7):"),
        createBullet("Hotel - 234 SKUs: Room management, check-in/out, billing"),
        createBullet("Guest House - 89 SKUs: Room booking, breakfast, payments"),
        createBullet("Bed & Breakfast - 67 SKUs: Simple booking, breakfast incl., calendar"),
        createBullet("Backpackers/Hostel - 78 SKUs: Dorm beds, activities, check-in"),
        createBullet("Lodge - 145 SKUs: Game drives, packages, transfers"),
        createBullet("Self-Catering - 56 SKUs: Unit types, cleaning fees, deposits"),
        createBullet("Airbnb-style Host - 34 SKUs: Guest management, cleaning, reviews"),

        // Vertical 8: Hardware & Building
        createHeading2("2.8 Hardware & Building"),
        createBody("The Hardware & Building vertical serves construction and home improvement retailers with contractor accounts, bulk pricing, and quote management. Integrates with GroSupply for B2B procurement."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Hardware Store - 2,345 SKUs: Bulk pricing, delivery, contractor accounts"),
        createBullet("Building Supplies - 1,234 SKUs: Quote builder, delivery, bulk orders"),
        createBullet("Paint Shop - 345 SKUs: Color matching, custom mixing, coverage calc"),
        createBullet("Plumbing Supplies - 567 SKUs: Parts catalog, contractor prices, quotes"),
        createBullet("Electrical Supplies - 489 SKUs: Parts catalog, certification, safety"),
        createBullet("Agri-Supply - 678 SKUs: Seasonal stock, bulk feed, equipment"),

        // Vertical 9: Electronics & Tech
        createHeading2("2.9 Electronics & Tech"),
        createBody("The Electronics & Tech vertical supports technology retail and repair services with warranty tracking, repair job cards, and trade-in functionality."),
        createHeading3("Sub-Verticals (4):"),
        createBullet("Phone & Accessories - 456 SKUs: Device catalog, repairs, trade-in"),
        createBullet("Computer & IT Store - 567 SKUs: Build-to-order, service contracts, warranty"),
        createBullet("Electronics Retail - 789 SKUs: Extended warranty, installation, finance"),
        createBullet("Repair Workshop - 234 SKUs: Service tickets, parts tracking, quotes"),

        // Vertical 10: Sport & Leisure
        createHeading2("2.10 Sport & Leisure"),
        createBody("The Sport & Leisure vertical covers fitness and entertainment businesses with membership management, class booking, and facility scheduling."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Gym - 89 SKUs: Memberships, check-in, PT sessions"),
        createBullet("Fitness Studio - 67 SKUs: Class packs, memberships, booking"),
        createBullet("Sports Club - 145 SKUs: Memberships, bar tab, facility booking"),
        createBullet("Events Venue - 234 SKUs: Venue hire, catering, deposits"),
        createBullet("Entertainment Centre - 178 SKUs: Game credits, party packs, memberships"),
        createBullet("Escape Room - 34 SKUs: Room booking, time slots, group packages"),

        // Vertical 11: Childcare & Education
        createHeading2("2.11 Childcare & Education"),
        createBody("The Childcare & Education vertical provides tools for educational institutions including attendance tracking, billing, and parent portals."),
        createHeading3("Sub-Verticals (5):"),
        createBullet("Crèche/Daycare - 45 SKUs: Monthly fees, attendance, reports"),
        createBullet("After-School Care - 34 SKUs: Daily rates, activities, pickup tracking"),
        createBullet("Tutoring Centre - 56 SKUs: Subject packages, booking, progress"),
        createBullet("Driving School - 23 SKUs: Lesson packages, booking, test prep"),
        createBullet("Skills Training Centre - 78 SKUs: Course catalog, certificates, payments"),

        // Vertical 12: Professional Services
        createHeading2("2.12 Professional Services"),
        createBody("The Professional Services vertical supports service-based businesses with job card management, hourly billing, and document storage."),
        createHeading3("Sub-Verticals (6):"),
        createBullet("Auto Repair Shop - 345 SKUs: Service menu, parts, job cards"),
        createBullet("Dry Cleaner - 67 SKUs: Item pricing, tracking, delivery"),
        createBullet("Funeral Home - 89 SKUs: Packages, policy claims, accounts"),
        createBullet("Legal Services - 45 SKUs: Hourly billing, matter tracking, trust account"),
        createBullet("Accounting Practice - 34 SKUs: Hourly billing, client portal, tax calendar"),
        createBullet("Tutoring/School - 56 SKUs: Subject packages, schedules, reports"),

        // Core Modules
        createHeading1("3. Core Modules"),
        createBody("Merchant OS comprises multiple integrated modules that work seamlessly together. Each module is designed to be vertical-aware, adapting its functionality based on the merchant's selected business type."),

        // POS Module
        createHeading2("3.1 Point of Sale (POS)"),
        createBody("The multi-vertical POS system adapts its interface and functionality based on the merchant's business type. Key features include:"),
        createBullet("Vertical-specific screen layouts optimized for each business type"),
        createBullet("Offline mode with automatic sync when connectivity returns"),
        createBullet("Multiple payment methods including cash, card, QR, and mobile money"),
        createBullet("Tip management and cash drawer tracking"),
        createBullet("Staff PIN verification and role-based access"),
        createBullet("Shift management with opening/closing procedures"),
        createBullet("Void and refund processing with reason tracking"),
        createBullet("Bill splitting and partial payments"),

        // Kitchen Display System
        createHeading2("3.2 Kitchen Display System (KDS)"),
        createBody("The Kitchen Display System is designed for Food & Beverage verticals, providing real-time order management:"),
        createBullet("Multi-station routing (Grill, Fry, Cold Station, Bar)"),
        createBullet("Order prioritization with timers and alerts"),
        createBullet("Dietary and allergen flags"),
        createBullet("Order bumping and completion tracking"),
        createBullet("Preparation time estimation"),
        createBullet("Integration with table floor plans"),

        // Recipe Engine
        createHeading2("3.3 Recipe Engine"),
        createBody("The Recipe Engine manages food preparation with automatic inventory deduction:"),
        createBullet("Recipe management with ingredient lists"),
        createBullet("Automatic stock deduction on sale"),
        createBullet("Cost calculation per recipe"),
        createBullet("Allergen and dietary tracking"),
        createBullet("Preparation time and station assignment"),
        createBullet("Yield management and portion control"),

        // Table Floor Plans
        createHeading2("3.4 Table Floor Plans"),
        createBody("Table management for restaurants and bars:"),
        createBullet("Visual table layout editor"),
        createBullet("Section and server assignment"),
        createBullet("Table status tracking (available, occupied, reserved, cleaning)"),
        createBullet("Reservation management with deposit handling"),
        createBullet("Order-to-table linking"),
        createBullet("Guest count and spending tracking"),

        // Booking & Appointments
        createHeading2("3.5 Booking & Appointments"),
        createBody("Comprehensive appointment scheduling for service businesses:"),
        createBullet("Service catalog with duration and pricing"),
        createBullet("Staff roster and availability management"),
        createBullet("Online booking widget integration"),
        createBullet("Deposit collection with online payment"),
        createBullet("Automated SMS/WhatsApp reminders"),
        createBullet("Recurring appointment scheduling"),
        createBullet("Membership and package management"),

        // Hotel Management
        createHeading2("3.6 Hotel Management"),
        createBody("Full hospitality management for accommodation businesses:"),
        createBullet("Room inventory and status management"),
        createBullet("Guest profile and history"),
        createBullet("Reservation management with channel integration"),
        createBullet("Guest folio with charge posting"),
        createBullet("Check-in/check-out workflows"),
        createBullet("Housekeeping status tracking"),

        // Inventory Management
        createHeading2("3.7 Inventory Management"),
        createBody("Comprehensive inventory control across all verticals:"),
        createBullet("Multi-location stock management"),
        createBullet("Stock movements and transfers"),
        createBullet("Reorder alerts and purchase suggestions"),
        createBullet("Batch and expiry tracking"),
        createBullet("Stock take and variance reporting"),
        createBullet("Integration with GroSupply for procurement"),

        // Accounting
        createHeading2("3.8 Accounting"),
        createBody("Built-in accounting with vertical-specific chart of accounts:"),
        createBullet("Auto-configured chart of accounts per vertical"),
        createBullet("Journal entry management"),
        createBullet("Invoice and bill processing"),
        createBullet("Trial balance and financial statements"),
        createBullet("Bank feed integration"),
        createBullet("VAT return generation"),
        createBullet("Budget management and comparison"),

        // CRM & Customers
        createHeading2("3.9 CRM & Customers"),
        createBody("Customer relationship management with loyalty integration:"),
        createBullet("Customer profiles with purchase history"),
        createBullet("Loyalty program with tier-based rewards"),
        createBullet("Customer segmentation for marketing"),
        createBullet("Credit customer management"),
        createBullet("Gift card and voucher management"),
        createBullet("Allergy profiles for Health & Beauty"),

        // Staff & HR
        createHeading2("3.10 Staff & HR"),
        createBody("Human resources management for merchants:"),
        createBullet("Staff profiles and roles"),
        createBullet("PIN-based authentication"),
        createBullet("Shift scheduling and management"),
        createBullet("Commission tracking"),
        createBullet("Performance metrics"),
        createBullet("RSA certification tracking for Liquor vertical"),

        // Compliance Modules
        createHeading2("3.11 Compliance Modules"),
        createBody("Industry-specific compliance features:"),
        createBullet("Liquor Compliance: Age verification, RSA certifications, excise register, trading hours enforcement"),
        createBullet("Health & Beauty: License tracking, allergy profiles, treatment consent"),
        createBullet("Pharmacy: SAHPRA compliance, script processing, dispensing labels"),

        // Multi-Location
        createHeading2("3.12 Multi-Location"),
        createBody("Enterprise features for multi-branch businesses:"),
        createBullet("Branch management and configuration"),
        createBullet("Inter-branch stock transfers"),
        createBullet("Consolidated financial reporting"),
        createBullet("Centralized customer database"),
        createBullet("Role-based access control"),

        // Integrated Products
        createHeading1("4. Integrated Products"),
        createBody("Merchant OS integrates seamlessly with other Groway platform products, creating a unified business ecosystem."),

        // GroSupply Pro
        createHeading2("4.1 GroSupply Pro"),
        createBody("Integrated B2B procurement marketplace with direct POS integration:"),
        createBullet("334 verified suppliers across 12 verticals"),
        createBullet("RFQ (Request for Quotation) management"),
        createBullet("Purchase order creation and tracking"),
        createBullet("Goods Received Notes (GRN) with 3-way matching"),
        createBullet("Supplier rating and review system"),
        createBullet("Vertical-aligned supplier recommendations via GroAI"),
        createBullet("Integration with GroCredit for supplier financing"),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          rows: [
            new TableRow({
              children: [
                createTableCell("Feature", true, 3120),
                createTableCell("Description", true, 3120),
                createTableCell("Benefit", true, 3120)
              ]
            }),
            new TableRow({ children: [createTableCell("Supplier Network", false, 3120), createTableCell("334 verified suppliers", false, 3120), createTableCell("Choice and competition", false, 3120)] }),
            new TableRow({ children: [createTableCell("RFQ System", false, 3120), createTableCell("Request quotes from multiple suppliers", false, 3120), createTableCell("Best pricing", false, 3120)] }),
            new TableRow({ children: [createTableCell("3-Way Match", false, 3120), createTableCell("PO vs Invoice vs GRN", false, 3120), createTableCell("Fraud prevention", false, 3120)] }),
            new TableRow({ children: [createTableCell("GroSettle", false, 3120), createTableCell("Instant supplier payments", false, 3120), createTableCell("Early payment discounts", false, 3120)] }),
          ]
        }),

        // GroMarketing
        createHeading2("4.2 GroMarketing"),
        createBody("Multi-channel marketing automation with AI-powered insights:"),
        createBullet("Campaign management across WhatsApp, SMS, Email, Push"),
        createBullet("Customer segmentation with RFM analysis"),
        createBullet("Promotional offers and discount management"),
        createBullet("Campaign analytics and ROI tracking"),
        createBullet("GroAI marketing insights and recommendations"),
        createBullet("Automated birthday and win-back campaigns"),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          rows: [
            new TableRow({
              children: [
                createTableCell("Channel", true, 3120),
                createTableCell("Avg Open Rate", true, 3120),
                createTableCell("Cost (ZAR)", true, 3120)
              ]
            }),
            new TableRow({ children: [createTableCell("WhatsApp", false, 3120), createTableCell("42%", false, 3120), createTableCell("0.30 per message", false, 3120)] }),
            new TableRow({ children: [createTableCell("SMS", false, 3120), createTableCell("18.5%", false, 3120), createTableCell("0.50 per SMS", false, 3120)] }),
            new TableRow({ children: [createTableCell("Email", false, 3120), createTableCell("35.2%", false, 3120), createTableCell("Included", false, 3120)] }),
            new TableRow({ children: [createTableCell("Push Notification", false, 3120), createTableCell("28%", false, 3120), createTableCell("Included", false, 3120)] }),
          ]
        }),

        // GroCredit
        createHeading2("4.3 GroCredit"),
        createBody("Merchant working capital financing with NCA compliance:"),
        createBullet("Credit tiers from R5,000 to R500,000"),
        createBullet("Interest rates from 11.5% to 15.5% per annum"),
        createBullet("Automatic repayment from POS sales"),
        createBullet("GroSupply integration for direct supplier payment"),
        createBullet("NCA compliant with full disclosure"),
        createBullet("24-hour approval process"),
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          rows: [
            new TableRow({
              children: [
                createTableCell("Tier", true, 2340),
                createTableCell("Limit", true, 2340),
                createTableCell("Interest Rate", true, 2340),
                createTableCell("Term", true, 2340)
              ]
            }),
            new TableRow({ children: [createTableCell("Starter", false, 2340), createTableCell("R5K - R25K", false, 2340), createTableCell("15.5% p.a.", false, 2340), createTableCell("Up to 6 months", false, 2340)] }),
            new TableRow({ children: [createTableCell("Business", false, 2340), createTableCell("R25K - R100K", false, 2340), createTableCell("13.25% p.a.", false, 2340), createTableCell("Up to 12 months", false, 2340)] }),
            new TableRow({ children: [createTableCell("Enterprise", false, 2340), createTableCell("R100K - R500K", false, 2340), createTableCell("11.5% p.a.", false, 2340), createTableCell("Up to 36 months", false, 2340)] }),
            new TableRow({ children: [createTableCell("Seasonal", false, 2340), createTableCell("R10K - R75K", false, 2340), createTableCell("12.75% p.a.", false, 2340), createTableCell("3-6 months", false, 2340)] }),
          ]
        }),

        // GoPay
        createHeading2("4.4 GoPay"),
        createBody("Instant payment gateway integrated directly into POS:"),
        createBullet("6 South African bank integrations"),
        createBullet("PayShap rail for instant payments"),
        createBullet("Instant EFT with <60 second settlement"),
        createBullet("Card processing with PCI DSS Level 1 compliance"),
        createBullet("QR payments via Groway Consumer Wallet"),
        createBullet("Transaction fees from 0.5% to 1.5%"),

        // Value Added Services
        createHeading1("5. Value Added Services (VAS)"),
        createBody("Each vertical has access to specific value-added services that enhance the merchant's business capabilities:"),

        new Table({
          columnWidths: [2340, 7020],
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          rows: [
            new TableRow({
              children: [
                createTableCell("Vertical", true, 2340),
                createTableCell("Available VAS", true, 7020)
              ]
            }),
            new TableRow({ children: [createTableCell("Food & Beverage", false, 2340), createTableCell("GoPay Payments, QR Digital Menu, GroSupply, Airtime, Geo-Discovery, Mini Online Store", false, 7020)] }),
            new TableRow({ children: [createTableCell("Liquor & Nightlife", false, 2340), createTableCell("GoPay Payments, GroSupply, Airtime, Geo-Discovery, Vouchers", false, 7020)] }),
            new TableRow({ children: [createTableCell("Grocery & FMCG", false, 2340), createTableCell("GoPay Payments, GroSupply, Airtime, Utility Bills, Vouchers, GroCredit", false, 7020)] }),
            new TableRow({ children: [createTableCell("Health & Beauty", false, 2340), createTableCell("GoPay Payments, Appointments, Loyalty, Geo-Discovery, Mini Online Store", false, 7020)] }),
            new TableRow({ children: [createTableCell("Fashion & Apparel", false, 2340), createTableCell("GoPay Payments, Lay-bye, Gift Cards, Geo-Discovery, Mini Online Store", false, 7020)] }),
            new TableRow({ children: [createTableCell("Health & Pharmacy", false, 2340), createTableCell("GoPay Payments, Medical Aid Claims, Script Reminders, GroSupply, Geo-Discovery", false, 7020)] }),
            new TableRow({ children: [createTableCell("Hospitality", false, 2340), createTableCell("GoPay Payments, Bookings, QR Check-in, Geo-Discovery, Mini Online Store", false, 7020)] }),
            new TableRow({ children: [createTableCell("Hardware & Building", false, 2340), createTableCell("GoPay Payments, GroSupply, Quotes, Delivery, Contractor Accounts", false, 7020)] }),
            new TableRow({ children: [createTableCell("Electronics & Tech", false, 2340), createTableCell("GoPay Payments, Warranty, Repair Tracking, GroSupply, Trade-in", false, 7020)] }),
            new TableRow({ children: [createTableCell("Sport & Leisure", false, 2340), createTableCell("GoPay Payments, Memberships, Booking, Geo-Discovery, Loyalty", false, 7020)] }),
            new TableRow({ children: [createTableCell("Childcare & Education", false, 2340), createTableCell("GoPay Payments, Attendance, Billing, Parent Portal, Reports", false, 7020)] }),
            new TableRow({ children: [createTableCell("Professional Services", false, 2340), createTableCell("GoPay Payments, Job Cards, Invoicing, Reminders, Document Storage", false, 7020)] }),
          ]
        }),

        // Auto-Configuration
        createHeading1("6. Auto-Configuration System"),
        createBody("When a merchant selects their vertical and sub-vertical, Merchant OS automatically configures the following elements:"),

        createBullet("Chart of Accounts: Vertical-appropriate accounting structure with relevant expense categories and revenue accounts"),
        createBullet("SKU Catalogue: Pre-loaded product catalog with 50-2,500 items depending on vertical"),
        createBullet("Compliance Overlays: Industry-specific compliance requirements and forms"),
        createBullet("VAT Treatment: Correct VAT handling for the business type"),
        createBullet("POS Screen Layout: Optimized button layout for the specific business workflow"),
        createBullet("Digital Menu: QR-code accessible menu for F&B verticals"),
        createBullet("Geo-Discovery Tags: Location-based discovery settings"),
        createBullet("Loyalty Categories: Appropriate loyalty point categories"),
        createBullet("Supplier Catalogue: Relevant suppliers from GroSupply network"),
        createBullet("VAS Tiles: Relevant value-added services displayed"),

        // Database Architecture
        createHeading1("7. Technical Architecture"),
        createBody("Merchant OS is built on a modern microservices architecture with the following technical specifications:"),

        createHeading2("7.1 Database"),
        createBullet("Prisma ORM with support for SQLite (development), PostgreSQL, and MySQL"),
        createBullet("206+ database tables covering all modules"),
        createBullet("Comprehensive indexing for performance"),
        createBullet("Soft delete support for audit trails"),

        createHeading2("7.2 API Architecture"),
        createBullet("528+ RESTful API endpoints"),
        createBullet("Vertical-aware request handling"),
        createBullet("JWT-based authentication"),
        createBullet("Role-based access control"),
        createBullet("Rate limiting and request validation"),

        createHeading2("7.3 Key Database Models"),
        createBody("Core models include: User, Session, Post, FloorSection, RestaurantTable, Server, TableReservation, TableOrder, KitchenStation, KitchenOrder, KitchenOrderItem, Ingredient, Recipe, StockDeduction, BookingService, Staff, Customer, Appointment, Supplier, RFQ, PurchaseOrder, GoodsReceivedNote, HotelRoom, HotelGuest, HotelReservation, HotelFolio, AgeVerification, LiquorLicense, ExciseRegister, RSACertification, and many more."),

        // Compliance
        createHeading1("8. Compliance & Security"),
        createBody("Merchant OS is designed with South African regulatory compliance as a core principle:"),

        createHeading2("8.1 Regulatory Compliance"),
        createBullet("POPIA: Data protection compliance with consent management"),
        createBullet("PCI DSS Level 1: Payment card industry security standards"),
        createBullet("NCA: National Credit Act compliance for GroCredit"),
        createBullet("SARB: South African Reserve Bank regulations for payments"),
        createBullet("SAHPRA: Pharmacy compliance for Health & Pharmacy vertical"),
        createBullet("Liquor License: Comprehensive liquor law compliance"),

        createHeading2("8.2 Security Features"),
        createBullet("End-to-end encryption for all financial transactions"),
        createBullet("Role-based access control with granular permissions"),
        createBullet("Audit logging for all system actions"),
        createBullet("PIN-based staff authentication"),
        createBullet("Secure offline data storage with encryption"),

        // Conclusion
        createHeading1("9. Conclusion"),
        createBody("Groway Merchant OS represents a paradigm shift in business software for South Africa. By recognizing that different business types have fundamentally different operational, legal, and cultural requirements, Merchant OS delivers a truly purpose-built solution for each vertical."),
        createBody("With 12 business verticals, 74 sub-verticals, integrated procurement via GroSupply, marketing automation via GroMarketing, working capital via GroCredit, and instant payments via GoPay, Merchant OS provides everything a South African merchant needs to run and grow their business."),
        createBody("The platform continues to evolve with regular updates adding new features, verticals, and integrations, ensuring that Groway merchants always have access to the most advanced business tools available."),

        // Document info
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "— End of Document —", size: 20, font: "Times New Roman", color: colors.secondary, italics: true })]
        }),
      ]
    }
  ]
});

// Generate the document
async function generateDocument() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('/home/z/my-project/public/downloads/Groway_Merchant_OS_Product_Document.docx', buffer);
  console.log('Merchant OS Product Document generated successfully!');
}

generateDocument().catch(console.error);
