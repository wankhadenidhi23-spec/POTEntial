/* =========================================================
   POTENTIAL — LANDING PAGE INTERACTIONS
   Vanilla JS only. No frameworks, no external dependencies.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initNavbarScrollState();
  initSmoothScroll();
  initScrollReveal();
  initOpportunityCards();
  initFutureLinkPlaceholders();
  loadOpportunities();
});

/* ---------------------------------------------------------
   1. Mobile hamburger menu
   --------------------------------------------------------- */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    hamburger.classList.toggle('is-active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close the menu after tapping a link
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
    });
  });
}

/* ---------------------------------------------------------
   2. Navbar scroll behavior (adds shadow/border once scrolled)
   --------------------------------------------------------- */
function initNavbarScrollState() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const toggleScrolled = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  toggleScrolled();
  window.addEventListener('scroll', toggleScrolled, { passive: true });
}

/* ---------------------------------------------------------
   3. Smooth scrolling for in-page anchor links
   --------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ---------------------------------------------------------
   4. Scroll reveal animations
   Adds `.reveal` to key elements at runtime, then reveals
   them with a single IntersectionObserver as they enter view.
   --------------------------------------------------------- */
function initScrollReveal() {
  const revealTargets = document.querySelectorAll(
    '.feature-card, .steps-column, .opportunity-card, .trust-badge'
  );

  revealTargets.forEach((el) => el.classList.add('reveal'));

  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   5. Opportunity card interactions
   Demo-only: clicking a card currently just logs its title.
   Replace this with routing to a real opportunity detail page
   (e.g. `/opportunities/:id`) once opportunities come from Supabase.
   --------------------------------------------------------- */
function initOpportunityCards() {
  const cards = document.querySelectorAll('.opportunity-card');

  cards.forEach((card) => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    const title = card.querySelector('h3')?.textContent?.trim() ?? 'Opportunity';
    card.setAttribute('aria-label', `View details for ${title}`);

    const openCard = () => {
      // TODO: replace with navigation to the real opportunity detail page
      // once opportunity IDs exist, e.g. `window.location.href = '/opportunities/' + id;`
      console.log(`Opportunity card selected: ${title}`);
    };

    card.addEventListener('click', openCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  const viewAllLink = document.getElementById('viewAllLink');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (event) => {
      // TODO: point this at the real opportunities listing page/route.
      event.preventDefault();
      console.log('Navigate to full opportunities listing (not yet built).');
    });
  }
}

/* ---------------------------------------------------------
   6. Supabase — live opportunities
   Requires supabase-config.js (loaded before this file) to
   define SUPABASE_URL and SUPABASE_ANON_KEY, and the
   @supabase/supabase-js CDN script to be loaded first.

   ASSUMED SCHEMA (adjust the query below to match yours):
     table "opportunities"
       id            uuid / int
       title         text
       type          text   -- e.g. "Part-time", "Flexible", "Project"
       location      text
       pay           text, nullable
       status        text   -- filtered to 'active' below
       created_at    timestamp
       business_id   uuid / int, foreign key -> business.id
     table "business"
       id            uuid / int
       name          text

   If your column or table names differ, edit SELECT_QUERY,
   TABLE_NAME, and the field lookups in renderOpportunityCard().
   --------------------------------------------------------- */

const OPPORTUNITIES_TABLE = 'opportunities';
const OPPORTUNITIES_LIMIT = 4;

function getSupabaseClient() {
  if (
    typeof window.supabase === 'undefined' ||
    typeof SUPABASE_URL === 'undefined' ||
    typeof SUPABASE_ANON_KEY === 'undefined' ||
    SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL' ||
    SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY'
  ) {
    return null;
  }
  // Reuse a single client across calls instead of creating one per fetch.
  if (!window.__potentialSupabaseClient) {
    window.__potentialSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return window.__potentialSupabaseClient;
}

async function loadOpportunities() {
  const grid = document.getElementById('opportunityGrid');
  if (!grid) return;

  const client = getSupabaseClient();
  if (!client) {
    // Config not filled in yet — keep the static demo cards as-is.
    console.info('Supabase not configured yet — showing demo opportunity cards. Fill in supabase-config.js to go live.');
    return;
  }

  try {
    const { data, error } = await client
      .from(OPPORTUNITIES_TABLE)
      .select('id, title, type, location, pay, status, created_at, business:business_id ( name )')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(OPPORTUNITIES_LIMIT);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = '<p class="opportunity-empty">No opportunities posted yet — check back soon.</p>';
      return;
    }

    grid.innerHTML = data.map(renderOpportunityCard).join('');

    // Re-run interactivity (click/keyboard handling, reveal) on the freshly rendered cards.
    initOpportunityCards();
    document.querySelectorAll('#opportunityGrid .opportunity-card').forEach((el) => {
      el.classList.add('reveal', 'is-visible');
    });
  } catch (err) {
    // Network/config error: leave the fallback demo cards visible rather than an empty grid.
    console.error('Could not load opportunities from Supabase:', err.message || err);
  }
}

function renderOpportunityCard(opportunity) {
  const title = escapeHtml(opportunity.title || 'Untitled opportunity');
  const businessName = escapeHtml(opportunity.business?.name || 'Local Business');
  const type = escapeHtml(opportunity.type || 'Opportunity');
  const location = escapeHtml(opportunity.location || '');
  const pay = opportunity.pay ? escapeHtml(opportunity.pay) : '';
  const meta = [location, pay].filter(Boolean).join(' · ');

  return `
    <article class="opportunity-card" data-id="${escapeHtml(String(opportunity.id))}" data-type="${type}">
      <div class="opportunity-card__top">
        <span class="opportunity-card__badge">${type}</span>
      </div>
      <h3>${title}</h3>
      <p class="opportunity-card__business">${businessName}</p>
      <p class="opportunity-card__meta">${meta || 'Details coming soon'}</p>
    </article>
  `;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

/* ---------------------------------------------------------
   7. Placeholder wiring for auth-dependent buttons
   These buttons (Login, Get Started, Find Opportunities,
   Post an Opportunity, I'm a Student, I'm a Business) currently
   scroll to in-page sections or do nothing destructive.
   Swap the href/behavior for real routes once the
   authentication and dashboard pages exist.
   --------------------------------------------------------- */
function initFutureLinkPlaceholders() {
  const placeholderSelectors = [
    'a[href="#login"]',
    'a[href="#get-started"]',
    'a[href="#post-opportunity"]',
  ];

  document.querySelectorAll(placeholderSelectors.join(',')).forEach((link) => {
    link.addEventListener('click', () => {
      // Intentionally left as a no-op beyond the default anchor behavior.
      // Hook real navigation/auth logic in here later, e.g.:
      // window.location.href = '/login';
    });
  });
}
