export type RecommendationLocation = {
  latitude: number;
  longitude: number;
};

export type RecommendationUser = {
  skills: string[];
  location?: RecommendationLocation | null;
};

export type RecommendableJob = {
  skillRequired?: string[];
  latitude?: number;
  longitude?: number;
  pricingAmount?: number;
};

export type RecommendedJob<TJob extends RecommendableJob> = TJob & {
  recommendationScore: number;
  recommendationDistanceKm?: number;
  hasSkillMatch: boolean;
};

const EARTH_RADIUS_KM = 6371;

const normalizeSkill = (skill: string): string => skill.trim().toLowerCase();

export function haversineDistanceKm(from: RecommendationLocation, to: RecommendationLocation): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function recommendJobs<TJob extends RecommendableJob>(jobs: TJob[], user: RecommendationUser): RecommendedJob<TJob>[] {
  const normalizedUserSkills = new Set(user.skills.map(normalizeSkill));
  const pricedJobs = jobs
    .map((job) => job.pricingAmount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount));

  const averagePay = pricedJobs.length > 0
    ? pricedJobs.reduce((total, amount) => total + amount, 0) / pricedJobs.length
    : 300;

  const recommended = jobs.map((job) => {
    const jobSkills = (job.skillRequired || []).map(normalizeSkill);
    const hasSkillMatch = jobSkills.some((skill) => normalizedUserSkills.has(skill));

    let distanceKm: number | undefined;
    if (
      user.location
      && typeof job.latitude === "number"
      && typeof job.longitude === "number"
    ) {
      distanceKm = haversineDistanceKm(user.location, {
        latitude: job.latitude,
        longitude: job.longitude,
      });
    }

    const pay = typeof job.pricingAmount === "number" ? job.pricingAmount : 0;

    let recommendationScore = 0;
    if (hasSkillMatch) recommendationScore += 50;
    if (typeof distanceKm === "number" && distanceKm <= 5) recommendationScore += 30;
    if (pay > averagePay || pay > 300) recommendationScore += 20;

    return {
      ...job,
      recommendationScore,
      recommendationDistanceKm: distanceKm,
      hasSkillMatch,
    };
  });

  recommended.sort((left, right) => right.recommendationScore - left.recommendationScore);

  return recommended;
}
