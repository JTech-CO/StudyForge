import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { useT } from '../hooks/useT';
import { LEGAL_DOCUMENTS, type LegalKind } from '../lib/i18n/legal';

interface LegalPageProps {
  kind: LegalKind;
}

export default function LegalPage({ kind }: LegalPageProps) {
  const { t, locale } = useT();
  const document = LEGAL_DOCUMENTS[locale][kind];
  const relatedKind: LegalKind = kind === 'privacy' ? 'terms' : 'privacy';
  const relatedPath = relatedKind === 'privacy' ? '/privacy' : '/terms';

  return (
    <Container width="reading" className="py-8 sm:py-12">
      <header className="sf-page-head">
        <p className="sf-kicker">StudyForge / {t('legal.kicker')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{document.title}</h1>
        <p className="mt-3 text-sm text-muted">{t('legal.updated', { date: document.updated })}</p>
      </header>

      <div className="mt-8 rounded-lg border border-border border-l-2 border-l-accent bg-surface px-4 py-4 sm:px-5">
        <p className="text-sm leading-relaxed text-fg">{document.summary}</p>
      </div>

      <article className="sf-prose mt-8">
        {document.sections.map((section, index) => (
          <section key={section.heading} aria-labelledby={'legal-section-' + index}>
            <h2 id={'legal-section-' + index}>{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      <div className="mt-10 border-t border-border pt-5">
        <p className="text-sm text-muted">{t('legal.contact')}</p>
        <a
          href="mailto:jtech-bryan@proton.me"
          className="mt-1 inline-flex text-sm text-accent underline underline-offset-2"
        >
          jtech-bryan@proton.me
        </a>
        <nav aria-label={t('legal.navigation')} className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/" className="text-accent underline underline-offset-2">
            {t('legal.backHome')}
          </Link>
          <Link to={relatedPath} className="text-accent underline underline-offset-2">
            {t(relatedKind === 'privacy' ? 'legal.privacy' : 'legal.terms')}
          </Link>
        </nav>
      </div>
    </Container>
  );
}