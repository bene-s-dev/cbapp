export interface Question {
  q: string;
  h: string;
  o: string[];
}

export interface QuestionPool {
  tot: Question;
  ranking: Question;
  text: Question;
}

export const FALLBACK_QUESTIONS: QuestionPool = {
  tot: { q: "Was machen wir heute Abend?", h: "Entscheidet euch spontan für ein Bauchgefühl.", o: ["Sofa & Netflix", "Rausgehen & Erleben"] },
  ranking: { q: "Ordne nach deiner aktuellen Priorität:", h: "Halte die Karten gedrückt, um sie zu verschieben.", o: ["Freizeit / Hobbys", "Karriere / Arbeit", "Zeit zu zweit", "Schlaf & Erholung"] },
  text: { q: "Was hat dich heute an mir zum Lächeln gebracht?", h: "Nimm dir einen kurzen Moment Zeit zum Nachdenken.", o: [] }
};

export const GREETINGS = ["Schön, dass du da bist, ", "Toll, dass es dich gibt, ", "Hi, ", "Ein Moment für euch, "];
