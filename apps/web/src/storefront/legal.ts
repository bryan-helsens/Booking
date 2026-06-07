/**
 * Generates Dutch privacy & terms templates filled with the tenant's details.
 * NOTE: these are starting templates, not legal advice — have them reviewed by
 * a lawyer before going live.
 */
interface LegalSection {
  h: string;
  body: string[];
}
export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
  updated: string;
}

function company(content: any) {
  return {
    name: content?.companyName || 'Dit bedrijf',
    email: content?.contact?.email || 'info@example.com',
    phone: content?.contact?.phone || '',
    address: content?.contact?.address || '',
  };
}

const today = () => new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

export function privacyDoc(content: any): LegalDoc {
  const c = company(content);
  return {
    title: 'Privacyverklaring',
    intro: `${c.name} respecteert je privacy en verwerkt persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG). In deze verklaring lees je hoe wij omgaan met je gegevens wanneer je een afspraak maakt of onze website bezoekt.`,
    updated: today(),
    sections: [
      {
        h: 'Wie zijn wij',
        body: [
          `${c.name} is verwerkingsverantwoordelijke voor de verwerking van je persoonsgegevens.`,
          `Contact: ${c.email}${c.phone ? ` · ${c.phone}` : ''}${c.address ? ` · ${c.address}` : ''}.`,
        ],
      },
      {
        h: 'Welke gegevens verzamelen wij',
        body: [
          'Bij het maken van een afspraak: je naam, e-mailadres, telefoonnummer (indien gevraagd), de gekozen dienst en het tijdstip, en eventuele aanvullende informatie die je zelf invult.',
          'Technische gegevens bij websitebezoek: IP-adres, browsertype en cookievoorkeuren.',
        ],
      },
      {
        h: 'Waarvoor gebruiken wij je gegevens',
        body: [
          'Het inplannen, bevestigen en beheren van je afspraak.',
          'Het versturen van bevestigingen en herinneringen.',
          'Het verbeteren van onze dienstverlening en website.',
          'Het voldoen aan wettelijke verplichtingen.',
        ],
      },
      {
        h: 'Grondslag',
        body: ['Wij verwerken je gegevens op basis van de uitvoering van de overeenkomst (je afspraak), jouw toestemming en/of een gerechtvaardigd belang.'],
      },
      {
        h: 'Bewaartermijn',
        body: ['Wij bewaren je gegevens niet langer dan noodzakelijk voor de doeleinden hierboven, of zolang een wettelijke bewaarplicht dit vereist.'],
      },
      {
        h: 'Delen met derden',
        body: [
          'Wij delen je gegevens alleen met partijen die ons helpen onze dienst te leveren (zoals onze boekingssoftware en e-maildienst), op basis van een verwerkersovereenkomst, en nooit voor commerciële doeleinden van derden.',
        ],
      },
      {
        h: 'Jouw rechten',
        body: [
          `Je hebt recht op inzage, correctie, verwijdering, beperking en overdracht van je gegevens, en het recht je toestemming in te trekken. Stuur hiervoor een e-mail naar ${c.email}.`,
          'Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.',
        ],
      },
      {
        h: 'Cookies',
        body: ['Wij gebruiken noodzakelijke cookies om de site te laten werken en — met je toestemming — analytische cookies. Je kunt je voorkeuren altijd aanpassen.'],
      },
    ],
  };
}

export function termsDoc(content: any): LegalDoc {
  const c = company(content);
  return {
    title: 'Algemene voorwaarden',
    intro: `Deze voorwaarden zijn van toepassing op alle afspraken en diensten van ${c.name}.`,
    updated: today(),
    sections: [
      { h: 'Afspraken', body: ['Een afspraak is bevestigd zodra je via onze website een tijdslot hebt geboekt en een bevestiging hebt ontvangen.'] },
      { h: 'Annuleren & wijzigen', body: ['Je kunt je afspraak annuleren of wijzigen tot het in onze boekingsregels vermelde tijdstip. Bij te late annulering kunnen kosten in rekening worden gebracht.'] },
      { h: 'Prijzen & betaling', body: ['Alle prijzen zijn in euro en inclusief btw, tenzij anders vermeld. Betaling vindt plaats volgens de op de site aangegeven methode.'] },
      { h: 'Aansprakelijkheid', body: [`${c.name} spant zich in voor een goede dienstverlening, maar is niet aansprakelijk voor indirecte schade, voor zover wettelijk toegestaan.`] },
      { h: 'No-show', body: ['Verschijn je niet op je afspraak zonder tijdig te annuleren, dan kunnen wij hiervoor kosten in rekening brengen.'] },
      { h: 'Toepasselijk recht', body: ['Op deze voorwaarden is Nederlands recht van toepassing.'] },
      { h: 'Contact', body: [`Vragen? Neem contact op via ${c.email}${c.phone ? ` of ${c.phone}` : ''}.`] },
    ],
  };
}
