import type { Offer } from "@/data/types";
import ofertasData from "@/data/ofertas.json";

const offers = ofertasData as Offer[];

export function getAllOffers(): Offer[] {
  return offers;
}

export function getOfferBySlug(slug: string): Offer | undefined {
  return offers.find((o) => o.slug === slug);
}

export function getActiveOffers(): Offer[] {
  const today = new Date().toISOString().split("T")[0];
  return offers.filter((o) => o.validUntil >= today && o.availability !== 'out-of-stock');
}
