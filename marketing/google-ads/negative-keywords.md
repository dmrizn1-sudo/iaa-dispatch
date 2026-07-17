# Negative Keyword Database — Account Level

Import `negative-keywords.csv` as shared **account** negative lists (Phrase match unless noted).  
Goal: block jobs, training, freebies, domestic EMS, medical tourism, and other non-private international air ambulance intent.

## Categories

### Jobs & careers
job, jobs, career, careers, hiring, salary, salaries, wage, wages, vacancy, vacancies, recruitment, resume, cv, indeed, glassdoor, ems job, ems jobs

### Training & education
course, courses, training, school, schools, college, university, degree, certificate, certification, emt school, paramedic school, paramedic course, emt course, flight nurse course, how to become, volunteer, volunteering, internship, intern

### Free / DIY / research junk
free, cheap, diy, template, pdf, download, wiki, wikipedia, definition, statistics, history of, documentary, reddit, quora, forum, news

### Local / government EMS
911, 999, 112, mda, magen david adom, local ambulance, ambulance driver, ambulance drivers, ground ambulance near me, call ambulance, ambulance service near me, municipal ambulance, government ambulance, public ambulance, regular ambulance, fire department ambulance

### Insurance admin (non-private lead noise)
insurance claim, insurance claims, claim form, reimbursement form, medicare, medicaid, nhs claim

### Explicitly excluded offers
medical tourism, medical tourist, plastic surgery flight, cosmetic surgery travel, dental tourism, ivf tourism

### Unrelated
toy, toys, lego, model airplane, flight simulator, video game, movie, netflix, gif, meme, animal ambulance, pet ambulance, veterinary air ambulance, blood donation, nato, government tender, rfp, ngo tender

## Ongoing hygiene
Every week: export Search Terms → add any new irrelevant themes as Phrase negatives.  
Never negative out core terms like `air ambulance`, `medical flight`, `repatriation`, `medical escort`, `icu transport` unless paired with junk modifiers above.
