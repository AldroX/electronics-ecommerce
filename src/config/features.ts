/// Feature flag utilities
/// Reads from src/config/features.json at build time

import featuresData from '../config/features.json';

export type DataSource = 'static' | 'api';

export interface FeaturesConfig {
  products: DataSource;
  categories: DataSource;
  solutions: DataSource;
  kits: DataSource;
  offers: DataSource;
  guides: DataSource;
  faqs: DataSource;
}

export const features: FeaturesConfig = featuresData as FeaturesConfig;

export function useApiSource(key: keyof FeaturesConfig): boolean {
  return features[key] === 'api';
}
