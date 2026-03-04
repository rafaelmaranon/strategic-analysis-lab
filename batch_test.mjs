import fetch from "node-fetch";

const QUESTIONS = [
  "Can SF support 15K robotaxis by 2032?",
  "When does teleoperations become the dominant cost in a 20,000 vehicle robotaxi fleet?",
  "Can Company A become a $1T company by 2035?"
];

async function run() {

  for (const q of QUESTIONS) {

    const res = await fetch("http://localhost:3000/modelspec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: q })
    });

    const spec = await res.json();

    console.log("\n==============================");
    console.log("QUESTION:");
    console.log(q);

    console.log("\nBLUEPRINT:");
    console.log(spec.blueprint);

    console.log("\nVARIABLES:");
    console.table(spec.variables);

    console.log("\nNODE IDS:");
    console.log(spec.nodes.map(n => n.id));

    console.log("\nOUTPUTS:");
    console.log(spec.outputs);

  }

}

run();
