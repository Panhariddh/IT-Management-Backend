export enum DegreeLevel {
  BACHELOR = 1,        // was 'Bachelor'
  HIGH_BACHELOR = 2,   // was 'High Bachelor'
  MASTER = 3,          // was 'Master'
  PHD = 4              // was 'PHD'
}

export const DegreeLevelLabels = {
  [DegreeLevel.BACHELOR]: 'Bachelor',
  [DegreeLevel.HIGH_BACHELOR]: 'High Bachelor',
  [DegreeLevel.MASTER]: 'Master',
  [DegreeLevel.PHD]: 'PhD'
};

export const DegreeLevelOptions = [
  { value: DegreeLevel.BACHELOR, label: 'Bachelor' },
  { value: DegreeLevel.HIGH_BACHELOR, label: 'High Bachelor' },
  { value: DegreeLevel.MASTER, label: 'Master' },
  { value: DegreeLevel.PHD, label: 'PhD' }
];