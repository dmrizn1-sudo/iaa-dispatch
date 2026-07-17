# Schema Recommendations — Israel Air Ambulance

Implement via JSON-LD in `<head>` (or GTM). Validate with Google Rich Results Test.

---

## 1. Organization / MedicalBusiness (sitewide)

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "Israel Air Ambulance",
  "alternateName": "Israel Air & Ambulance",
  "url": "https://ambulancenter.com",
  "telephone": "+972-79-670-9999",
  "email": "david@israelairambulance.com",
  "areaServed": "Worldwide",
  "availableLanguage": ["English", "Hebrew"],
  "description": "Private international air ambulance and medical repatriation to and from Israel. ICU medical flights, medical escort, bedside-to-bedside coordination.",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
    ],
    "opens": "00:00",
    "closes": "23:59"
  },
  "sameAs": []
}
```

Add `sameAs` URLs for Facebook, Instagram, LinkedIn, GBP when confirmed.

---

## 2. Service schema (per service LP)

Use on `/air-ambulance-to-israel`, `/icu-air-ambulance`, etc.

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Air Ambulance TO Israel",
  "provider": {
    "@type": "MedicalBusiness",
    "name": "Israel Air Ambulance"
  },
  "areaServed": {
    "@type": "Place",
    "name": "Worldwide"
  },
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceUrl": "https://ambulancenter.com/air-ambulance-to-israel",
    "servicePhone": "+972-79-670-9999"
  },
  "description": "Private air ambulance and critical care medical flights to Israel for families paying privately."
}
```

---

## 3. FAQPage (service, country, city pages)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you provide air ambulance to and from Israel?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Israel Air Ambulance specializes in private international air ambulance and medical escort flights TO Israel and FROM Israel."
      }
    },
    {
      "@type": "Question",
      "name": "Is this a domestic ambulance service?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our international marketing and these pages focus on international medical flights. Domestic ground ambulance is a separate service line and is not the intent of these pages."
      }
    }
  ]
}
```

Full FAQ copy: `faq-pages.md`.

---

## 4. BreadcrumbList (route/city pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://ambulancenter.com/" },
    { "@type": "ListItem", "position": 2, "name": "Routes", "item": "https://ambulancenter.com/routes" },
    { "@type": "ListItem", "position": 3, "name": "USA", "item": "https://ambulancenter.com/routes/usa" },
    { "@type": "ListItem", "position": 4, "name": "New York", "item": "https://ambulancenter.com/routes/usa/new-york" }
  ]
}
```

---

## 5. Article schema (blog guides)

Use `@type: Article` with `headline`, `datePublished`, `dateModified`, `author` (Organization), `publisher`, `image`.

---

## 6. What NOT to mark up

- Fake AggregateRating without real reviews  
- Domestic EMS LocalBusiness NAP that conflicts with international positioning on EN Ads LPs  
- MedicalProcedure claims that overstate clinical guarantees  

---

## 7. Implementation order

1. MedicalBusiness sitewide  
2. FAQPage on core LPs  
3. Service on each Ads landing page  
4. Breadcrumbs on route tree  
5. Article on published guides  
