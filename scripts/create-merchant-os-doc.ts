const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel, 
        BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme - "Midnight Code" for tech
const colors = {
  primary: "#020617",
  body: "#1E293B",
  secondary: "#64748B",
  accent: "#94A3B8",
  tableBg: "#F8FAFC",
  headerBg: "#E2E8F0"
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-1",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-2",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num-list-3",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    // Cover Page Section
    {
      properties: {
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
      },
      children: [
        new Paragraph({ spacing: { before: 6000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1200 },
          children: [new TextRun({ text: "GROWAY", size: 72, bold: true, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: "MERCHANT OS", size: 56, bold: true, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
          children: [new TextRun({ text: "Product Specification Document", size: 28, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Version 4.0 | February 2026", size: 24, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Complete Business Operating System", size: 24, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "POS | Inventory | Accounting | CRM | HR | Analytics", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "11 Business Verticals | 35 Microservices | 206 Database Tables", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "PCI DSS L1 | SARB | FSCA | NCR | POPIA | FICA | BCEA | NCA Compliant", size: 20, color: colors.accent, font: "Times New Roman" })]
        })
      ]
    },
    // Main Content Section
    {
      properties: {
        page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({ 
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Groway Merchant OS | Product Document", size: 18, color: colors.secondary })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Page ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), new TextRun({ text: " of ", size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })]
        })] })
      },
      children: [
        // TOC
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Table of Contents")] }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 },
          children: [new TextRun({ text: "Note: Right-click the Table of Contents and select 'Update Field' to refresh page numbers.", size: 18, color: "999999", italics: true })]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // Section 1: Executive Summary
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Executive Summary")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Groway Merchant OS is a comprehensive business operating system designed to replace multiple standalone systems for South African merchants. The platform integrates Point of Sale (POS), inventory management, accounting, CRM, HR/payroll, and advanced analytics into a single, cohesive solution. Engineered to compete directly with global platforms like Square, Shopify POS, and Yoco, Merchant OS provides enterprise-grade tools to merchants of all sizes.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The platform supports 11 business verticals including Food & Beverage, Liquor, Grocery, Health & Beauty, Fashion, Pharmacy, Hospitality, Hardware, Electronics, Sport, and Professional Services. Each vertical receives specialized features and compliance tooling tailored to their industry requirements.", font: "Times New Roman", size: 22 })]
        }),
        
        // Key Metrics Table
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Platform Metrics")] }),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Metric", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Value", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Description", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "API Endpoints", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "528+", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Complete REST API coverage", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Microservices", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "35", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Domain-separated services", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Business Verticals", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Industry-specific support", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Database Tables", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "206", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PostgreSQL 15 schema", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Build Sprints", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "32", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "64 weeks to production", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 1: Merchant OS Platform Metrics", size: 18, italics: true, color: colors.secondary })] }),

        // Section 2: System Architecture
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. System Architecture")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS is built on a cloud-native, microservices-based architecture deployed exclusively on AWS af-south-1 (Cape Town), ensuring South African data residency compliance with POPIA. The platform is multi-tenant with strict Row-Level Security enforced at the PostgreSQL layer.", font: "Times New Roman", size: 22 })]
        }),
        
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Technology Stack")] }),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Layer", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Technology", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Purpose", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Mobile App", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "React Native (Expo)", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Cross-platform mobile", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Web Dashboard", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Next.js 14 + TypeScript", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Back-office management", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "POS Offline Mode", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Electron + SQLite", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "72-hour offline capability", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Backend Services", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Node.js 20 + Fastify", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "High I/O throughput", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Database", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PostgreSQL 15 + RLS", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Multi-tenant isolation", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Cache Layer", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Redis 7 Cluster", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Session & rate limiting", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Containerisation", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Docker + AWS EKS", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Auto-scaling, blue-green", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 2: Technology Stack Overview", size: 18, italics: true, color: colors.secondary })] }),

        // Section 3: Core Modules
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Core Modules")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS comprises interconnected modules that work together seamlessly. Each module is designed to replace standalone systems while providing deep integration with other platform components.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Point of Sale (POS)")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "The POS engine is the transaction-facing component used at the till. It supports multiple tender types, offline operation, and vertical-aware line items.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Transaction processing with cash, card, wallet, and BNPL tender options", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Vertical-aware line items with industry-specific modifiers", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "72-hour offline buffer with auto-sync on reconnect", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "QR code generation for customer payments (static and dynamic)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "NFC tap payment support", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Inventory Management")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "Comprehensive inventory management supporting up to 3,930+ SKUs per merchant with batch tracking, expiry management, and multi-location support.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "SKU management with barcode scanning integration", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Batch and expiry tracking with FIFO enforcement", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Multi-location stock management with transfers", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Automated reorder alerts and purchase order generation", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Stocktake and variance reporting", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Accounting & Finance")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "Double-entry ledger system with full South African compliance, bank feeds from 6 major banks, and AI-powered financial insights.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Double-entry ledger with chart of accounts", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Bank feeds integration with 6 SA banks", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "VAT 201 return preparation and submission", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Invoice and quote management", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "P&L and cash flow statements", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "JAX AI integration for natural language accounting queries", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 CRM & Loyalty")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "Customer relationship management with RFM analytics, loyalty programme engine, and WhatsApp campaign integration.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Customer profiles with transaction history", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "RFM (Recency, Frequency, Monetary) analytics scoring", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "4-tier loyalty programme (Bronze, Silver, Gold, Platinum)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "WhatsApp Business API campaign engine", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Customer segmentation and targeting", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Churn prediction alerts", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5 Staff & HR/Payroll")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "Complete human resources management including payroll, leave management, and BCEA compliance.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Employee records and role-based permissions", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Clock in/out with timesheet management", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "PAYE, UIF, SDL calculations", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Payslip generation and distribution", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "IRP5 and EMP201 filing", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Leave management with BCEA compliance", size: 22 })] }),

        // Section 4: Business Verticals
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Business Verticals")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS supports 11 primary business verticals, each with specialized features, compliance tooling, and industry-specific workflows.", font: "Times New Roman", size: 22 })]
        }),
        new Table({
          columnWidths: [2340, 3510, 3510],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vertical", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Specialized Features", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Compliance", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Food & Beverage", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "KDS, Table management, Recipe engine", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Health certificates, Food safety", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Liquor", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Age verification, Trading hours", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Liquor licence, RSA certification", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Grocery", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Scale integration, Perishables tracking", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Health inspections, Weights & measures", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Health & Beauty", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Appointment booking, Treatment tracking", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Health licences, Professional registration", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Pharmacy", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Prescription management, Schedule drugs", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "SAHPRA, Medical aid billing", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hospitality", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Room folio, PMS overlay, Channel manager", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Tourism grading, Guest register", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hardware", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Contractor accounts, Bulk pricing", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Building regulations, Safety standards", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Fashion", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Size/colour matrix, Seasonal collections", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Consumer protection, Returns policy", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Electronics", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Serial tracking, Warranty management", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "E-waste compliance, ICASA", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Sport", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Equipment rental, Team accounts", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Safety certifications", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Professional Services", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Time billing, Project tracking", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Professional body registration", size: 20 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 3: Business Verticals and Specialized Features", size: 18, italics: true, color: colors.secondary })] }),

        // Section 5: JAX AI Integration
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. JAX AI Integration")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "JAX AI is the financial superagent powering intelligent insights across all Merchant OS modules. It provides natural language accounting queries, predictive analytics, and real-time fraud detection.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Key AI Capabilities")] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Natural Language Queries: Ask questions like 'What were my top selling products last month?' in plain English", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Predictive Analytics: Forecast demand, predict stockouts, and optimize reorder points", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Fraud Detection: Real-time anomaly detection in transactions and accounting entries", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Daily Insights: Personalized financial tips and recommendations", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Automated Categorization: Smart transaction categorization for accounting", size: 22 })] }),

        // Section 6: Security & Compliance
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Security & Compliance")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS is built with enterprise-grade security and full South African regulatory compliance.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Security Features")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "JWT RS256 authentication with MFA (TOTP + FIDO2)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Biometric authentication (device secure enclave)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Row-Level Security at database layer", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "PCI DSS L1 compliant payment processing", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Immutable audit logging (WORM)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "AES-256 encryption for sensitive data", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Regulatory Compliance")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "POPIA: Protection of Personal Information Act compliance", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "FICA: Financial Intelligence Centre Act compliance", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "NCA: National Credit Act compliance for BNPL and credit", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "BCEA: Basic Conditions of Employment Act compliance for HR", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "SARB: South African Reserve Bank reporting", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "NCR: National Credit Regulator registration", size: 22 })] }),

        // Section 7: Integration Ecosystem
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Integration Ecosystem")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS integrates seamlessly with external services and payment networks to provide a complete business solution.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Payment Integrations")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Peach Payments + Yoco: Card payment gateways", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "PayShap: BankServ instant bank transfer rail", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "GoPay: Instant EFT with 6 SA banks", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "EMVCo QR: Static and dynamic QR code payments", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.2 Bank Integrations")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "Direct integration with 6 major South African banks for bank feeds, reconciliation, and instant EFT payments:", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "First National Bank (FNB)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Standard Bank", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Absa", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Nedbank", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Capitec Bank", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-2", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Investec", size: 22 })] }),

        // Section 8: Pricing & Business Model
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Pricing & Business Model")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Merchant OS operates on a transparent, value-based pricing model designed for South African SMBs.", font: "Times New Roman", size: 22 })]
        }),
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Plan", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Monthly Fee", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Transaction Fee", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Features", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Starter", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R299", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2.5%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "POS, Basic inventory", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Business", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R599", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2.2%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "+ Accounting, CRM", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Enterprise", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R999", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1.9%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "+ HR, Multi-location", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 4: Merchant OS Pricing Plans", size: 18, italics: true, color: colors.secondary })] }),

        // Section 9: Conclusion
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Conclusion")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Groway Merchant OS represents a paradigm shift in how South African merchants manage their businesses. By consolidating POS, inventory, accounting, CRM, HR, and analytics into a single, integrated platform, merchants can eliminate the complexity and cost of managing multiple disconnected systems.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "With support for 11 business verticals, 35 microservices, and full South African regulatory compliance, Merchant OS is positioned to become the dominant business operating system for SMBs in South Africa. The integration with JAX AI provides intelligent insights that were previously only available to enterprise organizations, democratizing access to advanced business intelligence.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Target go-live: April 2027. The platform is benchmarked against global leaders including Alipay, WeChat Pay, Revolut, Grab, Paytm, Gojek, and M-Pesa.", font: "Times New Roman", size: 22, bold: true })]
        })
      ]
    }
  ]
});

// Save document
Packer.toBuffer(doc).then((buffer: Buffer) => {
  fs.writeFileSync("/home/z/my-project/public/downloads/Groway_Merchant_OS_Product_Document.docx", buffer);
  console.log("Merchant OS document created successfully!");
});
