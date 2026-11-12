const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel, 
        BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme - "Terra Cotta Afterglow" for procurement/marketplace
const colors = {
  primary: "#26211F",
  body: "#3D3735",
  secondary: "#6B6361",
  accent: "#C19A6B",
  tableBg: "#FDFCFB",
  headerBg: "#F5F0EB"
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
          children: [new TextRun({ text: "GRO SUPPLY", size: 72, bold: true, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: "B2B PROCUREMENT PLATFORM", size: 40, bold: true, color: colors.accent, font: "Times New Roman" })]
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
          children: [new TextRun({ text: "Two-Sided B2B Marketplace", size: 24, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Merchant Portal | Supplier Portal | Admin Console | Mobile Apps", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "334 Suppliers | 12 Business Verticals | 57 API Endpoints", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "GroSettle | GroCredit | GroFloat | GroDeliver", size: 20, color: colors.accent, font: "Times New Roman", bold: true })]
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
          children: [new TextRun({ text: "GroSupply | Product Document", size: 18, color: colors.secondary })]
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
          children: [new TextRun({ text: "GroSupply is a two-sided B2B procurement marketplace that connects Groway merchants with vetted suppliers across 12 business verticals. The platform streamlines the entire procurement lifecycle from request for quotation (RFQ) to purchase order (PO) to goods received note (GRN) and finally settlement. With integrated financing options (GroCredit for merchants, GroFloat for suppliers) and instant settlement (GroSettle), GroSupply creates unprecedented efficiency in B2B commerce.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The platform currently hosts 334 verified suppliers across 12 business verticals including F&B, Liquor, Grocery, Health & Beauty, Fashion, Pharmacy, Hospitality, Hardware, Electronics, Sport, Childcare, and Professional Services. Suppliers are tiered as Gold (152), Silver (128), or Bronze (54) based on performance metrics and B-BBEE compliance levels.", font: "Times New Roman", size: 22 })]
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
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Verified Suppliers", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "334", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Across all verticals", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Business Verticals", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "12", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Industry coverage", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Sub-Verticals", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "74", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Specialized categories", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Gold Tier Suppliers", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "152", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Premium performance", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "API Endpoints", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "57", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Complete API coverage", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Year 1 Revenue Target", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R17.4M", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Multiple revenue streams", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 1: GroSupply Platform Metrics", size: 18, italics: true, color: colors.secondary })] }),

        // Section 2: Platform Architecture
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Platform Architecture")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GroSupply is designed as a fully independent bounded context within the Groway ecosystem. It has its own frontend applications, backend service (Port 3032), PostgreSQL schema, Kafka event topics, and Admin Console. The platform integrates with other Groway services via well-defined APIs and events.", font: "Times New Roman", size: 22 })]
        }),
        
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 System Components")] }),
        new Table({
          columnWidths: [2800, 6560],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Component", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 6560, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Description", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroSupply Service", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Node.js TypeScript microservice (Port 3032). Owns RFQ, PO, GRN, invoice matching, supplier management, GroSettle, GroCredit, GroFloat.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Merchant Portal", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "React 18 + TypeScript web app. Integrated within Groway Merchant OS at /procurement. Desktop and tablet optimized.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Merchant Mobile App", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "React Native. GRN scanning with camera barcode, PO approval on-the-go, delivery confirmation, supplier payment.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Supplier Portal", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Standalone React 18 app at app.grosupply.co.za/supplier. Order management, catalogue, dispatch, invoice, settlement tracker.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Supplier Mobile App", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "React Native. Order notifications, GRN confirmation, delivery proof (photo + GPS), dispute raise. iOS + Android.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Admin Console", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "React 18 admin web app at admin.grosupply.co.za. Supplier onboarding review, dispute management, GroSettle approval.", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 2: GroSupply System Components", size: 18, italics: true, color: colors.secondary })] }),

        // Section 3: Procurement Lifecycle
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Procurement Lifecycle")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The complete procurement lifecycle spans 10 stages, from low stock trigger to final settlement. Each stage is tracked and auditable, with automated notifications and event-driven integrations.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Lifecycle Stages")] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Low Stock Trigger: Inventory Service detects low stock and creates auto-draft RFQ, notifies merchant", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "RFQ Creation: Merchant confirms RFQ with product, quantity, delivery date, location; routed to eligible suppliers", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Supplier Quoting: Suppliers submit quotes with unit price, MOQ, lead time, delivery terms (valid 48 hours)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Quote Comparison: Merchant views comparison matrix with price, delivery, B-BBEE score, rating, total cost", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Purchase Order: Auto-generated PO from accepted quote with line items, agreed prices, delivery address", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Dispatch & Delivery: Supplier confirms dispatch with tracking; real-time tracking via GroDeliver API", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "GRN Processing: Merchant scans barcodes, confirms quantities, captures batch/expiry; flags shortages/damages", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Invoice Submission: Supplier uploads invoice PDF; GroSupply runs 3-way match (PO vs GRN vs invoice)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Accounting Journal: On invoice match, Accounting Service auto-journals: Dr Purchases/Stock, Cr Accounts Payable", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "GroSettle Payment: Merchant pays supplier via instant, 30-day, or 60-day settlement with dynamic discounts", size: 22 })] }),

        // Section 4: Supplier Tiers & B-BBEE
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Supplier Tiers & B-BBEE Compliance")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Suppliers are classified into performance tiers based on delivery reliability, quality metrics, and B-BBEE compliance. This tiering enables merchants to make informed procurement decisions aligned with their transformation goals.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Supplier Tier Distribution")] }),
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tier", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Count", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Benefits", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Monthly Fee", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Gold", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "152", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Priority placement, Analytics, Promotions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R499/mo", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Silver", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "128", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Standard visibility, Basic analytics", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Free", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Bronze", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "54", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Basic marketplace listing", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Free", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 3: Supplier Tier Distribution", size: 18, italics: true, color: colors.secondary })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 B-BBEE Compliance")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "All suppliers are verified for B-BBEE compliance with certificate expiry tracking and automated renewal reminders. B-BBEE levels range from 1 (highest) to 8 (lowest), enabling merchants to optimize their procurement scorecards.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Level 1 (135% recognition): Highest preference for enterprise development", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Level 2-4 (125%-100%): Strong preference for procurement points", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Level 5-8 (80%-10%): Standard recognition levels", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Automated expiry alerts at 60, 30, and 7 days before certificate expiry", size: 22 })] }),

        // Section 5: Financial Services
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Financial Services")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GroSupply offers three integrated financial products designed to optimize cash flow for both merchants and suppliers.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 GroSettle - Settlement Options")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "GroSettle provides flexible payment timing options with dynamic early payment discounts. Merchants can choose settlement timing that matches their cash flow needs while suppliers benefit from predictable payments.", font: "Times New Roman", size: 22 })]
        }),
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Option", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Timeline", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fee", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Discount", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4 hours", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1.5-2.5%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Dynamic", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Net 30", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "30 days", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "None", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Standard terms", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Net 60", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "60 days", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "None", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Extended terms", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 4: GroSettle Settlement Options", size: 18, italics: true, color: colors.secondary })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 GroCredit - Merchant Financing")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "GroCredit provides working capital financing for GroSupply purchases. Merchants can draw against pre-approved credit facilities to fund inventory procurement, with NCA-compliant terms and competitive interest rates.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Credit tiers: Starter, Business, Enterprise, Seasonal", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Interest rates: Repo + 5-8% p.a. (risk-based)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "NCA compliant for sole proprietors", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Seamless integration with PO payment flow", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.3 GroFloat - Supplier Advances")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "GroFloat enables suppliers to access advance payments against pending invoices. This improves supplier cash flow and incentivizes participation in the marketplace.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Advance against confirmed POs and pending settlements", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Interest rates: Repo + 6-10% p.a. (risk-based)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Auto-repay from GroSettle settlements", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Available to Gold and Silver tier suppliers", size: 22 })] }),

        // Section 6: Business Verticals
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Business Verticals")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GroSupply serves merchants and suppliers across 12 primary business verticals, each with specialized procurement needs and supplier networks.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Vertical Coverage")] }),
        new Table({
          columnWidths: [2800, 3280, 3280],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Vertical", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sub-Verticals", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Supplier Types", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Food & Beverage", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Restaurant, Cafe, Catering, Bakery", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Fresh produce, Dry goods, Equipment", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Liquor", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Bar, Nightclub, Liquor store", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Distillers, Brewers, Wholesalers", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Grocery", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Supermarket, Convenience, Spaza", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "FMCG, Wholesalers, Distributors", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Health & Beauty", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Salon, Spa, Barbershop", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Cosmetics, Equipment, Consumables", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Pharmacy", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Retail pharmacy, Clinic", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Pharmaceuticals, Medical supplies", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hospitality", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hotel, Guesthouse, Lodge", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Linen, Amenities, Equipment", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hardware", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hardware store, Building supplies", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Tools, Materials, Safety equipment", size: 20 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Electronics", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Electronics store, Repair shop", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Consumer electronics, Components", size: 20 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 5: Business Vertical Coverage", size: 18, italics: true, color: colors.secondary })] }),

        // Section 7: Revenue Model
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Revenue Model")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GroSupply generates revenue through multiple streams including settlement fees, financing interest, supplier subscriptions, and premium services.", font: "Times New Roman", size: 22 })]
        }),

        new Table({
          columnWidths: [2800, 3280, 3280],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Revenue Stream", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Rate", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Year 1 Projection", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroSettle Instant Fee", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "1.5-2.5% of invoice value", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R8M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroCredit Interest", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Repo + 5-8% p.a.", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R4M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroFloat Interest", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Repo + 6-10% p.a.", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R2M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Supplier Subscriptions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Gold R499/mo, Preferred R999/mo", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R1.5M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Analytics Premium", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "R299/month", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R0.9M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroDeliver Commission", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "5-8% of delivery cost", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R1M", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL YEAR 1", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3280, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "R17.4M", size: 22, bold: true })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 6: GroSupply Revenue Model", size: 18, italics: true, color: colors.secondary })] }),

        // Section 8: Conclusion
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Conclusion")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GroSupply represents a transformative B2B procurement platform that streamlines the entire supply chain for South African merchants. By connecting merchants with 334 verified suppliers across 12 business verticals, and providing integrated financing options through GroSettle, GroCredit, and GroFloat, GroSupply creates unprecedented efficiency in B2B commerce.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The platform's standalone architecture ensures independent development and deployment, while seamless integration with the Groway ecosystem provides merchants with a unified business operating system. With a Year 1 revenue target of R17.4M and a comprehensive feature set including mobile apps, admin console, and automated workflows, GroSupply is positioned to become the leading B2B marketplace in South Africa.", font: "Times New Roman", size: 22 })]
        })
      ]
    }
  ]
});

// Save document
Packer.toBuffer(doc).then((buffer: Buffer) => {
  fs.writeFileSync("/home/z/my-project/public/downloads/Groway_GroSupply_Product_Document.docx", buffer);
  console.log("GroSupply document created successfully!");
});
