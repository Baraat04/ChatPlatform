const KEY = "";

fetch("https://openrouter.ai/api/v1/models", {
    headers: { "Authorization": `Bearer ${KEY}` }
})
.then(r => r.json())
.then(data => {
    const free = data.data.filter(m => 
        m.id.includes(":free") || m.pricing?.prompt === "0"
    );
    console.log(`\n✅ Found ${free.length} free models:\n`);
    free.forEach(m => console.log(" -", m.id));
})
.catch(console.error);