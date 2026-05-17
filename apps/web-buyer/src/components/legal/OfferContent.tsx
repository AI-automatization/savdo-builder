'use client';

import { useTranslation } from '@/lib/i18n';
import { LegalPage, H2, P, UL } from './LegalPage';

export function OfferContent() {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.offer.title')}
      effectiveDate={t('legal.offer.effectiveDate')}
    >
      <H2>{t('legal.offer.s1.heading')}</H2>
      <P>{t('legal.offer.s1.p1')}</P>

      <H2>{t('legal.offer.s2.heading')}</H2>
      <P>{t('legal.offer.s2.p1')}</P>
      <UL>
        <li>{t('legal.offer.s2.li1')}</li>
        <li>{t('legal.offer.s2.li2')}</li>
        <li>{t('legal.offer.s2.li3')}</li>
      </UL>

      <H2>{t('legal.offer.s3.heading')}</H2>
      <P>{t('legal.offer.s3.p1')}</P>

      <H2>{t('legal.offer.s4.heading')}</H2>
      <P>{t('legal.offer.s4.p1')}</P>

      <H2>{t('legal.offer.s5.heading')}</H2>
      <UL>
        <li>{t('legal.offer.s5.li1')}</li>
        <li>{t('legal.offer.s5.li2')}</li>
        <li>{t('legal.offer.s5.li3')}</li>
      </UL>

      <H2>{t('legal.offer.s6.heading')}</H2>
      <P>{t('legal.offer.s6.p1')}</P>

      <H2>{t('legal.offer.s7.heading')}</H2>
      <P>{t('legal.offer.s7.p1')}</P>

      <H2>{t('legal.offer.s8.heading')}</H2>
      <P>{t('legal.offer.s8.p1')}</P>

      <H2>{t('legal.offer.s9.heading')}</H2>
      <P>{t('legal.offer.s9.p1')}</P>
    </LegalPage>
  );
}
