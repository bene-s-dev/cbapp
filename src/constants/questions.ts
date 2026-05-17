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

export const GREETINGS = [
  "Schön, dass du da bist, ",
  "Toll, dass es dich gibt, ",
  "Einen wundervollen Tag, ",
  "Schön, dich zu sehen, ",
  "Lass uns den Tag gemeinsam beginnen, ",
  "Ein Moment für euch zwei, ",
  "Schön, dass wir uns haben, ",
  "Ganz viel Liebe für dich, ",
  "Heute ist ein guter Tag für uns, ",
  "Bereit für neue gemeinsame Momente, ",
  "Du bist wundervoll, ",
  "Schön, dass du mein Lieblingsmensch bist, ",
  "Lass uns heute wieder ein Stück näher rücken, ",
  "Danke, dass du du bist, ",
  "Ein Herzchen für dich, ",
  "Auf einen tollen gemeinsamen Tag, ",
  "Du machst meinen Tag besser, ",
  "Schön, dich an meiner Seite zu wissen, "
];
