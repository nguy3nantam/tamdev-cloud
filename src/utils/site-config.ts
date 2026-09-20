import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const configFilePath = resolve(process.cwd(), 'src/config/site-config.json');

export interface SiteConfig {
  brandName: string;
  contact: {
    phoneDisplay: string;
    phoneHref: string;
    zaloHref: string;
    messengerHref: string;
  };
  googleTag: {
    head: string;
    body: string;
  };
}

export const defaultConfig: SiteConfig = {
  brandName: 'Tamdev',
  contact: {
    phoneDisplay: '0900 000 000',
    phoneHref: 'tel:+84900000000',
    zaloHref: 'https://zalo.me/0900000000',
    messengerHref: 'https://m.me/tamdev',
  },
  googleTag: {
    head: '',
    body: '',
  },
};

export function getSiteConfig(): SiteConfig {
  try {
    if (existsSync(configFilePath)) {
      const data = readFileSync(configFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return {
        brandName: parsed.brandName || defaultConfig.brandName,
        contact: {
          phoneDisplay: parsed.contact?.phoneDisplay ?? defaultConfig.contact.phoneDisplay,
          phoneHref: parsed.contact?.phoneHref ?? defaultConfig.contact.phoneHref,
          zaloHref: parsed.contact?.zaloHref ?? defaultConfig.contact.zaloHref,
          messengerHref: parsed.contact?.messengerHref ?? defaultConfig.contact.messengerHref,
        },
        googleTag: {
          head: parsed.googleTag?.head ?? defaultConfig.googleTag.head,
          body: parsed.googleTag?.body ?? defaultConfig.googleTag.body,
        },
      };
    }
  } catch (err) {
    console.error('Error reading site-config.json:', err);
  }
  return defaultConfig;
}

export function saveSiteConfig(partialConfig: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated: SiteConfig = {
    brandName: partialConfig.brandName !== undefined ? partialConfig.brandName : current.brandName,
    contact: { ...current.contact, ...(partialConfig.contact || {}) },
    googleTag: { ...current.googleTag, ...(partialConfig.googleTag || {}) },
  };
  writeFileSync(configFilePath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}
