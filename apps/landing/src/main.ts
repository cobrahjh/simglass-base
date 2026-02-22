import "./style.css";

interface Project {
  title: string;
  description: string;
  url: string | null;
  status: "live" | "soon";
}

const projects: Project[] = [
  {
    title: "GTN750Xi Avionics",
    description:
      "Full-featured Garmin GTN750Xi panel replica with moving map, flight planning, weather, and navigation.",
    url: "https://simglass-avionics.vercel.app",
    status: "live",
  },
  {
    title: "AI Autopilot",
    description:
      "Intelligent flight assistant with phase-aware automation, rule engine, and real-time diagnostics.",
    url: null,
    status: "soon",
  },
];

function render() {
  const app = document.getElementById("app")!;

  const cards = projects
    .map((p) => {
      const tag = p.status === "live" ? "a" : "div";
      const href = p.url ? ` href="${p.url}" target="_blank" rel="noopener"` : "";
      const badgeClass = p.status === "live" ? "badge--live" : "badge--soon";
      const badgeText = p.status === "live" ? "LIVE" : "COMING SOON";

      return `<${tag} class="card"${href}>
      <span class="badge ${badgeClass}">${badgeText}</span>
      <h2>${p.title}</h2>
      <p>${p.description}</p>
    </${tag}>`;
    })
    .join("");

  app.innerHTML = `
    <header>
      <h1>SIMGLASS</h1>
      <p>Flight Simulation Toolkit</p>
    </header>
    <main class="grid">${cards}</main>
    <footer>&copy; ${new Date().getFullYear()} SimGlass</footer>
  `;
}

render();
