async function main() {
  const res = await fetch("http://localhost:5000/api/subjects");
  const data: any = await res.json();
  const subjects = Array.isArray(data) ? data : (data.subjects || []);
  console.log("Count from API:", subjects.length);
  const found = subjects.find((s: any) => s.id === "4f448129-a235-41ea-a9ad-bd5aff7425f0");
  console.log("Found in API:", found);
}

main().catch(console.error);
