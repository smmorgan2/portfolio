/* The project list: order here is the order of Previous / Next (and later, the homepage).
   live: false hides a project everywhere on the site: no Previous / Next links point to it,
   and its own page sends visitors back to the homepage.

   COMPOSER: keep live: false until Whipsaw confirms nothing is embargoed and the
   AI-generated imagery is signed off. Flip it to true to publish. */
window.PROJECTS = [
  { id: 'google-ads', title: 'Google Ads', href: 'google-ads.html', live: true },
  { id: 'composer',   title: 'Composer',   href: 'composer.html',   live: false },
];
