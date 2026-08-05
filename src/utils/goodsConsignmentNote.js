import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import signature from "../assets/signature.png";


export const generateGoodsConsignmentPDF = async(bookingData) => {
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-GB"); // dd/mm/yyyy
  };

  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => reject(new Error("Image load failed"));
    });
  };

  const doc = new jsPDF("p", "mm", "a4");

  const PAGE_WIDTH = doc.internal.pageSize.width;
  const PAGE_HEIGHT = doc.internal.pageSize.height;

  const margin = 15;
  const CONTENT_WIDTH = 180;
  const SAFE_BOTTOM = PAGE_HEIGHT - 22; // Leave room for footer
  const TOP_MARGIN = 20;

  let y = margin;

  // Helper: check page break safety
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > SAFE_BOTTOM) {
      doc.addPage();
      y = TOP_MARGIN;
    }
  };

  const inv = bookingData?.invoice || {};

  // Draw Background Watermark - Ultra-faint background watermark that never hides content
  try {
    if (typeof doc.saveGraphicsState === "function") {
      doc.saveGraphicsState();
    }

    const GStateClass = doc.GState || (doc.internal && doc.internal.GState);
    if (GStateClass && typeof doc.setGState === "function") {
      doc.setGState(new GStateClass({ opacity: 0.045 }));
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(225, 233, 245);

    try {
      doc.text("PACKYATRA OFFICIAL RECORD", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
        align: "center",
        angle: 45
      });
    } catch {
      doc.text("PACKYATRA OFFICIAL RECORD", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: "center" });
    }

    if (typeof doc.restoreGraphicsState === "function") {
      doc.restoreGraphicsState();
    } else if (GStateClass && typeof doc.setGState === "function") {
      doc.setGState(new GStateClass({ opacity: 1.0 }));
    }
  } catch {
    try {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(245, 248, 253);
      doc.text("PACKYATRA OFFICIAL RECORD", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: "center" });
    } catch {
      // Fallback ignore
    }
  }

  /* =======================================================
     PAGE 1: BRAND HEADER, TABLES, AND FORM OPTIONS
     ======================================================= */

  // 1. Corporate Decorative Top Bar
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, 10, 130, 1.5, "F");
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(margin + 130, 10, 50, 1.5, "F");

  // Geometric Motion Logo Block
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(margin, 16, 6, 6, "F");
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin + 1.5, 17.5, 3, 3, "F");

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("PACKYATRA", margin + 9, 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("RELOCATION PRIVATE LIMITED", margin + 9, 25);

  // Right-aligned Corporate Contact Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(14, 165, 233); // Sky-500
  doc.text("www.packyatra.com", PAGE_WIDTH - margin, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("Ph No: 9071 535 535", PAGE_WIDTH - margin, 22, { align: "right" });
  doc.text("Email: info@packyatra.com", PAGE_WIDTH - margin, 26, { align: "right" });

  // Elegant separator line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, 29, PAGE_WIDTH - margin, 29);

  y = 34;

  // 2. Corporate Sub-Header / Office Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(
    "Regd. Office: C/O DEVEERAMMA 122, 4TH MAIN, WCR, MANJUNATHA NAGAR, BANGALORE NORTH INDUSTRIAL ESTATE, BANGALORE - 560010, KARNATAKA",
    PAGE_WIDTH / 2,
    y,
    { align: "center", maxWidth: 170 }
  );

  y += 9;
  doc.text(
    "GSTIN: 29AAQCP3437K1ZR (KARNATAKA) | CIN: U68100KA2025PTC210677 | PAN: AAQCP3437K",
    PAGE_WIDTH / 2,
    y,
    { align: "center" }
  );

  // 3. Document Title Block
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("GOODS CONSIGNMENT NOTE", PAGE_WIDTH / 2, y, { align: "center" });

  // Underline decor
  y += 2.5;
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(PAGE_WIDTH / 2 - 25, y, 50, 0.6, "F");

  y += 6;

  // 4. Consignor & Consignee Details Table
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica" },
    head: [["CONSIGNOR DETAILS", "CONSIGNEE DETAILS"]],
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
    body: [
      ["Consigner Name: " + (inv.customerName || "-"), "Consignee Name: " + (inv.customerName || "-")],
      ["Pickup Address: " + (inv.fromAddress || "-"), "Delivery Address: " + (inv.toAddress || "-")],
      ["Phone No: " + (inv.phoneNumber || "-"), "Phone No: " + (inv.phoneNumber || "-")],
      ["Email ID: " + (inv.email || "-"), "Email ID: " + (inv.email || "-")]
    ]
  });

  y = doc.lastAutoTable.finalY + 4;

  // 5. Booking Details Table
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica" },
    head: [["CONSIGNMENT & BOOKING DATA", "", "", ""]],
    headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 35 },
      3: { cellWidth: 55 }
    },
    body: [
      ["GC Number:", inv.invoiceNumber || "-", "Quotation No:", inv.quotationNumber || "-"],
      ["Vehicle Type ", bookingData.invoice.VehicleType || "N/A", "Vehicle Reg No: ", bookingData.invoice.VehicleNumber || "_"],
      ["Pickup Date:", formatDate(inv.pickupDate) || "-", "Total Packages:",  bookingData.totalBookedQuantity || "N/A"],
      ["Goods Value:", "_", "Payment Type:", "Partial"],
      ["Consignment Type:", "By Road", "Gross Weight / Vol:", inv.totalVolume ? `${inv.totalVolume} CFT` : "_"],
      ["Booking Amount (INR):", inv.totalAmount || "-", "SAC Code:", "996511"]
    ],
    didParseCell: (data) => {
      if (data.row.section === "head") {
        if (data.column.index === 0) {
          data.cell.colSpan = 4;
        }
      }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  // 6. Customer Declaration Card
  checkPageBreak(25);
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(margin, y, CONTENT_WIDTH, 20, "F");
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, y, 1.2, 20, "F"); // Left border highlight

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("CUSTOMER DECLARATION:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const declarationText =
    "I acknowledge that, I have read and understood all the terms and conditions mentioned on this consignment note, on both the front and overleaf, and I accept them for this contract carriage.";
  const wrappedDecl = doc.splitTextToSize(declarationText, CONTENT_WIDTH - 8);
  doc.text(wrappedDecl, margin + 4, y + 10, { lineHeightFactor: 1.25 });

  y += 24;

  // 7. Interactive Delivery & Unloading Row
  checkPageBreak(30);

  // Background Box
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(252, 252, 253); // Slate-50/100
  doc.rect(margin, y, CONTENT_WIDTH, 24, "FD");

  // Heading Inside Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("DELIVERY & SERVICE CRITERIA STATUS", margin + 4, y + 5);

  // Delivery checkboxes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Delivery Type:", margin + 4, y + 12);

  doc.setDrawColor(148, 163, 184); // Slate-400 border
  doc.rect(margin + 28, y + 9.5, 3.5, 3.5); // Checkbox
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Door Delivery", margin + 34, y + 12);

  doc.rect(margin + 62, y + 9.5, 3.5, 3.5); // Checkbox
  doc.text("Godown Delivery", margin + 68, y + 12);

  // Unloading checkboxes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Unloading By:", margin + 4, y + 19);

  doc.rect(margin + 28, y + 16.5, 3.5, 3.5); // Checkbox
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("By Transporter", margin + 34, y + 19);

  doc.rect(margin + 62, y + 16.5, 3.5, 3.5); // Checkbox
  doc.text("By Customer", margin + 68, y + 19);

  // Generated Date on Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Generated Date:", margin + 115, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(getCurrentDate(), margin + 140, y + 12);

  y += 28;

  // 8. Demurrage Card (Highlight Alert)
  checkPageBreak(25);
  doc.setFillColor(254, 242, 242); // Red-50
  doc.rect(margin, y, CONTENT_WIDTH, 18, "F");
  doc.setFillColor(239, 68, 68); // Red-500
  doc.rect(margin, y, 1.2, 18, "F"); // Left border highlight

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27); // Red-800
  doc.text("SCHEDULE FOR DEMURRAGE CHARGES:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  const demurrageText =
    "Demurrage will be charged immediately after 01 days from the date of arrival @ 2/- per day per Pkg. or Qtl. On charged weight whichever will be higher.";
  const wrappedDemurrage = doc.splitTextToSize(demurrageText, CONTENT_WIDTH - 8);
  doc.text(wrappedDemurrage, margin + 4, y + 10, { lineHeightFactor: 1.25 });

  y += 22;

  // 9. Notice Section
  checkPageBreak(34);
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(margin, y, CONTENT_WIDTH, 28, "F");
  doc.setFillColor(71, 85, 105); // Slate-600
  doc.rect(margin, y, 1.2, 28, "F"); // Left border highlight

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("NOTICE:", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const noticeText =
    "The consignment covered under this Lorry Receipt is non-negotiable. Under no circumstances shall the transport operator be liable for any transaction between the consignor and the consignee or any third party, whether relating to the sale, purchase, or otherwise of the goods. The goods covered under this receipt may be delivered directly to the consignee against a separate acknowledgement, without production of the original consignee copy of the Lorry Receipt, and the common carrier shall be deemed fully discharged of all liabilities thereafter.";
  const wrappedNotice = doc.splitTextToSize(noticeText, CONTENT_WIDTH - 8);
  doc.text(wrappedNotice, margin + 4, y + 10, { lineHeightFactor: 1.25 });

  y += 33;

  // 10. Customer Signature (Page 1)
  checkPageBreak(18);
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.4);
  doc.line(PAGE_WIDTH - margin - 50, y + 10, PAGE_WIDTH - margin, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("CUSTOMER’S SIGNATURE", PAGE_WIDTH - margin - 50, y + 14);

  /* =======================================================
     PAGE 2: SIGNATURE, TERMS & ACKNOWLEDGMENT
     ======================================================= */
  doc.addPage();
  y = TOP_MARGIN;

  // 1. Signature & Contact Double Panel
  // Left: Authorized Signatory Block
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(252, 252, 253); // Slate-50
  doc.rect(margin, y, 75, 34, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("AUTHORIZED SIGNATORY:", margin + 4, y + 5);

  let signatureBase64 = null;
  try {
    signatureBase64 = await loadImageAsBase64(signature);
  } catch (err) {
    console.warn("Signature image not found");
  }

  if (signatureBase64) {
    doc.addImage(signatureBase64, "PNG", margin + 18, y + 7, 30, 15);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("(PACKYATRA RELOCATION PRIVATE LIMITED)", margin + 4, y + 29);

  // Right: Quick Brand Info Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(14, 165, 233); // Sky-500
  doc.text("PACKYATRA", margin + 90, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("RELOCATION PRIVATE LIMITED", margin + 90, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Email: info@packyatra.com", margin + 90, y + 18);
  doc.text("Ph No: +91 9071 535 535", margin + 90, y + 22);
  doc.text("Website: www.packyatra.com", margin + 90, y + 26);

  y += 42;

  // 2. Terms and Conditions Title
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(margin, y, 2.5, 4.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("TERMS AND CONDITIONS FOR TRANSPORTATION OF CONSIGNMENTS:", margin + 4, y + 3.5);

  y += 8;

  const termsText = [
    "1. I/We hereby agree to the terms and conditions set forth herein and declare that the information contained in this document is true and correct to the best of my/our knowledge.",
    "2. I/We have read, understood, and accept all the terms and conditions mentioned herein on this consignment note, on the front and overleaf, for this contract carriage.",
    "3. If marked “To Pay,” payment must be made before delivery.",
    "4. The consignor shall be liable for all consequences arising from any incorrect or false declaration of the contents of the consignment.",
    "5. The consignor shall be responsible for obtaining and handing over all necessary permits and documents required for transportation, and any failure to do so shall be at the consignor’s risk.",
    "6. Dangerous, prohibited, hazardous, inflammable, illegal, contraband goods will not be carried.",
    "7. The company will be at liberty to trans-ship goods from one vehicle to another at the company’s discretion.",
    "8. Packing material if provided by the company is the property of the carrier and will be taken back after unpacking (same day of unloading).",
    "9. Shipments not delivered within the specified time shall not be considered service failure when delay is due to acts of God, riots, war, public disturbances, government action, road closures and customs or documentation delays.",
    "10. The consignment is carried entirely at owner’s risk.",
    "11. The Carrier will not be responsible for any loss resulting from inadequate packing or inherent defects in the goods.",
    "12. Any transfer of goods through rope shall be at the sole discretion and risk of the customer.",
    "13. Any concerns during or after the service must be reported immediately to the carrier/helpdesk.",
    "14. In the event of any missing item, the user must obtain a Non-Delivery Certificate (NDC) or shortage certificate from the Company.",
    "15. Claims must be lodged immediately, and no claim shall be entertained after the prescribed time limit of two days.",
    "16. Claims for damage or loss must be supported by damage report, goods consignment note copy and relevant documentation.",
    "17. All consignments are booked under the Carriage by Road Act, 2007 and rules made thereunder.",
    "18. Section 10 – Limited Liability applies unless specifically booked under Section 11.",
    "19. Section 11 – Insured Risk shall apply if insurance has been taken and the insurance amount has been paid separately.",
    "20. Carrier liability under limited liability is restricted as per provisions of the Act.",
    "21. Demurrage will be charged after free period if delivery is delayed due to customer reasons.",
    "22. Consignments that remain undelivered for over 90 days may be sold or disposed of after due notice, in accordance with company policy.",
    "23. All communication made through the company by email or electronic media shall be considered valid and binding.",
    "24. GST shall be applicable as per prevailing law; exemption applies where notified.",
    "25. No person is authorized to alter, modify, overwrite, or waive any terms printed on the consignment note.",
    "26. The customer shall have no lien on carrier’s vehicles, equipment, or materials."
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  termsText.forEach((term) => {
    const wrappedTerm = doc.splitTextToSize(term, CONTENT_WIDTH - 2);
    const textHeight = doc.getTextDimensions(wrappedTerm, { fontSize: 7, lineHeightFactor: 1.25 }).h;

    checkPageBreak(textHeight + 2);

    doc.text(wrappedTerm, margin, y, { maxWidth: CONTENT_WIDTH - 2, lineHeightFactor: 1.25 });
    y += textHeight + 2.5;
  });

  y += 4;

  // 3. Receipt Acknowledgment Section
  checkPageBreak(25);
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(margin, y, CONTENT_WIDTH, 20, "F");
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(margin, y, 1.2, 20, "F"); // Left border highlight

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("RECEIPT ACKNOWLEDGMENT (AT DELIVERY POINT)", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const receiptText =
    "I hereby declare that my consignment moved through PACKYATRA RELOCATION PRIVATE LIMITED has been received in safe and sound condition and I further acknowledge that all services rendered were to my satisfaction.";
  const wrappedReceipt = doc.splitTextToSize(receiptText, CONTENT_WIDTH - 8);
  doc.text(wrappedReceipt, margin + 4, y + 10, { lineHeightFactor: 1.25 });

  y += 24;

  // 4. Customer Signature (Page 2)
  checkPageBreak(18);
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.4);
  doc.line(PAGE_WIDTH - margin - 50, y + 10, PAGE_WIDTH - margin, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("CUSTOMER’S SIGNATURE", PAGE_WIDTH - margin - 50, y + 14);

  // ===== DYNAMIC FOOTER ADDER FOR ALL PAGES =====
  const addFooter = (doc) => {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer horizontal separator line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, PAGE_HEIGHT - 18, PAGE_WIDTH - margin, PAGE_HEIGHT - 18);

      // Light gray footer background panel
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, PAGE_HEIGHT - 17, CONTENT_WIDTH, 12, "F");

      // Copyright
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text("© PackYatra Relocation Private Limited", margin + 4, PAGE_HEIGHT - 11);

      // Disclaimers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        "All disputes subject to jurisdiction. Goods carried at owner's risk.",
        margin + 60,
        PAGE_HEIGHT - 11
      );

      // Dynamic Page Numbering
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - margin - 4, PAGE_HEIGHT - 11, {
        align: "right"
      });
    }
  };

  addFooter(doc);
  /* ================= SAVE PDF ================= */
  doc.save("Goods_Consignment_Note.pdf");
};
