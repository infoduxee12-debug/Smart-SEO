export interface SocialPlatformData {
  title: string;
  hashtags: string[];
}

export interface SocialResultsData {
  facebook: SocialPlatformData;
  instagram: SocialPlatformData;
  tiktok: SocialPlatformData;
}

export interface ResearchSource {
  title: string;
  uri: string;
}
