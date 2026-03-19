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

export const studentStore = atom({ nombre: '', grupo: '', fecha: '', cedula: '' });

export const sectionProgress = atom({
  fillInBlank: false,
  matching: false,
  ordering: false,
  multipleChoice: false,
});

export const isLocked = atom(false);

export function markVerified(section, value = true) {
  sectionProgress.set({ ...sectionProgress.get(), [section]: value });
}
