'use client';

import { useTranslation } from '@/lib/i18n';
import { LegalPage, H2, P, UL } from './LegalPage';

export function PrivacyContent() {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.privacy.title')}
      effectiveDate={t('legal.privacy.effectiveDate')}
    >
      <H2>{t('legal.privacy.s1.heading')}</H2>
      <P>{t('legal.privacy.s1.p1')}</P>
      <UL>
        <li>{t('legal.privacy.s1.li1')}</li>
        <li>{t('legal.privacy.s1.li2')}</li>
        <li>{t('legal.privacy.s1.li3')}</li>
        <li>{t('legal.privacy.s1.li4')}</li>
      </UL>

      <H2>{t('legal.privacy.s2.heading')}</H2>
      <UL>
        <li>{t('legal.privacy.s2.li1')}</li>
        <li>{t('legal.privacy.s2.li2')}</li>
        <li>{t('legal.privacy.s2.li3')}</li>
        <li>{t('legal.privacy.s2.li4')}</li>
        <li>{t('legal.privacy.s2.li5')}</li>
      </UL>

      <H2>{t('legal.privacy.s3.heading')}</H2>
      <P>{t('legal.privacy.s3.p1')}</P>

      <H2>{t('legal.privacy.s4.heading')}</H2>
      <P>{t('legal.privacy.s4.p1')}</P>

      <H2>{t('legal.privacy.s5.heading')}</H2>
      <P>{t('legal.privacy.s5.p1')}</P>

      <H2>{t('legal.privacy.s6.heading')}</H2>
      <P>{t('legal.privacy.s6.p1')}</P>

      <H2>{t('legal.privacy.s7.heading')}</H2>
      <P>{t('legal.privacy.s7.p1')}</P>

      <H2>{t('legal.privacy.s8.heading')}</H2>
      <P>{t('legal.privacy.s8.p1')}</P>
    </LegalPage>
  );
}
