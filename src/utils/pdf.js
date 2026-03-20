export async function downloadInvoice(previewRef, invoiceNumber) {
  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      filename: `${invoiceNumber}.pdf`,
      margin: 0,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "px", format: [820, 1160], orientation: "portrait" },
    })
    .from(previewRef.current)
    .save();
}
