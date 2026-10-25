import type { CurriculumProfile, Outcome } from './types';

// The general and specific outcome headings of the Alberta English Language
// Arts (K–9) Program of Studies. Only headings are listed: NovelVerse does not
// reproduce or invent the numbered bullet-level outcomes beneath them.
//
// Every outcome starts as "unverified". The official documents could not be
// reached when this profile was written, so the teacher confirms each heading
// against the current Alberta document (or replaces the profile with their
// own) in Mission Control → Curriculum.

const o = (code: string, label: string, group: string): Outcome => ({
  id: `ab-ela9-${code}`,
  code,
  label,
  group,
  status: 'unverified',
});

const GO1 = 'General Outcome 1: Explore thoughts, ideas, feelings and experiences';
const GO2 = 'General Outcome 2: Comprehend and respond personally and critically to oral, print and other media texts';
const GO3 = 'General Outcome 3: Manage ideas and information';
const GO4 = 'General Outcome 4: Enhance the clarity and artistry of communication';
const GO5 = 'General Outcome 5: Respect, support and collaborate with others';

export const ALBERTA_ELA_HEADINGS: CurriculumProfile = {
  id: 'ab-ela-k9-headings',
  name: 'Alberta ELA (K–9) Program of Studies: Grade 9 outcome headings',
  source: 'Alberta Education, English Language Arts (K–9) Program of Studies. Check against the current document at alberta.ca / LearnAlberta.',
  note: 'Headings only. Confirm each one (or paste in the outcomes your school uses) before relying on this profile for reporting.',
  outcomes: [
    o('1.1', 'Discover and explore', GO1),
    o('1.2', 'Clarify and extend', GO1),
    o('2.1', 'Use strategies and cues', GO2),
    o('2.2', 'Respond to texts', GO2),
    o('2.3', 'Understand forms, elements and techniques', GO2),
    o('2.4', 'Create original text', GO2),
    o('3.1', 'Plan and focus', GO3),
    o('3.2', 'Select and process', GO3),
    o('3.3', 'Organize, record and evaluate', GO3),
    o('3.4', 'Share and review', GO3),
    o('4.1', 'Enhance and improve', GO4),
    o('4.2', 'Attend to conventions', GO4),
    o('4.3', 'Present and share', GO4),
    o('5.1', 'Respect others and strengthen community', GO5),
    o('5.2', 'Work within a group', GO5),
  ],
};

/**
 * Turns pasted lines into outcomes. Accepts "CODE | label", "CODE<tab>label"
 * or "CODE - label"; a line without a separator becomes a group heading for
 * the lines after it. Pasted outcomes are marked verified because they come
 * from the teacher's own document.
 */
export function parseOutcomes(text: string, profileId: string): Outcome[] {
  const out: Outcome[] = [];
  let group = 'Imported outcomes';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\S+)\s*(?:\||\t| - | – | — )\s*(.+)$/);
    if (!m) {
      group = line;
      continue;
    }
    const [, code, label] = m;
    out.push({ id: `${profileId}-${code}`, code, label: label.trim(), group, status: 'verified' });
  }
  return out;
}
