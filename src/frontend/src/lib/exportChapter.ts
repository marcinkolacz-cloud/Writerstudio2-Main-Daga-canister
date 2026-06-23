import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

/* ------------------------------------------------------------------ */
/*  DOCX helpers                                                      */
/* ------------------------------------------------------------------ */

function collectTextRuns(
  node: Node,
  inherited: { bold: boolean; italics: boolean; underline: boolean },
): TextRun[] {
  const runs: TextRun[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (text.length > 0) {
      runs.push(
        new TextRun({
          text,
          bold: inherited.bold,
          italics: inherited.italics,
          underline: inherited.underline ? {} : undefined,
          font: "Georgia",
          size: 24,
        }),
      );
    }
    return runs;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return runs;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") {
    runs.push(
      new TextRun({
        text: "",
        break: 1,
        font: "Georgia",
        size: 24,
      }),
    );
    return runs;
  }

  const nextInherited = {
    bold: inherited.bold || tag === "strong" || tag === "b",
    italics: inherited.italics || tag === "em" || tag === "i",
    underline: inherited.underline || tag === "u",
  };

  for (const child of el.childNodes) {
    runs.push(...collectTextRuns(child, nextInherited));
  }

  return runs;
}

function htmlToDocxParagraphs(
  html: string,
  indentLeft: number,
  indentRight: number,
  indentFirstLine: number,
): Paragraph[] {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  const twips = (px: number) => Math.round(px * 15);
  const indent = {
    left: twips(indentLeft),
    right: twips(indentRight),
    firstLine: twips(indentFirstLine),
  };

  const paragraphs: Paragraph[] = [];

  for (const el of tmp.children) {
    const tag = el.tagName.toLowerCase();

    if (tag === "p" || tag === "div") {
      const runs = collectTextRuns(el, {
        bold: false,
        italics: false,
        underline: false,
      });
      if (runs.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "", font: "Georgia", size: 24 })],
            spacing: { after: 200 },
            indent,
          }),
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: runs,
            spacing: { after: 200 },
            indent,
          }),
        );
      }
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number.parseInt(tag[1], 10);
      const headingSize = 32 - (level - 1) * 2;
      const runs = collectTextRuns(el, {
        bold: true,
        italics: false,
        underline: false,
      });
      paragraphs.push(
        new Paragraph({
          children: runs.map(
            (r) =>
              new TextRun({
                text: (r as unknown as { text: string }).text,
                bold: true,
                font: "Georgia",
                size: headingSize * 2,
              }),
          ),
          spacing: { after: 200 },
          indent,
          heading: `Heading${level}` as
            | "Heading1"
            | "Heading2"
            | "Heading3"
            | "Heading4"
            | "Heading5"
            | "Heading6",
        }),
      );
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      for (const li of el.querySelectorAll("li")) {
        const runs = collectTextRuns(li, {
          bold: false,
          italics: false,
          underline: false,
        });
        if (runs.length === 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "", font: "Georgia", size: 24 })],
              spacing: { after: 100 },
              indent,
            }),
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: tag === "ul" ? "\u2022 " : "",
                  font: "Georgia",
                  size: 24,
                }),
                ...runs,
              ],
              spacing: { after: 100 },
              indent,
            }),
          );
        }
      }
      continue;
    }

    if (tag === "li") {
      const runs = collectTextRuns(el, {
        bold: false,
        italics: false,
        underline: false,
      });
      if (runs.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: "", font: "Georgia", size: 24 })],
            spacing: { after: 100 },
            indent,
          }),
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: "\u2022 ", font: "Georgia", size: 24 }),
              ...runs,
            ],
            spacing: { after: 100 },
            indent,
          }),
        );
      }
      continue;
    }

    const runs = collectTextRuns(el, {
      bold: false,
      italics: false,
      underline: false,
    });
    if (runs.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: 200 },
          indent,
        }),
      );
    }
  }

  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: "", font: "Georgia", size: 24 })],
        spacing: { after: 200 },
        indent,
      }),
    );
  }

  return paragraphs;
}

/* ------------------------------------------------------------------ */
/*  PDF helpers                                                       */
/* ------------------------------------------------------------------ */

interface PdfBlock {
  text: string;
  bold: boolean;
  fontSize: number;
  spacingAfter: number;
}

function htmlToPdfBlocks(html: string): PdfBlock[] {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  const blocks: PdfBlock[] = [];

  for (const el of tmp.children) {
    const tag = el.tagName.toLowerCase();

    if (tag === "p" || tag === "div") {
      const text = el.innerHTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "");
      blocks.push({
        text,
        bold: false,
        fontSize: 12,
        spacingAfter: 4,
      });
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number.parseInt(tag[1], 10);
      const text = el.textContent ?? "";
      blocks.push({
        text,
        bold: true,
        fontSize: 16 - (level - 1) * 1.5,
        spacingAfter: 6,
      });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      for (const li of el.querySelectorAll("li")) {
        const text = (tag === "ul" ? "\u2022 " : "") + (li.textContent ?? "");
        blocks.push({
          text,
          bold: false,
          fontSize: 12,
          spacingAfter: 2,
        });
      }
      continue;
    }

    if (tag === "li") {
      const text = `\u2022 ${el.textContent ?? ""}`;
      blocks.push({
        text,
        bold: false,
        fontSize: 12,
        spacingAfter: 2,
      });
      continue;
    }

    const text = el.textContent ?? "";
    if (text.trim().length > 0) {
      blocks.push({
        text,
        bold: false,
        fontSize: 12,
        spacingAfter: 4,
      });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ text: "", bold: false, fontSize: 12, spacingAfter: 4 });
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/*  Public exports                                                    */
/* ------------------------------------------------------------------ */

export function exportToPDF(title: string, contentHtml: string): void {
  const blocks = htmlToPdfBlocks(contentHtml);
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = 210;
  const textWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, textWidth);
  doc.text(titleLines, marginLeft, y);
  y += titleLines.length * 7 + 4;

  for (const block of blocks) {
    doc.setFontSize(block.fontSize);
    doc.setFont("helvetica", block.bold ? "bold" : "normal");

    const lines = doc.splitTextToSize(block.text, textWidth);
    const lineHeight = block.fontSize * 0.45;
    const blockHeight = lines.length * lineHeight + block.spacingAfter;

    if (y + blockHeight > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, marginLeft, y);
    y += blockHeight;
  }

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function exportToDOCX(
  title: string,
  contentHtml: string,
  indentLeft: number,
  indentRight: number,
  indentFirstLine: number,
): void {
  const paragraphs = htmlToDocxParagraphs(
    contentHtml,
    indentLeft,
    indentRight,
    indentFirstLine,
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                font: "Georgia",
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
