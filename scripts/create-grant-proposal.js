const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, 
        AlignmentType, PageOrientation, LevelFormat, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

// Color scheme - "Forest Moss" for sustainability/SDG focus
const colors = {
  primary: "#1A1F16",      // Deep Forest Ink
  bodyText: "#2D3329",     // Dark Moss Gray
  secondary: "#4A5548",    // Neutral Olive
  accent: "#94A3B8",       // Steady Silver
  tableBg: "#F8FAF7",      // Ultra-Pale Mint White
  headerBg: "#E8F5E9",     // Light green for SDG tables
  teal: "#00897B",         // Groway brand color
  sdgGreen: "#4CAF50",     // SDG green
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.teal, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-exec",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-sdg",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-impact",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-impl",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-budget",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-risk",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ===== COVER PAGE =====
    {
      properties: {
        page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "INNOVATION FUNDING PROPOSAL", size: 28, color: colors.accent, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "GROWAY", size: 72, bold: true, color: colors.teal, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Africa's Integrated Financial Operating System", size: 32, color: colors.secondary, font: "Times New Roman", italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Scaling Financial Inclusion Through Multi-Vertical Commerce Technology", size: 28, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({ spacing: { before: 1000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Submitted to:", size: 22, color: colors.accent, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: "[Grant Funding Agency Name]", size: 24, bold: true, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Funding Amount Requested:", size: 22, color: colors.accent, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "ZAR 25,000,000 (Twenty-Five Million Rand)", size: 28, bold: true, color: colors.teal, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Project Duration: 36 Months", size: 22, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "March 2026", size: 22, color: colors.accent, font: "Times New Roman" })]
        }),
      ]
    },
    // ===== TABLE OF CONTENTS & MAIN CONTENT =====
    {
      properties: {
        page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({ 
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Groway Innovation Funding Proposal", size: 18, color: colors.accent, font: "Times New Roman", italics: true })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 }), new TextRun({ text: " of ", size: 20 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })]
        })] })
      },
      children: [
        // Table of Contents
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Table of Contents")] }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 },
          children: [new TextRun({ text: "Note: Right-click the Table of Contents and select 'Update Field' to refresh page numbers.", size: 18, color: "999999", font: "Times New Roman", italics: true })]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== EXECUTIVE SUMMARY =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Executive Summary")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway is South Africa's pioneering multi-vertical financial operating system designed to bridge the gap between informal and formal economies through an integrated superapp platform. Our innovation addresses a critical market failure: the fragmentation of financial services, business management tools, and supply chain infrastructure that prevents small and medium enterprises (SMEs) from accessing the digital economy.", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "We are seeking ZAR 25 million in grant funding to scale our proven technology platform across South Africa and expand into 6 additional African markets over 36 months. This funding will enable us to:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "numbered-exec", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Onboard 100,000 additional SMEs onto the Merchant OS platform", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-exec", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Expand the Consumer Wallet to 2 million financially underserved users", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-exec", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Scale the GroSupply B2B marketplace to connect 5,000 suppliers with retailers", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-exec", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Create 5,000+ jobs through our Agent Network and Salesforce programs", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-exec", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Contribute to 8 of the 17 United Nations Sustainable Development Goals (SDGs)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Our platform already serves over 15,000 merchants, processes millions in monthly transactions, and has demonstrated product-market fit across 12 distinct business verticals. This proposal outlines how strategic grant funding will accelerate our mission to democratize financial access and drive inclusive economic growth across Africa.", size: 24, font: "Times New Roman" })]
        }),

        // ===== ABOUT GROWAY =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. About Groway")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Company Overview")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway (Pty) Ltd is a South African financial technology company founded with the mission of creating Africa's first truly integrated financial operating system. Our headquarters are in Johannesburg, with operations extending across all nine provinces and into neighboring countries including Namibia, Botswana, Zimbabwe, Mozambique, Zambia, and Kenya.", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Our platform philosophy is inspired by successful superapp models like Alipay and WeChat, adapted specifically for African market conditions, regulatory environments, and user behaviors. We believe that the future of African commerce lies not in replicating Western solutions, but in building contextually relevant technology that addresses the unique challenges and opportunities of our continent.", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Platform Architecture")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "The Groway platform consists of six integrated applications working seamlessly together:", size: 24, font: "Times New Roman" })]
        }),

        // Platform Applications Table
        new Table({
          columnWidths: [2800, 6560],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Application", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Description & Key Features", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Consumer Wallet", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Mobile wallet for payments, P2P transfers, remittance, bill pay, savings, and investments. Serves 2.5M+ users with QR payments, PayShap integration, and cross-border remittance.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Merchant OS", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Multi-vertical business operating system with POS, inventory, accounting, CRM, and compliance. Supports 12 business verticals with industry-specific configurations. 15K+ merchants.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "GroSupply", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "B2B procurement marketplace connecting retailers with verified suppliers. Features GroCredit (trade finance), GroSettle (automated settlements), and 3-way matching. 350+ suppliers.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "GroSell", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "WhatsApp commerce platform enabling merchants to share catalogs, take orders, and manage customer conversations. 3K+ active merchants leveraging South Africa's most-used messaging platform.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "GoPay", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Payment gateway processing cards, QR, EFT, and PayShap with PCI-DSS Level 1 compliance. 10M+ transactions processed with support for multiple acquiring partners.", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Enterprise", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6560, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Multi-branch management platform for retail chains and franchises. Consolidated reporting, role-based access control, and enterprise-grade API integrations. 500+ enterprise clients.", size: 22 })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 1: Groway Platform Applications", size: 20, italics: true, color: colors.secondary })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Multi-Vertical Innovation")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Our core innovation lies in recognizing that African businesses are fundamentally different from their Western counterparts. A Shisa Nyama (informal barbecue restaurant) has different operational needs, compliance requirements, and customer expectations than a fine dining establishment. A spaza shop operates differently from a supermarket chain.", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway's Merchant OS automatically configures itself based on the specific business vertical, providing:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Vertical-specific POS screen layouts and workflows", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Pre-loaded SKU catalogs relevant to the business type", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Compliance overlays (liquor licensing, health certificates, VAT treatment)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Industry-specific chart of accounts and accounting templates", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Digital menus and geo-discovery tags", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Supplier catalogues matched to business needs", size: 24, font: "Times New Roman" })] }),

        // ===== PROBLEM STATEMENT =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Problem Statement")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Financial Exclusion in South Africa")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Despite significant progress since the introduction of the Financial Sector Charter, South Africa continues to face alarming levels of financial exclusion:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "11 million South Africans remain unbanked or underbanked (World Bank Findex 2021)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Only 15% of SMMEs have access to formal credit facilities (SME Finance Forum)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Cash transactions still account for over 50% of retail payments in informal sectors", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Average SME survival rate is only 37% beyond 5 years, largely due to poor financial management", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 The Informal Economy Challenge")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "South Africa's informal economy employs approximately 3 million people and contributes an estimated 6% to GDP. However, these businesses face systemic barriers:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "numbered-sdg", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Technology Gap: Existing solutions are designed for formal, Western-style businesses and don't accommodate the unique workflows of informal trade", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-sdg", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Credit Inaccessibility: Traditional banks require collateral and formal documentation that informal traders cannot provide", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-sdg", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Supply Chain Inefficiency: Informal retailers pay higher prices due to lack of access to wholesale networks and bulk purchasing power", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-sdg", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Compliance Burden: Complex regulatory requirements create barriers to formalization, keeping businesses in the shadows", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-sdg", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Digital Literacy: Many business owners lack the skills to leverage technology for growth", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Market Failure Analysis")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "The persistence of these challenges represents a clear market failure that justifies intervention:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Fragmented Solutions: Current market offerings address individual problems (payments, accounting, inventory) but lack integration", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Pricing Exclusion: Enterprise-grade technology remains unaffordable for micro and small businesses", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Infrastructure Gaps: Poor connectivity and inconsistent electricity supply require offline-capable solutions", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Trust Deficit: Historical exclusion has created distrust of formal financial institutions", size: 24, font: "Times New Roman" })] }),

        // ===== INNOVATION & SOLUTION =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Innovation & Solution")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Our Innovative Approach")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway addresses these market failures through a holistic, ecosystem-based approach that combines technology innovation with deep understanding of African market dynamics:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.1.1 Multi-Vertical Business OS")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Our Merchant OS is the first platform to recognize that different business types require fundamentally different digital tools. Whether a merchant runs a Shisa Nyama, pharmacy, hair salon, hardware store, or boutique hotel, the system automatically configures appropriate:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Point-of-sale interfaces optimized for their workflow", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Product catalogs with industry-relevant SKUs", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Compliance frameworks specific to their sector", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Financial reporting aligned with their business model", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.1.2 Integrated Financial Services")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Unlike standalone payment providers or accounting software, Groway provides end-to-end financial infrastructure:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Real-time payments via QR, PayShap, and card processing", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Embedded lending (GroCredit) based on transaction history", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Automated bookkeeping and tax compliance", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "B2B procurement with integrated trade finance", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("4.1.3 Offline-First Architecture")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Recognizing the reality of African infrastructure, our platform operates fully offline with automatic synchronization when connectivity is restored. This includes:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Complete POS functionality without internet", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Offline inventory management and stock counts", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Queued transactions that sync automatically", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Conflict resolution for multi-device scenarios", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Technical Innovation Highlights")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Our technology stack represents significant innovation in African fintech:", size: 24, font: "Times New Roman" })]
        }),

        // Technical Innovation Table
        new Table({
          columnWidths: [3200, 6160],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Innovation Area", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Description & Competitive Advantage", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Multi-Vertical Engine", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Proprietary configuration engine that automatically deploys industry-specific templates, reducing onboarding time from weeks to hours", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "528+ API Endpoints", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Comprehensive REST APIs enabling third-party integrations, white-label deployments, and ecosystem expansion", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Real-Time Sync Engine", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Patent-pending synchronization technology that handles intermittent connectivity while maintaining data integrity", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "AI-Powered Cataloging", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Machine learning models that automatically categorize products and suggest optimal pricing based on market data", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Embedded Finance Layer", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 6160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Alternative credit scoring using transaction data, enabling lending to businesses excluded from traditional finance", size: 22 })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 2: Technical Innovation Highlights", size: 20, italics: true, color: colors.secondary })] }),

        // ===== SDG ALIGNMENT =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Sustainable Development Goals Alignment")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway's mission directly contributes to 8 of the 17 United Nations Sustainable Development Goals. Our integrated approach ensures that progress in one area reinforces progress in others, creating a multiplier effect for sustainable development.", size: 24, font: "Times New Roman" })]
        }),

        // SDG Alignment Table
        new Table({
          columnWidths: [1800, 2400, 5160],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG Goal", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Target", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Groway Contribution", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 1", bold: true, size: 22 }), new TextRun({ text: "\nNo Poverty", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "1.4: Equal rights to economic resources", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Financial inclusion through Consumer Wallet; micro-credit access via GroCredit; job creation through Agent Network (5,000+ agents earning commissions)", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 5", bold: true, size: 22 }), new TextRun({ text: "\nGender Equality", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "5.A: Equal access to economic resources", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "48% of our merchants are women-owned businesses; specialized onboarding support; GroCredit with gender-inclusive credit scoring", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 8", bold: true, size: 22 }), new TextRun({ text: "\nDecent Work", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "8.3: Promote development-oriented policies for SMEs", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "15,000+ SMEs using Merchant OS; Staff HRM module ensuring labor compliance; Salesforce program creating formal employment", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 9", bold: true, size: 22 }), new TextRun({ text: "\nIndustry & Innovation", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "9.3: Increase access of SMEs to financial services", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "528+ API endpoints enabling innovation; embedded finance solutions; affordable technology for micro-enterprises", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 10", bold: true, size: 22 }), new TextRun({ text: "\nReduced Inequality", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "10.2: Promote social, economic inclusion", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Serving informal economy; bridging digital divide; accessible pricing models; vernacular language support", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 12", bold: true, size: 22 }), new TextRun({ text: "\nResponsible Consumption", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "12.6: Encourage sustainable practices", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "GroSupply reducing supply chain waste; digital receipts reducing paper; inventory optimization reducing spoilage", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 16", bold: true, size: 22 }), new TextRun({ text: "\nStrong Institutions", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "16.6: Develop effective, accountable institutions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Compliance modules for SARS, CIPC, NCR; audit trails for regulatory reporting; promoting formalization of informal businesses", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 1800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "SDG 17", bold: true, size: 22 }), new TextRun({ text: "\nPartnerships", size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "17.17: Encourage effective public-private partnerships", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 5160, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Partnerships with banks, retailers, telecoms, and government; open API ecosystem; Agent Network creating shared value", size: 22 })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 3: SDG Alignment Matrix", size: 20, italics: true, color: colors.secondary })] }),

        // ===== MARKET OPPORTUNITY =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Market Opportunity")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Total Addressable Market")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "The combined market opportunity for Groway's platform across Africa represents significant untapped potential:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "South African SMME Market: 2.5 million registered SMMEs (Stats SA), with 70% lacking digital business tools", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "African Digital Payments: Expected to reach $200 billion by 2025 (McKinsey)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "SME Finance Gap: $330 billion unmet financing need across sub-Saharan Africa (IFC)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "B2B E-commerce: Expected to reach $1.4 trillion in Africa by 2025 (Jumia)", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Competitive Landscape")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway occupies a unique position in the market. While competitors address individual verticals (payments, POS, accounting), no other platform offers an integrated multi-vertical solution designed specifically for African markets. Key differentiators include:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "vs. Yoco/iKhokha: We offer full business OS, not just payment processing", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "vs. Sage/Xero: We provide offline capability and informal sector focus", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "vs. M-Pesa: We offer B2B tools alongside consumer wallet", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "vs. Standard Bank Business: We serve micro-enterprises and informal sector", size: 24, font: "Times New Roman" })] }),

        // ===== IMPACT METRICS =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Impact Metrics & Targets")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "With grant funding, we commit to achieving the following measurable outcomes over the 36-month project period:", size: 24, font: "Times New Roman" })]
        }),

        // Impact Metrics Table
        new Table({
          columnWidths: [2800, 2080, 2080, 2400],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Metric", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Baseline", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Year 3 Target", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG Link", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Active SME Merchants", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "115,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 8, 9", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Consumer Wallet Users", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2.5 million", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4.5 million", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 1, 10", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "GroCredit Disbursed (ZAR)", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "50 million", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "500 million", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 1, 9", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Active Suppliers on GroSupply", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "350", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "5,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 12", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Jobs Created (Direct)", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "50", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "150", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 8", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Agent Network Members", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1,234", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "5,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 1, 8", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Women-Owned Business Clients", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "48%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "55%", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 5", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Countries of Operation", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1 (SA)", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2080, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "7 countries", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2400, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SDG 17", size: 22 })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 4: Impact Metrics and Targets", size: 20, italics: true, color: colors.secondary })] }),

        // ===== IMPLEMENTATION PLAN =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Implementation Plan")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Phase 1: Foundation (Months 1-12)")] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Scale core technology infrastructure for 100,000+ concurrent users", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Establish regional support hubs in 4 provinces (Gauteng, Western Cape, KZN, Eastern Cape)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Launch Agent Network expansion program targeting 2,500 new agents", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Develop and deploy vernacular language support (Zulu, Xhosa, Sotho, Afrikaans)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Achieve PCI-DSS Level 1 certification for GoPay", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.2 Phase 2: Scale (Months 13-24)")] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Expand GroSupply supplier network to 2,500 verified suppliers", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Launch GroCredit facility with ZAR 200 million lending capacity", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Deploy in Namibia and Botswana (pilot international expansion)", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Partner with 3 major retailers for integrated loyalty programs", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Onboard 50,000 new SME merchants", size: 24, font: "Times New Roman" })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.3 Phase 3: Expansion (Months 25-36)")] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Expand to Zimbabwe, Mozambique, Zambia, and Kenya", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Launch white-label platform for enterprise and government clients", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Integrate cross-border remittance across all operating countries", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Achieve 115,000 total SME merchants on platform", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-impl", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Prepare for Series A funding round (targeting ZAR 150 million)", size: 24, font: "Times New Roman" })] }),

        // ===== BUDGET =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Budget Breakdown")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "The requested ZAR 25 million grant will be allocated across the following key areas:", size: 24, font: "Times New Roman" })]
        }),

        // Budget Table
        new Table({
          columnWidths: [4000, 2180, 3180],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Budget Category", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Amount (ZAR)", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Purpose", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Technology Development", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "7,500,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Platform enhancement, mobile apps, API development", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Infrastructure & Cloud Services", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4,000,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Server scaling, security, redundancy", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Market Expansion & Marketing", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "5,000,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Merchant acquisition, brand awareness, regional expansion", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Agent Network Development", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3,000,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Agent recruitment, training, support infrastructure", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Compliance & Certification", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1,500,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "PCI-DSS, NCR licensing, regulatory approvals", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Team Expansion", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3,000,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Key hires in engineering, operations, compliance", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Contingency (10%)", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1,000,000", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Unforeseen expenses, currency fluctuations", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.teal, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true, size: 22, color: "FFFFFF" })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2180, type: WidthType.DXA }, shading: { fill: colors.teal, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "25,000,000", bold: true, size: 22, color: "FFFFFF" })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3180, type: WidthType.DXA }, shading: { fill: colors.teal, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "36-month project total", size: 22, color: "FFFFFF" })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 5: Budget Allocation", size: 20, italics: true, color: colors.secondary })] }),

        // ===== TEAM =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Team & Leadership")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway is led by a team of experienced professionals with deep expertise in fintech, enterprise software, and African markets:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Chief Executive Officer: 15+ years in African fintech, former executive at major South African bank", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Chief Technology Officer: Former lead architect at global payments company, extensive experience in scalable systems", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Chief Financial Officer: Chartered Accountant with experience in venture-backed startups and financial services", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Chief Operating Officer: 20+ years in retail operations, former executive at leading South African retailer", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Advisory Board: Includes former regulators, banking executives, and successful entrepreneurs", size: 24, font: "Times New Roman" })] }),

        // ===== RISK MANAGEMENT =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("11. Risk Management")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "We have identified the following key risks and mitigation strategies:", size: 24, font: "Times New Roman" })]
        }),

        // Risk Table
        new Table({
          columnWidths: [2600, 3380, 3380],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Risk", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Impact", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.headerBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mitigation Strategy", bold: true, size: 22 })] })] }),
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Regulatory Changes", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "New regulations could require platform modifications", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Proactive engagement with regulators; modular compliance architecture", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Credit Risk", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "GroCredit defaults could impact sustainability", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "AI-based credit scoring; portfolio diversification; insurance partnerships", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Competition", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Large players could enter market with similar solutions", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Deep vertical specialization; network effects; first-mover advantage", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "Technology Failure", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "System downtime could impact merchant operations", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: "99.9% uptime SLA; multi-region redundancy; offline capability", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, width: { size: 2600, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Currency Fluctuation", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Regional expansion exposes us to currency risk", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3380, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Local currency revenue; hedging strategies; phased expansion", size: 22 })] })] })
            ]}),
          ]
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 },
          children: [new TextRun({ text: "Table 6: Risk Assessment Matrix", size: 20, italics: true, color: colors.secondary })] }),

        // ===== CONCLUSION =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("12. Conclusion")] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Groway represents a transformative opportunity to accelerate financial inclusion and economic development across South Africa and the broader African continent. Our integrated platform addresses the fundamental market failure of fragmented solutions that leave SMEs and consumers without access to the digital economy.", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "With proven product-market fit, a world-class team, and a clear vision for scale, we are positioned to become Africa's leading financial operating system. The requested ZAR 25 million grant funding will enable us to:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({ numbering: { reference: "numbered-budget", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Scale our technology to serve millions more users", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-budget", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Create thousands of jobs through our Agent Network", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-budget", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Enable 100,000 SMEs to access digital business tools", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-budget", level: 0 }, spacing: { after: 100 },
          children: [new TextRun({ text: "Disburse ZAR 500 million in credit to underserved businesses", size: 24, font: "Times New Roman" })] }),
        new Paragraph({ numbering: { reference: "numbered-budget", level: 0 }, spacing: { after: 200 },
          children: [new TextRun({ text: "Contribute directly to 8 UN Sustainable Development Goals", size: 24, font: "Times New Roman" })] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "We invite [Grant Funding Agency] to partner with us in building Africa's digital future. Together, we can create lasting, sustainable impact that transforms lives and communities across the continent.", size: 24, font: "Times New Roman" })]
        }),

        // ===== CONTACT =====
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("13. Contact Information")] }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "For inquiries regarding this proposal, please contact:", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Groway (Pty) Ltd", bold: true, size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Address: [Company Address], Johannesburg, South Africa", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Email: info@groway.co.za", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: "Phone: +27 (0) 11 123 4567", size: 24, font: "Times New Roman" })]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Website: www.groway.co.za", size: 24, font: "Times New Roman" })]
        }),
      ]
    }
  ]
});

// Generate and save the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/public/downloads/Groway_Grant_Funding_Proposal.docx", buffer);
  console.log("Grant funding proposal created successfully!");
});
