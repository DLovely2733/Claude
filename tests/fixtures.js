// TEST FIXTURES ONLY. This text is synthetic and deliberately NOT curriculum
// wording. It mimics the *structure* of an Alberta curriculum document so the
// parser can be tested without reproducing or inventing official outcomes.

export const SAMPLE_TEXT = `
Social Studies 7–9 (Sample structure for tests)
Grade 8
Organizing Idea
Placeholder Idea Eight
Guiding Question
Placeholder question eight?
Learning Outcome
Students do test thing eight.
Knowledge
• Fixture knowledge eight.
Understanding
• Fixture understanding eight.
Skills & Procedures
• Fixture skill eight.
Grade 9
Organizing Idea
Fixture Idea: Test Systems
Guiding Question
How do test governments make test decisions?
Learning Outcome
Students examine fixture structures of a test
government.
Knowledge
• Fixture levels of test government include alpha,
beta and gamma.
• Fixture leaders are chosen by test voting.
◦ fixture sub point about ballots
Understanding
• Fixture decisions affect fixture communities.
Skills & Procedures
• Sort fixture responsibilities by fixture level.
• Sequence fixture steps of a test bill.
Guiding Question
How are test laws created?
Students explain the fixture law process.
Knowledge
Fixture bills receive fixture readings.
Fixture assent completes a fixture law.
Understanding
• Fixture laws apply to fixture citizens.
Skills & Procedures
• Order the fixture steps.
`;

/** Build fake positioned PDF items for a 3-column K/U/S table. */
export function samplePdfPages() {
  const item = (str, x, y, width = str.length * 5) => ({ str, x, y, width, height: 10 });
  const header = (y) => [item('Fixture Running Header', 40, y)];
  return [
    {
      pageNumber: 1,
      items: [
        ...header(10),
        item('Grade 9', 40, 40),
        item('Learning Outcome', 40, 60),
        item('Students examine fixture columns.', 40, 75),
        item('Knowledge', 40, 100),
        item('Understanding', 240, 100),
        item('Skills & Procedures', 440, 100),
        item('• Fixture K one', 40, 120),
        item('• Fixture U one', 240, 120),
        item('• Fixture S one', 440, 120),
        item('• Fixture K two', 40, 140),
        item('continued text', 40, 152),
        // Narrow gutter: the K cell text ends 5pt before the U column starts.
        item('• Fixture K four', 40, 170, 195),
        item('• Fixture U two', 240, 170),
        item('7', 300, 780),
      ],
    },
    {
      pageNumber: 2,
      items: [
        ...header(10),
        item('Knowledge', 40, 30),
        item('Understanding', 240, 30),
        item('Skills & Procedures', 440, 30),
        item('• Fixture K three', 40, 50),
        item('• Fixture S two', 440, 50),
        item('Learning Outcome', 40, 90),
        item('Students test a second fixture.', 40, 105),
        item('8', 300, 780),
      ],
    },
    { pageNumber: 3, items: [...header(10), item('Fixture closing note', 40, 40)] },
  ];
}
