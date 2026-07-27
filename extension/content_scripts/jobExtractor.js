// Job Extractor Content Script for LinkedIn, Greenhouse, Lever, Workday, Ashby, and Wellfound
(function () {
  function extractJobDetails() {
    const host = window.location.hostname;
    let companyName = 'Unknown Company';
    let jobTitle = document.title || 'Unknown Role';
    let location = 'Remote / Unspecified';
    let description = '';
    let platformSource = 'Generic';

    if (host.includes('linkedin.com')) {
      platformSource = 'LinkedIn';
      const titleElem = document.querySelector('.job-details-jobs-unified-top-card__job-title, h1');
      if (titleElem) jobTitle = titleElem.innerText.trim();
      const compElem = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name');
      if (compElem) companyName = compElem.innerText.trim();
      const locElem = document.querySelector('.job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__bullet');
      if (locElem) location = locElem.innerText.trim();
      const descElem = document.querySelector('#job-details, .jobs-description-content');
      if (descElem) description = descElem.innerText.trim();
    } else if (host.includes('greenhouse.io')) {
      platformSource = 'Greenhouse';
      const titleElem = document.querySelector('h1.app-title, .heading');
      if (titleElem) jobTitle = titleElem.innerText.trim();
      const compElem = document.querySelector('.company-name, .heading + span');
      if (compElem) companyName = compElem.innerText.replace('at ', '').trim();
      const locElem = document.querySelector('.location');
      if (locElem) location = locElem.innerText.trim();
      const descElem = document.querySelector('#content');
      if (descElem) description = descElem.innerText.trim();
    } else if (host.includes('lever.co')) {
      platformSource = 'Lever';
      const titleElem = document.querySelector('.posting-header h2');
      if (titleElem) jobTitle = titleElem.innerText.trim();
      const compElem = document.querySelector('.main-header logo img');
      if (compElem) companyName = compElem.getAttribute('alt') || 'Lever Employer';
      const locElem = document.querySelector('.posting-categories .location');
      if (locElem) location = locElem.innerText.trim();
      const descElem = document.querySelector('.section.page-centered');
      if (descElem) description = descElem.innerText.trim();
    } else if (host.includes('myworkdayjobs.com')) {
      platformSource = 'Workday';
      const titleElem = document.querySelector('[data-automation-id="jobPostingHeader"]');
      if (titleElem) jobTitle = titleElem.innerText.trim();
      const locElem = document.querySelector('[data-automation-id="locations"]');
      if (locElem) location = locElem.innerText.trim();
      const descElem = document.querySelector('[data-automation-id="jobPostingDescription"]');
      if (descElem) description = descElem.innerText.trim();
    } else if (host.includes('ashbyhq.com')) {
      platformSource = 'Ashby';
      const titleElem = document.querySelector('h1');
      if (titleElem) jobTitle = titleElem.innerText.trim();
      const descElem = document.querySelector('[class*="jobDescription"]');
      if (descElem) description = descElem.innerText.trim();
    } else if (host.includes('wellfound.com')) {
      platformSource = 'Wellfound';
      const titleElem = document.querySelector('h1');
      if (titleElem) jobTitle = titleElem.innerText.trim();
    }

    return {
      companyName,
      jobTitle,
      location,
      jobUrl: window.location.href,
      description: description.substring(0, 5000),
      platformSource,
      capturedAt: new Date().toISOString()
    };
  }

  // Listen for messages from extension popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_CURRENT_JOB') {
      const details = extractJobDetails();
      sendResponse({ success: true, payload: details });
    }
  });
})();
