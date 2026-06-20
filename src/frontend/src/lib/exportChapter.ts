import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

function htmlToParagraphs(html: string): string[] {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const paragraphs: string[] = [];
  for (const el of tmp.querySelectorAll("p, div, h1, h2, h3, h4, h5, h6, li")) {
    const text = el.textContent?.trim();
    if (text) paragraphs.push(text);
  }
  if (paragraphs.length === 0) {
    const plain = tmp.textContent?.trim() ?? "";
    if (plain) paragraphs.push(plain);
  }
  return paragraphs;
}

export function exportToPDF(title: string, contentHtml: string): void {
  const paragraphs = htmlToParagraphs(contentHtml);
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

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, textWidth);
    if (y + lines.length * 5 + 4 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, marginLeft, y);
    y += lines.length * 5 + 4;
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
  const paragraphs = htmlToParagraphs(contentHtml);

  const twips = (px: number) => Math.round(px * 15);

  const children = paragraphs.map(
    (text) =>
      new Paragraph({
        children: [new TextRun({ text, font: "Georgia", size: 24 })],
        spacing: { after: 200 },
        indent: {
          left: twips(indentLeft),
          right: twips(indentRight),
          firstLine: twips(indentFirstLine),
        },
      }),
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
          ...children,
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
