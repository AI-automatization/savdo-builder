'use client';

import { useTranslation } from '@/lib/i18n';
import { LegalPage, H2, P } from './LegalPage';

export function HelpContent() {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.help.title')}
      effectiveDate={t('legal.help.effectiveDate')}
    >
      <P>{t('legal.help.intro')}</P>

      <H2>{t('legal.help.s1.q')}</H2>
      <P>{t('legal.help.s1.a')}</P>

      <H2>{t('legal.help.s2.q')}</H2>
      <P>{t('legal.help.s2.a')}</P>

      <H2>{t('legal.help.s3.q')}</H2>
      <P>{t('legal.help.s3.a')}</P>

      <H2>{t('legal.help.s4.q')}</H2>
      <P>{t('legal.help.s4.a')}</P>

      <H2>{t('legal.help.s5.q')}</H2>
      <P>{t('legal.help.s5.a')}</P>

      <H2>{t('legal.help.s6.q')}</H2>
      <P>{t('legal.help.s6.a')}</P>

      <H2>{t('legal.help.s7.q')}</H2>
      <P>{t('legal.help.s7.a')}</P>

      <H2>{t('legal.help.s8.q')}</H2>
      <P>{t('legal.help.s8.a')}</P>
    </LegalPage>
  );
}
