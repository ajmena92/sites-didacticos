// astro-site/src/stores/score.js
import { atom, computed } from 'nanostores';

export const sectionScores = atom({
  fillInBlank: 0,
  matching: 0,
  ordering: 0,
  multipleChoice: 0,
});

export const totalScore = computed(sectionScores, (scores) =>
  Object.values(scores).reduce((sum, v) => sum + v, 0)
);

export function updateSection(section, points) {
  sectionScores.set({ ...sectionScores.get(), [section]: points });
}
