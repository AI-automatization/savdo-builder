'use client';

import { useTranslation } from '@/lib/i18n';
import { LegalPage, H2, P, UL } from './LegalPage';

export function RefundContent() {
  const { t } = useTranslation();

  return (
    <LegalPage
      title={t('legal.refund.title')}
      effectiveDate={t('legal.refund.effectiveDate')}
    >
      <H2>{t('legal.refund.s1.heading')}</H2>
      <P>{t('legal.refund.s1.p1')}</P>

      <H2>{t('legal.refund.s2.heading')}</H2>
      <P>{t('legal.refund.s2.p1')}</P>
      <UL>
        <li>{t('legal.refund.s2.li1')}</li>
        <li>{t('legal.refund.s2.li2')}</li>
        <li>{t('legal.refund.s2.li3')}</li>
        <li>{t('legal.refund.s2.li4')}</li>
      </UL>

      <H2>{t('legal.refund.s3.heading')}</H2>
      <P>{t('legal.refund.s3.p1')}</P>
      <UL>
        <li>{t('legal.refund.s3.li1')}</li>
        <li>{t('legal.refund.s3.li2')}</li>
        <li>{t('legal.refund.s3.li3')}</li>
      </UL>

      <H2>{t('legal.refund.s4.heading')}</H2>
      <P>{t('legal.refund.s4.p1')}</P>

      <H2>{t('legal.refund.s5.heading')}</H2>
      <P>{t('legal.refund.s5.p1')}</P>

      <H2>{t('legal.refund.s6.heading')}</H2>
      <P>{t('legal.refund.s6.p1')}</P>

      <H2>{t('legal.refund.s7.heading')}</H2>
      <P>{t('legal.refund.s7.p1')}</P>
    </LegalPage>
  );
}
