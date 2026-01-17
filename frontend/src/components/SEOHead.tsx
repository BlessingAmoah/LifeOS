import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
}

export const SEOHead = ({
  title = 'LifeOS - Your Personal Operating System for Intentional Living',
  description = 'LifeOS is a private, cloud-hosted personal dashboard designed to help you intentionally manage your spiritual growth, health, habits, career development, and daily execution from a single platform.',
  keywords = 'personal dashboard, life management, habit tracking, journaling, goal setting, productivity, intentional living, personal growth',
  ogImage = 'https://lifeos-frontend.azurewebsites.net/favicon.svg',
  ogUrl = 'https://lifeos-frontend.azurewebsites.net/',
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update description
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:url', ogUrl, true);

    // Update Twitter tags
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', ogImage, true);
  }, [title, description, keywords, ogImage, ogUrl]);

  return null;
};
