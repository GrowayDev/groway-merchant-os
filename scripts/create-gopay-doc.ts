const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel, 
        BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme - "Wilderness Oasis" for payments
const colors = {
  primary: "#1A1F16",
  body: "#2D3329",
  secondary: "#4A5548",
  accent: "#94A3B8",
  tableBg: "#F8FAF7",
  headerBg: "#E8EDE6"
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
          children: [new TextRun({ text: "GO PAY", size: 72, bold: true, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: "INSTANT PAYMENT GATEWAY", size: 40, bold: true, color: colors.secondary, font: "Times New Roman" })]
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
          children: [new TextRun({ text: "Bank-to-Bank Push Payments Platform", size: 24, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "6 SA Bank Integrations | PayShap Rail | Instant EFT", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Lower Fees than Card | Real-time Settlement | PCI DSS L1", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Groway Payments Ecosystem", size: 20, color: colors.accent, font: "Times New Roman", bold: true })]
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
          children: [new TextRun({ text: "GoPay | Product Document", size: 18, color: colors.secondary })]
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
          children: [new TextRun({ text: "GoPay is Groway's instant EFT payment gateway that enables bank-to-bank push payments with lower fees than traditional card transactions. Integrated directly with 6 major South African banks, GoPay provides real-time settlement, seamless checkout experiences, and deep integration with the Groway Merchant OS and Consumer Wallet ecosystem.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "As the primary payment rail within the Groway platform, GoPay processes transactions for Merchant OS point-of-sale, GroSupply B2B settlements, GroCredit repayments, and consumer wallet P2P transfers. The service operates as a dedicated microservice (Port 3011) with direct bank integrations and PayShap rail connectivity.", font: "Times New Roman", size: 22 })]
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
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Bank Integrations", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "6", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Major SA banks", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Settlement Time", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "< 60 sec", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Real-time gross settlement", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Transaction Fee", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0.5-1.5%", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Lower than card fees", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Payment Rails", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "EFT, PayShap, Internal", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Service Port", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3011", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Dedicated microservice", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Compliance", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PCI DSS L1", size: 22, bold: true })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Payment security standard", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 1: GoPay Platform Metrics", size: 18, italics: true, color: colors.secondary })] }),

        // Section 2: Architecture
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Architecture")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay operates as a dedicated microservice within the Groway platform, providing payment processing capabilities to all other services through well-defined APIs. The service is deployed on AWS af-south-1 with direct integrations to South African banks via secure API connections.", font: "Times New Roman", size: 22 })]
        }),
        
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Service Architecture")] }),
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
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GoPay Service", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Node.js TypeScript microservice (Port 3011). Handles instant EFT, bank-to-bank push payments, settlement tracking.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Bank Connectors", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Direct API integrations with FNB, Standard Bank, Absa, Nedbank, Capitec, Investec via secure OAuth2 connections.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PayShap Rail", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Integration with BankServ PayShap rail for real-time gross settlement using proxy addressing (phone/SA ID/email).", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Payment CDE", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Isolated VPC for PCI DSS L1 compliance. Card tokenisation via Peach Payments + Yoco with zero PAN storage.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Event Publisher", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Kafka event emission for payment.created, payment.completed, payment.failed events consumed by downstream services.", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 2: GoPay Service Architecture", size: 18, italics: true, color: colors.secondary })] }),

        // Section 3: Bank Integrations
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Bank Integrations")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay maintains direct API integrations with 6 major South African banks, enabling instant EFT payments and real-time balance queries. Each integration uses OAuth2 authentication and follows bank-specific API specifications.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Supported Banks")] }),
        new Table({
          columnWidths: [2340, 3510, 3510],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bank", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Capabilities", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Integration Type", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "First National Bank", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "FNB Digital Banking API", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Standard Bank", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Standard Bank Open API", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Absa", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Absa Online Banking API", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Nedbank", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Nedbank API Platform", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Capitec Bank", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Capitec Live Better API", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Investec", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Instant EFT, Balance, Transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Investec Developer Portal", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 3: Supported Banks and Capabilities", size: 18, italics: true, color: colors.secondary })] }),

        // Section 4: Payment Flows
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Payment Flows")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay supports multiple payment flows optimized for different use cases within the Groway ecosystem. Each flow is designed for speed, security, and seamless user experience.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Instant EFT Flow")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "The primary payment flow enables bank-to-bank push payments with real-time settlement:", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "User selects 'Pay with GoPay' at checkout or initiates payment from wallet", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "User selects source bank from supported list", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Bank OAuth2 redirect for secure authentication (no credentials stored)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "User selects account and confirms payment amount", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Payment pushed to recipient with settlement in < 60 seconds", size: 22 })] }),
        new Paragraph({ numbering: { reference: "num-list-1", level: 0 }, spacing: { line: 312, after: 100 }, children: [new TextRun({ text: "Kafka event emitted for downstream processing (receipts, accounting)", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 PayShap Integration")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "GoPay integrates with the BankServ PayShap rail for real-time gross settlement using proxy addressing:", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Proxy Address Types: Phone number, SA ID number, Email address", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Settlement Time: Real-time (< 60 seconds)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Transaction Limits: Up to R3,000 per transaction (PayShap limits)", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Proxy Registry Lookup: Auto-populates recipient name from proxy", size: 22 })] }),

        // Section 5: Fee Structure
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Fee Structure")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay offers competitive transaction fees that are significantly lower than traditional card payments, making it an attractive payment option for merchants.", font: "Times New Roman", size: 22 })]
        }),

        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Payment Type", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fee Rate", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Card Comparison", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Settlement", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GoPay Instant EFT", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0.5-1.0%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2.5-3.5% savings", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "< 60 seconds", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PayShap Transfer", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0.5%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3% savings", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Real-time", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Internal Wallet", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Free", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3.5% savings", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Instant", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "B2B Payment", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "0.5-1.5%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Volume discounts", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Same-day", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 4: GoPay Fee Structure", size: 18, italics: true, color: colors.secondary })] }),

        // Section 6: Security & Compliance
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Security & Compliance")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay operates within a PCI DSS Level 1 compliant environment with multiple security layers to protect payment data and prevent fraud.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Security Features")] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "PCI DSS Level 1 compliance with annual external audit", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Zero PAN storage - card numbers tokenised by Peach Payments/Yoco", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "OAuth2 bank authentication - no bank credentials stored", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "3D Secure 2 (3DS2) for card-not-present transactions", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Real-time fraud detection with ML-based anomaly detection", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "AES-256 encryption for all sensitive data at rest", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "TLS 1.3 for all data in transit", size: 22 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Fraud Prevention")] }),
        new Paragraph({
          spacing: { after: 150, line: 312 },
          children: [new TextRun({ text: "GoPay implements multiple fraud prevention measures powered by JAX AI:", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Device fingerprinting and reputation scoring", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Velocity checks on transaction frequency and amounts", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Geographic anomaly detection", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Behavioural biometrics analysis", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Real-time risk scoring with configurable thresholds", size: 22 })] }),

        // Section 7: Integration with Groway
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Integration with Groway Ecosystem")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay serves as the primary payment rail for all Groway platform services, providing unified payment processing across multiple use cases.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Integration Points")] }),
        new Table({
          columnWidths: [2800, 6560],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2800, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Service", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 6560, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GoPay Use Cases", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Merchant OS POS", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Customer payments at checkout, QR code payments, NFC tap payments, refund processing.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Consumer Wallet", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "P2P transfers, wallet top-ups, bill payments, airtime purchases, remittance payouts.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroSupply", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Supplier payments via GroSettle, B2B procurement settlements, bulk payment processing.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GroCredit", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Credit disbursements, repayment collection via DebiCheck, interest calculation.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Accounting Service", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Auto-journal entries for payments, settlement reconciliation, bank feed matching.", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 5: GoPay Integration Points", size: 18, italics: true, color: colors.secondary })] }),

        // Section 8: API Endpoints
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. API Endpoints")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay exposes a comprehensive REST API for payment initiation, status tracking, and settlement management. All endpoints require JWT authentication and are protected by rate limiting.", font: "Times New Roman", size: 22 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Core Endpoints")] }),
        new Table({
          columnWidths: [2340, 3510, 3510],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Method", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Endpoint", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Description", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "POST", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/payments", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Initiate new payment", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GET", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/payments/:id", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Get payment status", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "POST", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/payments/:id/refund", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Process refund", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GET", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/banks", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "List supported banks", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "POST", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/payshap/lookup", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PayShap proxy lookup", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GET", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "/v1/gopay/transactions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Transaction history", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Table 6: Core GoPay API Endpoints", size: 18, italics: true, color: colors.secondary })] }),

        // Section 9: Conclusion
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Conclusion")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "GoPay represents a modern, cost-effective payment gateway designed for the South African market. By leveraging direct bank integrations and the PayShap rail, GoPay offers merchants significant savings compared to traditional card payments while providing consumers with a seamless, instant payment experience.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "As the primary payment rail within the Groway ecosystem, GoPay enables unified payment processing across Merchant OS, Consumer Wallet, GroSupply, and GroCredit. With PCI DSS Level 1 compliance, real-time fraud detection, and integration with all major South African banks, GoPay is positioned to become a leading instant payment solution in South Africa.", font: "Times New Roman", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Target go-live: April 2027. The platform is benchmarked against global instant payment systems including Alipay, WeChat Pay, and M-Pesa.", font: "Times New Roman", size: 22, bold: true })]
        })
      ]
    }
  ]
});

// Save document
Packer.toBuffer(doc).then((buffer: Buffer) => {
  fs.writeFileSync("/home/z/my-project/public/downloads/Groway_GoPay_Product_Document.docx", buffer);
  console.log("GoPay document created successfully!");
});
