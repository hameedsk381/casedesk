import Link from 'next/link';
import { getServerLang } from '@/lib/i18n/serverLang';
import { IllustrationPrivacy } from '@/components/illustrations';

export const dynamic = 'force-dynamic';

// Privacy notice shown at the point of collection. The wording below describes
// what the portal actually does today. Items that need the publisher's own
// details (contact point, retention) are read from the environment and are only
// shown when set — see PRIVACY_CONTACT_EMAIL and PRIVACY_RETENTION_TEXT.

const CONTACT_EMAIL = process.env.PRIVACY_CONTACT_EMAIL?.trim();
const RETENTION_TEXT = process.env.PRIVACY_RETENTION_TEXT?.trim();

type Section = { heading: string; body: string[] };

const CONTENT = {
  en: {
    title: 'Privacy Notice',
    updated: 'This notice explains what happens to the information you send through this helpdesk.',
    back: 'Back to home',
    contactHeading: 'Questions or requests about your information',
    contactIntro: 'To ask about, correct or delete your report, write to:',
    sections: [
      {
        heading: 'Who runs this helpdesk',
        body: ['This helpdesk is a project of Open Vaartha (openvaartha.com). Open Vaartha journalists review the reports sent here.'],
      },
      {
        heading: 'What we collect',
        body: [
          'What you write or record: your story, voice recording and any photos, videos or documents you attach.',
          'Where and when: district, town, ward, street or landmark, and the date of the incident.',
          'Contact details — only if you choose not to stay anonymous: name, phone number, email and preferred language.',
          'Your choices: whether we may contact you and whether the report may be published.',
          'If you tap "Detect my ward", your phone sends its location only to find your ward. We do not store the coordinates — only the ward and municipality.',
          'A cookie that remembers your language choice. We do not use advertising or tracking cookies.',
          'While you fill in the form, the text you type is kept in your browser tab so you do not lose it if the page reloads. It stays on your device and is removed when you send the report or close the tab.',
        ],
      },
      {
        heading: 'Anonymous reports',
        body: ['If you choose to stay anonymous, we do not save your name, phone number or email with the report.'],
      },
      {
        heading: 'Why we use it',
        body: [
          'To review your report, check the facts, and ask the responsible department to respond.',
          'To contact you, only if you allowed it, for more details.',
          'To report on the issue publicly, only if you chose "Yes" to publication and after our review.',
        ],
      },
      {
        heading: 'Automated processing and service providers',
        body: [
          'We use an AI service (Groq) to transcribe voice recordings and to help sort and summarise reports. The text or audio of your report is sent to that service for this purpose.',
          'A person at Open Vaartha reviews reports; the AI does not decide what is published.',
          'Our team may receive an email alert that a new report arrived.',
          'Photos, recordings and documents you attach are stored with Google Cloud (Google Cloud Storage) on our behalf, in private storage that only our systems can read.',
        ],
      },
      {
        heading: 'What may become public',
        body: [
          'Nothing is published unless you chose "Yes" and we have reviewed it.',
          'We never publish your name, phone number, email or exact address.',
          'The public tracker shows only a headline, the ward, the category and which departments replied and how quickly.',
        ],
      },
      {
        heading: 'Who can see your report',
        body: ['Open Vaartha staff who work on reports. Attachments are stored privately and are not public links.'],
      },
      {
        heading: 'Your choices',
        body: [
          'You can submit without giving any contact details.',
          'You can choose "No" or "Discuss with me first" instead of publication.',
          'You can ask us to correct or delete your report; see below for how to reach us.',
          'Keep your reference number to check progress. Anyone with that number can see the status of your report.',
        ],
      },
    ] as Section[],
    retentionHeading: 'How long we keep it',
  },
  te: {
    title: 'గోప్యతా ప్రకటన',
    updated: 'ఈ హెల్ప్‌డెస్క్ ద్వారా మీరు పంపే సమాచారానికి ఏమవుతుందో ఇది వివరిస్తుంది.',
    back: 'హోమ్‌కు వెళ్లండి',
    contactHeading: 'మీ సమాచారం గురించి ప్రశ్నలు లేదా అభ్యర్థనలు',
    contactIntro: 'మీ ఫిర్యాదు గురించి అడగడానికి, సరిదిద్దడానికి లేదా తొలగించమని కోరడానికి వ్రాయండి:',
    sections: [
      {
        heading: 'ఈ హెల్ప్‌డెస్క్‌ను ఎవరు నడుపుతున్నారు',
        body: ['ఈ హెల్ప్‌డెస్క్ ఓపెన్ వార్తా (openvaartha.com) ప్రాజెక్ట్. ఇక్కడికి వచ్చిన ఫిర్యాదులను ఓపెన్ వార్తా జర్నలిస్టులు పరిశీలిస్తారు.'],
      },
      {
        heading: 'మేము ఏమి సేకరిస్తాము',
        body: [
          'మీరు రాసినది లేదా రికార్డ్ చేసినది: మీ కథనం, వాయిస్ రికార్డింగ్, మీరు జతచేసే ఫోటోలు, వీడియోలు, పత్రాలు.',
          'ఎక్కడ, ఎప్పుడు: జిల్లా, పట్టణం, వార్డు, వీధి లేదా గుర్తు, సంఘటన తేదీ.',
          'సంప్రదింపు వివరాలు — మీరు అనామకంగా ఉండకూడదనుకుంటేనే: పేరు, ఫోన్ నంబర్, ఈమెయిల్, ఇష్టమైన భాష.',
          'మీ ఎంపికలు: మేము మిమ్మల్ని సంప్రదించవచ్చా, ఫిర్యాదును ప్రచురించవచ్చా.',
          '"నా వార్డు గుర్తించండి" నొక్కితే, మీ ఫోన్ లొకేషన్ మీ వార్డు కనుగొనడానికి మాత్రమే పంపబడుతుంది. కోఆర్డినేట్లను మేము నిల్వ చేయము — వార్డు, పురపాలక సంఘం పేరు మాత్రమే.',
          'మీ భాష ఎంపికను గుర్తుంచుకునే ఒక కుకీ. ప్రకటనల లేదా ట్రాకింగ్ కుకీలను మేము వాడము.',
          'మీరు ఫారం నింపుతున్నప్పుడు, పేజీ రీలోడ్ అయినా మీ రాత పోకుండా ఉండేందుకు అది మీ బ్రౌజర్ ట్యాబ్‌లో ఉంచబడుతుంది. అది మీ పరికరంలోనే ఉంటుంది; ఫిర్యాదు పంపినప్పుడు లేదా ట్యాబ్ మూసినప్పుడు తొలగిపోతుంది.',
        ],
      },
      {
        heading: 'అనామక ఫిర్యాదులు',
        body: ['మీరు అనామకంగా ఉండాలని ఎంచుకుంటే, మీ పేరు, ఫోన్ నంబర్, ఈమెయిల్ ఫిర్యాదుతో పాటు నిల్వ చేయము.'],
      },
      {
        heading: 'మేము ఎందుకు వాడతాము',
        body: [
          'మీ ఫిర్యాదును పరిశీలించడానికి, వాస్తవాలు ధృవీకరించడానికి, సంబంధిత శాఖను స్పందన కోరడానికి.',
          'మీరు అనుమతిస్తే మాత్రమే, మరిన్ని వివరాల కోసం మిమ్మల్ని సంప్రదించడానికి.',
          'మీరు ప్రచురణకు "అవును" అని ఎంచుకుంటే మాత్రమే, మా పరిశీలన తర్వాత బహిరంగంగా ప్రకటించడానికి.',
        ],
      },
      {
        heading: 'ఆటోమేటెడ్ ప్రాసెసింగ్, సేవా ప్రదాతలు',
        body: [
          'వాయిస్ రికార్డింగ్‌లను అక్షరాల్లోకి మార్చడానికి, ఫిర్యాదులను వర్గీకరించి సారాంశం రాయడానికి మేము AI సేవ (Groq) వాడతాము. ఇందుకు మీ ఫిర్యాదు వచనం లేదా ఆడియో ఆ సేవకు పంపబడుతుంది.',
          'ఓపెన్ వార్తాలో ఒక వ్యక్తి ఫిర్యాదులను పరిశీలిస్తారు; ఏది ప్రచురించాలో AI నిర్ణయించదు.',
          'కొత్త ఫిర్యాదు వచ్చినట్లు మా బృందానికి ఈమెయిల్ హెచ్చరిక వెళ్లవచ్చు.',
          'మీరు జతచేసే ఫోటోలు, రికార్డింగ్‌లు, పత్రాలు మా తరపున Google Cloud (Google Cloud Storage) లో ప్రైవేట్‌గా నిల్వ అవుతాయి; అవి మా వ్యవస్థలు మాత్రమే చదవగలవు.',
        ],
      },
      {
        heading: 'ఏది బహిరంగం కావచ్చు',
        body: [
          'మీరు "అవును" అని ఎంచుకుని, మేము పరిశీలించిన తర్వాత మాత్రమే ప్రచురిస్తాము.',
          'మీ పేరు, ఫోన్ నంబర్, ఈమెయిల్, ఖచ్చితమైన చిరునామాను ఎప్పుడూ ప్రచురించము.',
          'బహిరంగ పట్టికలో శీర్షిక, వార్డు, వర్గం, ఏ శాఖలు ఎంత త్వరగా స్పందించాయి అనేవి మాత్రమే కనిపిస్తాయి.',
        ],
      },
      {
        heading: 'మీ ఫిర్యాదును ఎవరు చూడగలరు',
        body: ['ఫిర్యాదులపై పనిచేసే ఓపెన్ వార్తా సిబ్బంది. జతచేసిన ఫైళ్లు ప్రైవేట్‌గా నిల్వ అవుతాయి; అవి బహిరంగ లింకులు కావు.'],
      },
      {
        heading: 'మీ ఎంపికలు',
        body: [
          'ఎలాంటి సంప్రదింపు వివరాలు ఇవ్వకుండానే పంపవచ్చు.',
          'ప్రచురణకు బదులు "కాదు" లేదా "ముందు నాతో చర్చించండి" ఎంచుకోవచ్చు.',
          'మీ ఫిర్యాదును సరిదిద్దమని లేదా తొలగించమని కోరవచ్చు; మమ్మల్ని ఎలా సంప్రదించాలో కింద చూడండి.',
          'పురోగతి చూడటానికి మీ రిఫరెన్స్ నంబర్‌ను భద్రపరచండి. ఆ నంబర్ ఉన్నవారెవరైనా మీ ఫిర్యాదు స్థితిని చూడగలరు.',
        ],
      },
    ] as Section[],
    retentionHeading: 'ఎంతకాలం ఉంచుతాము',
  },
} as const;

export default async function PrivacyPage() {
  const lang = await getServerLang();
  const t = CONTENT[lang];

  return (
    <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="relative space-y-3">
        <IllustrationPrivacy className="pointer-events-none absolute right-0 top-8 hidden h-36 w-auto sm:block" />
        <div className="flex items-center justify-between text-xs font-semibold">
          <Link href="/" className="text-muted-foreground hover:text-primary">← {t.back}</Link>
          <div className="flex gap-3">
            <Link href="/api/lang?lang=en&next=/privacy" className={lang === 'en' ? 'text-primary' : 'text-muted-foreground'}>EN</Link>
            <Link href="/api/lang?lang=te&next=/privacy" className={lang === 'te' ? 'text-primary' : 'text-muted-foreground'}>తె</Link>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.updated}</p>
      </header>

      {t.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-base font-bold text-primary">{section.heading}</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-foreground">
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}

      {RETENTION_TEXT && (
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">{t.retentionHeading}</h2>
          <p className="text-sm leading-relaxed text-foreground">{RETENTION_TEXT}</p>
        </section>
      )}

      {CONTACT_EMAIL && (
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">{t.contactHeading}</h2>
          <p className="text-sm leading-relaxed text-foreground">
            {t.contactIntro}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-primary underline">{CONTACT_EMAIL}</a>
          </p>
        </section>
      )}
    </main>
  );
}
