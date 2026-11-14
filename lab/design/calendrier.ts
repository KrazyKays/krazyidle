// Liste les fenêtres d'événement du 16 au 17/11/2026 (début des parties simulées).
import { upcomingEvents } from '../../src/engine/events';
for (const w of upcomingEvents(Date.UTC(2026, 10, 16), Number(process.argv[2] ?? 8))) console.log(w.key, w.def.id);
