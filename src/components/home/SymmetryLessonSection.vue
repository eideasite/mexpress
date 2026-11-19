<script setup>
import { computed } from 'vue'

const props = defineProps({
  language: {
    type: String,
    default: 'en',
  },
})

const tamil = computed(() => props.language === 'ta')
</script>

<template>
  <section
    class="home-symmetry-section surface-card"
    aria-labelledby="symmetry-heading"
  >
    <header class="symmetry-heading">
      <span class="eyebrow">{{ tamil ? 'வடிவங்களைக் கவனிப்போம்' : 'Explore shapes' }}</span>
      <h2 id="symmetry-heading">
        {{ tamil ? 'சமச்சீர்: இரண்டு வழிகள்' : 'Symmetry: two ways to see a shape' }}
      </h2>
      <p>
        {{ tamil
          ? 'ஒரு உருவத்தின் பகுதிகள் எவ்வாறு பொருந்துகின்றன என்பதை மடிப்பு கோடும் மையமும் விளக்குகின்றன.'
          : 'A fold line and a center point help show how a shape’s parts relate.' }}
      </p>
    </header>

    <div class="symmetry-panels">
      <article class="symmetry-panel">
        <span class="symmetry-panel-number">01</span>
        <h3>{{ tamil ? 'இருபுடைச் சமச்சீர்' : 'Bilateral symmetry' }}</h3>
        <p>
          {{ tamil
            ? 'ஒரு கோட்டில் மடித்தால் இரு பக்கங்களும் ஒன்றின் மேல் ஒன்று பொருந்தும். அந்தக் கோடு சமச்சீர் அச்சு; பல வடிவங்களுக்கு ஒன்றுக்கும் மேற்பட்ட அச்சுகள் இருக்கலாம்.'
            : 'A line is an axis of symmetry when folding a shape along it makes the two halves match. A shape can have more than one axis.' }}
        </p>
        <p>
          <strong>{{ tamil ? 'உதாரணங்கள்:' : 'Examples:' }}</strong>
          {{ tamil
            ? 'சரியான block-letter வடிவில் A, M, T, U, V; இதய வடிவம்; மனித உடல் மற்றும் பட்டாம்பூச்சி (இயற்கையில் இவை தோராயமாகச் சமச்சீர்).'
            : 'A, M, T, U and V in standard block capitals; a heart; and a human body or butterfly, which are approximate examples in nature.' }}
        </p>
      </article>

      <article class="symmetry-panel">
        <span class="symmetry-panel-number">02</span>
        <h3>{{ tamil ? 'ஆரச் சமச்சீர்' : 'Radial symmetry' }}</h3>
        <p>
          {{ tamil
            ? 'ஒரு மையத்தைச் சுற்றி ஒரே மாதிரியான பகுதிகள் மீண்டும் மீண்டும் அமைந்திருக்கும். சில வடிவங்கள் குறிப்பிட்ட கோணத்தில் சுழற்றினால் மட்டுமே மீண்டும் பொருந்தும்; எந்தக் கோட்டிலும் சம பாகங்கள் கிடைக்கும் என்று சொல்ல முடியாது.'
            : 'Similar parts repeat around a center. A radially symmetric shape matches itself after certain rotations; a line through its center does not necessarily divide it into matching halves.' }}
        </p>
        <p>
          <strong>{{ tamil ? 'உதாரணங்கள்:' : 'Examples:' }}</strong>
          {{ tamil
            ? 'பல நட்சத்திர மீன்கள், ஜெல்லி மீன்கள், பூக்கள். அவற்றின் சமச்சீர் அச்சுகளும் சுழற்சி முறையும் இனத்துக்கு ஏற்ப மாறலாம்.'
            : 'Many starfish, jellyfish and flowers. Their symmetry axes and rotational patterns vary by species.' }}
        </p>
      </article>
    </div>

    <aside class="symmetry-note">
      <h3>{{ tamil ? '“அரை” மற்றும் “ஆரம்” ஒன்றல்ல' : '“Half” and “radius” are different' }}</h3>
      <p>
        {{ tamil
          ? 'அரை (half) என்பது இரண்டு சம பாகங்களில் ஒன்று. வட்டத்தின் ஆரம் (radius) என்பது மையத்திலிருந்து சுற்றளவிலுள்ள ஒரு புள்ளிவரை உள்ள தூரம்; விட்டம் இரண்டு ஆரங்கள்.'
          : 'A half is one of two equal parts. A circle’s radius is the distance from its center to its circumference; its diameter is two radii.' }}
      </p>
      <p class="symmetry-correction">
        {{ tamil
          ? 'பூமியின் Equator வடக்கு மற்றும் தெற்கு அரைக்கோளங்களைப் பிரிக்கிறது. Prime Meridian மற்றும் எதிர்புற 180° meridian கிழக்கு–மேற்கு அரைக்கோளங்களை வரையறுக்க உதவுகின்றன.'
          : 'Earth’s equator divides the Northern and Southern Hemispheres. The Prime Meridian and the opposite 180° meridian are used to define the Eastern and Western Hemispheres.' }}
      </p>
      <div class="symmetry-sources">
        <h4 id="symmetry-sources-heading">
          {{ tamil ? 'ஆதாரங்கள்' : 'Sources' }}
        </h4>
        <ul aria-labelledby="symmetry-sources-heading">
          <li>
            <a
              href="https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth/"
              target="_blank"
              rel="noopener noreferrer"
            >NASA: Equator</a>
          </li>
          <li>
            <a
              href="https://science.nasa.gov/eclips/resources/glossary/"
              target="_blank"
              rel="noopener noreferrer"
            >NASA: Prime Meridian</a>
          </li>
          <li>
            <a
              href="https://openstax.org/books/intermediate-algebra-2e/pages/11-1-distance-and-midpoint-formulas-circles"
              target="_blank"
              rel="noopener noreferrer"
            >OpenStax: Radius</a>
          </li>
          <li>
            <a
              href="https://www.mathsisfun.com/geometry/symmetry-reflection.html"
              target="_blank"
              rel="noopener noreferrer"
            >Reflection symmetry</a>
          </li>
        </ul>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.home-symmetry-section {
  grid-column: 1 / -1;
  margin-top: 0;
  padding: clamp(18px, 3vw, 28px);
}

.symmetry-heading {
  max-width: 760px;
  margin-bottom: 20px;
}

.symmetry-heading h2 {
  margin: 6px 0 8px;
  font-size: clamp(1.35rem, 2.4vw, 1.8rem);
  line-height: 1.2;
}

.symmetry-heading p,
.symmetry-panel p,
.symmetry-note p {
  line-height: 1.6;
}

.symmetry-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.symmetry-panel,
.symmetry-note {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface-muted);
}

.symmetry-panel-number {
  color: var(--brand);
  font-size: .75rem;
  font-weight: 700;
  letter-spacing: .08em;
}

.symmetry-panel h3,
.symmetry-note h3 {
  margin: 7px 0 10px;
  font-size: 1.05rem;
}

.symmetry-panel p,
.symmetry-note p {
  margin: 0;
}

.symmetry-panel p + p,
.symmetry-note p + p {
  margin-top: 10px;
}

.symmetry-note {
  margin-top: 14px;
}

.symmetry-sources {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.symmetry-sources h4 {
  margin: 0;
  font-size: .9rem;
}

.symmetry-sources ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.symmetry-sources a {
  color: var(--brand);
  text-underline-offset: 3px;
}

@media (max-width: 600px) {
  .symmetry-panels {
    grid-template-columns: minmax(0, 1fr);
  }

  .symmetry-panel,
  .symmetry-note {
    padding: 15px;
  }
}
</style>
