export function calculateSnehithaRisk(formData) {
  const age = parseInt(formData.Q1, 10) || 0;
  const ageAtMenarche = parseInt(formData.Q10, 10) || 0;
  const irregularCycles = formData.Q12_Current === 'No' ? 1 : 0;
  const breastfeeding24M = formData.Q17 === 'greater than 24 months' ? 1 : 0;
  const firstDegreeRelatives = formData.Q21 === 'First Order (Mother, Sibling, Father)' ? 1 : 0;
  const previousBiopsy = formData.Q40 === 'Yes' ? 1 : 0;

  const isNullipara = formData.Q14 === 'No';
  const ageAtFirstBirth2529 = formData.Q16 === '25 to 29';
  const ageAtFirstBirthGte30 = formData.Q16 === 'After 30';

  const ageAtFirstLiveBirth2529OrNullipara = (isNullipara || ageAtFirstBirth2529) ? 1 : 0;
  const ageAtFirstLiveBirth30OrMore = ageAtFirstBirthGte30 ? 1 : 0;

  const logitP =
    -0.940 +
    0.027 * age -
    0.082 * ageAtMenarche +
    0.453 * irregularCycles -
    0.892 * breastfeeding24M +
    0.810 * firstDegreeRelatives +
    1.420 * previousBiopsy +
    0.811 * ageAtFirstLiveBirth2529OrNullipara +
    1.035 * ageAtFirstLiveBirth30OrMore;

  const probability = 1 / (1 + Math.exp(-logitP));
  let riskPercentage = (probability * 100).toFixed(2);

  if (isNaN(riskPercentage)) {
    riskPercentage = '0.00';
  }

  return riskPercentage;
}

export function getRiskLevel(score) {
  const numScore = parseFloat(score) / 100;
  if (isNaN(numScore)) return null;
  if (numScore < 0.4004) return 'Baseline Risk';
  if (numScore < 0.574) return 'Evident Risk';
  if (numScore < 0.795) return 'Significant Risk';
  return 'High Risk';
}

export function getRiskColor(level) {
  switch (level) {
    case 'Baseline Risk': return '#6ee7b7';
    case 'Evident Risk': return '#fde047';
    case 'Significant Risk': return '#fb923c';
    case 'High Risk': return '#fb7185';
    default: return '#ccc';
  }
}
