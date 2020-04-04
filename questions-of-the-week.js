const fs = require("fs");
const path = require("path");

const filePath = `./${process.argv[2]}`;

if (!filePath) {
  console.error(
    "You must provide a path to the slack export folder! (unzipped)"
  );
  process.exit();
} else {
  console.log(
    `Let's have a look at \n${filePath}\nshall we.\nTry and find tasty some questions of the week...`
  );
}

const slackExportFolders = fs.readdirSync(filePath);

const questionOfTheWeek = slackExportFolders.find(
  (f) => f === "question-of-the-week"
);

if (!questionOfTheWeek) {
  console.error("could not find a question-of-the-week folder :(");
}

const jsons = fs.readdirSync(path.join(filePath, questionOfTheWeek));

let entries = [];

jsons.forEach((file) => {
  const jsonLocation = path.join(__dirname, filePath, questionOfTheWeek, file);
  entries = [
    ...entries,
    ...require(jsonLocation).map((i) => ({ ...i, date: file.slice(0, -5) })),
  ];
});

const potentialQuestions = entries.filter(
  (e) => e.topic && e.topic.toLowerCase().includes("qotw")
);

const questionsWithReactions = potentialQuestions.map((q) => ({
  date: q.date,
  question: q.text,
  reactions: q.reactions ? q.reactions.map((r) => r.name) : [],
}));

const questionsWithAnswers = questionsWithReactions.map((question, key) => {
  const questionDate = new Date(question.date);
  const nextQuestionDate = questionsWithReactions[key + 1]
    ? new Date(questionsWithReactions[key + 1].date)
    : new Date();

  return {
    ...question,
    responses: entries
      .filter(
        (e) =>
          new Date(e.date) > questionDate &&
          new Date(e.date) < nextQuestionDate &&
          e.type === "message" &&
          !e.subtype
      )
      .map((r) => ({
        answer: r.text,
        user: r.user_profile ? r.user_profile.name : undefined,
      })),
  };
});

console.log(questionsWithAnswers);

fs.writeFileSync(
  "questions-with-answers.json",
  JSON.stringify(questionsWithAnswers, null, 4)
);
