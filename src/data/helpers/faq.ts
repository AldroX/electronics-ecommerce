import type { FAQItem } from '../types';
import faqData from '../faq.json';

const faqs: FAQItem[] = faqData as unknown as FAQItem[];

export function getAllFAQs(): FAQItem[] {
  return faqs;
}
