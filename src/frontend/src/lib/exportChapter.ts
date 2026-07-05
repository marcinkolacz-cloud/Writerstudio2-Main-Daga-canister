import type {
  AlignmentType as AlignmentTypeT,
  Document,
  Packer,
  PageNumber as PageNumberT,
  Paragraph,
  TextRun,
} from "docx";

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

export async function exportToPDF(
  title: string,
  contentHtml: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
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

    const lineHeight = block.fontSize * 0.45;
    const lines = block.text.split("\n");
    for (const line of lines) {
      if (y + lineHeight > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginLeft, y);
      y += lineHeight;
    }
    y += block.spacingAfter;
  }

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export async function exportToDOCX(
  title: string,
  contentHtml: string,
  indentLeft: number,
  indentRight: number,
  indentFirstLine: number,
): Promise<void> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const collectTextRuns = (
    node: Node,
    inherited: { bold: boolean; italics: boolean; underline: boolean },
  ): TextRun[] => {
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
  };

  const htmlToDocxParagraphs = (
    html: string,
    iLeft: number,
    iRight: number,
    iFirstLine: number,
  ): Paragraph[] => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    const twips = (px: number) => Math.round(px * 15);
    const indent = {
      left: twips(iLeft),
      right: twips(iRight),
      firstLine: twips(iFirstLine),
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
              spacing: { after: 240 },
              indent,
            }),
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: runs,
              spacing: { after: 0, line: 276 },
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
                children: [
                  new TextRun({ text: "", font: "Georgia", size: 24 }),
                ],
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
            spacing: { after: 0, line: 276 },
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
  };

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

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Redaction export (DOCX z ustawieniami redakcyjnymi)               */
/* ------------------------------------------------------------------ */

export interface RedactionSettings {
  /** Justowanie tekstu (true = JUSTIFIED, false = left) */
  justify: boolean;
  /** Interlinia (np. 1.0, 1.5, 2.0) — mnożnik bazowy 240 */
  lineSpacing: number;
  /** Margines górny w cm */
  marginTop: number;
  /** Margines dolny w cm */
  marginBottom: number;
  /** Margines lewy w cm */
  marginLeft: number;
  /** Margines prawy w cm */
  marginRight: number;
  /** Rozmiar czcionki w punktach (pt) */
  fontSize: number;
  /** Wcięcie pierwszej linii w cm */
  firstLineIndent: number;
  /** Czy dodawać numerację stron w stopce */
  pageNumbers: boolean;
}

export async function exportToDOCXWithRedaction(
  title: string,
  contentHtml: string,
  settings: RedactionSettings,
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    PageNumber,
    Footer,
  } = await import("docx");

  const halfPoints = settings.fontSize * 2;
  const lineSpacingTwips = Math.round(settings.lineSpacing * 240);
  const firstLineIndentTwips = Math.round(settings.firstLineIndent * 567);

  const collectTextRuns = (
    node: Node,
    inherited: { bold: boolean; italics: boolean; underline: boolean },
  ): TextRun[] => {
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
            size: halfPoints,
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
          size: halfPoints,
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
  };

  const htmlToDocxParagraphs = (html: string): Paragraph[] => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    const paragraphs: Paragraph[] = [];
    const alignment = settings.justify ? AlignmentType.JUSTIFIED : undefined;

    const baseParagraphOpts = () => ({
      alignment,
      spacing: { after: 0, line: lineSpacingTwips },
      indent: { firstLine: firstLineIndentTwips },
    });

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
              children: [
                new TextRun({ text: "", font: "Georgia", size: halfPoints }),
              ],
              ...baseParagraphOpts(),
            }),
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: runs,
              ...baseParagraphOpts(),
            }),
          );
        }
        continue;
      }

      if (/^h[1-6]$/.test(tag)) {
        const level = Number.parseInt(tag[1], 10);
        const headingSize = (32 - (level - 1) * 2) * 2;
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
                  size: headingSize,
                }),
            ),
            spacing: { after: 200, line: lineSpacingTwips },
            indent: { firstLine: firstLineIndentTwips },
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
                children: [
                  new TextRun({ text: "", font: "Georgia", size: halfPoints }),
                ],
                spacing: { after: 100, line: lineSpacingTwips },
                indent: { firstLine: firstLineIndentTwips },
              }),
            );
          } else {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: tag === "ul" ? "\u2022 " : "",
                    font: "Georgia",
                    size: halfPoints,
                  }),
                  ...runs,
                ],
                spacing: { after: 100, line: lineSpacingTwips },
                indent: { firstLine: firstLineIndentTwips },
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
              children: [
                new TextRun({ text: "", font: "Georgia", size: halfPoints }),
              ],
              spacing: { after: 100, line: lineSpacingTwips },
              indent: { firstLine: firstLineIndentTwips },
            }),
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "\u2022 ",
                  font: "Georgia",
                  size: halfPoints,
                }),
                ...runs,
              ],
              spacing: { after: 100, line: lineSpacingTwips },
              indent: { firstLine: firstLineIndentTwips },
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
            ...baseParagraphOpts(),
          }),
        );
      }
    }

    if (paragraphs.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "", font: "Georgia", size: halfPoints }),
          ],
          ...baseParagraphOpts(),
        }),
      );
    }

    return paragraphs;
  };

  const paragraphs = htmlToDocxParagraphs(contentHtml);

  const sectionProperties: {
    page: {
      size: { width: number; height: number };
      margin: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
    };
  } = {
    page: {
      size: { width: 11906, height: 16838 },
      margin: {
        top: Math.round(settings.marginTop * 567),
        bottom: Math.round(settings.marginBottom * 567),
        left: Math.round(settings.marginLeft * 567),
        right: Math.round(settings.marginRight * 567),
      },
    },
  };

  const section = {
    properties: sectionProperties,
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
  } as {
    properties: typeof sectionProperties;
    footers?: {
      default: InstanceType<typeof Footer>;
    };
    children: Paragraph[];
  };

  if (settings.pageNumbers) {
    section.footers = {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT] })],
          }),
        ],
      }),
    };
  }

  const doc = new Document({ sections: [section] });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
