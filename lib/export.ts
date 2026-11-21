export function csvContent(rows: (string | number | null)[][]) {
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    const cell = String(value ?? "");
    const formula = typeof value === "string" && /^[\s]*[=+\-@]/.test(cell) ? "'" : "";
    return '"' + formula + cell.replaceAll('"', '""') + '"';
  }).join(";")).join("\r\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadReport(title: string, context: string, lines: string[]) {
  const [{ jsPDF }, logo] = await Promise.all([
    import("jspdf"),
    fetch("/statsbomb.png").then(async (response) => {
      if (!response.ok) return null;
      return new Uint8Array(await response.arrayBuffer());
    }).catch(() => null),
  ]);
  const pdf = new jsPDF({ compress: true });
  const left = 18;
  let y = 22;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Campo 90", left, y);
  if (logo) {
    const format = pdf.getImageProperties(logo);
    pdf.addImage(logo, "PNG", 150, 12, 40, 40 * format.height / format.width, "statsbomb", "FAST");
  }
  y += 12;
  pdf.setFontSize(15);
  pdf.text(pdf.splitTextToSize(title, 174), left, y);
  y += 15;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  for (const line of [context, ...lines, "Fonte: StatsBomb Open Data · https://github.com/hudl/open-data"]) {
    const wrapped = pdf.splitTextToSize(line, 174) as string[];
    if (y + 5 * wrapped.length > 278) { pdf.addPage(); y = 22; }
    pdf.text(wrapped, left, y);
    y += 5 * wrapped.length + 2;
  }
  pdf.save("scoutvision-relatorio.pdf");
}
