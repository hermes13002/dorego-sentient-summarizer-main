const fileInput = document.getElementById("fileInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const outputDiv = document.getElementById("output");
const modeSelect = document.getElementById("modeSelect");

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text;
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (file.type === "text/plain") {
    return await file.text();
  } else {
    alert("Unsupported file type");
    return "";
  }
}

summarizeBtn.addEventListener("click", async () => {
  if (!fileInput.files[0]) return alert("Please upload a file");

  outputDiv.textContent = "⏳ Summarizing....";

  const extractedText = await extractTextFromFile(fileInput.files[0]);
  const mode = modeSelect.value;

  // const response = await fetch("http://localhost:5000/summarize", {
  const response = await fetch("/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: extractedText, mode })
  });

  const data = await response.json();
  let summary = data.summary || "Error: Could not summarize.";

  if (mode === 'bullet') {
    summary = summary.replace(/ ?•/g, '\n•').trim();
    if (summary.startsWith('\n')) summary = summary.slice(1);
  }
  outputDiv.textContent = summary;
});
