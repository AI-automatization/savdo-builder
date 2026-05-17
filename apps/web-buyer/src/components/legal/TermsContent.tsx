'use client';

import { useTranslation } from '@/lib/i18n';
import { LegalPage, H2, P, UL } from './LegalPage';

export function TermsContent() {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.terms.title')}
      effectiveDate={t('legal.terms.effectiveDate')}
    >
      <H2>{t('legal.terms.s1.heading')}</H2>
      <P>{t('legal.terms.s1.p1')}</P>

      <H2>{t('legal.terms.s2.heading')}</H2>
      <P>{t('legal.terms.s2.p1')}</P>
      <P>{t('legal.terms.s2.p2')}</P>

      <H2>{t('legal.terms.s3.heading')}</H2>
      <P>{t('legal.terms.s3.p1')}</P>
      <UL>
        <li>{t('legal.terms.s3.li1')}</li>
        <li>{t('legal.terms.s3.li2')}</li>
        <li>{t('legal.terms.s3.li3')}</li>
        <li>{t('legal.terms.s3.li4')}</li>
      </UL>

      <H2>{t('legal.terms.s4.heading')}</H2>
      <P>{t('legal.terms.s4.p1')}</P>

      <H2>{t('legal.terms.s5.heading')}</H2>
      <P>{t('legal.terms.s5.p1')}</P>

      <H2>{t('legal.terms.s6.heading')}</H2>
      <P>{t('legal.terms.s6.p1')}</P>

      <H2>{t('legal.terms.s7.heading')}</H2>
      <P>{t('legal.terms.s7.p1')}</P>
    </LegalPage>
  );
}
