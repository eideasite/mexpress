<script setup>
import { FileText, Mail, Phone } from 'lucide-vue-next'

const effectiveDate = '2026-11-19'

const contents = [
  { id: 'overview', label: '1. Overview and scope' },
  { id: 'information', label: '2. Information this app handles' },
  { id: 'use', label: '3. How information is used' },
  { id: 'sharing', label: '4. When information leaves this device' },
  { id: 'storage', label: '5. Browser storage, retention, and deletion' },
  { id: 'security', label: '6. Security and service limits' },
  { id: 'rights', label: '7. Your choices and privacy rights' },
  { id: 'children', label: '8. Children’s privacy' },
  { id: 'changes', label: '9. Policy updates' },
  { id: 'project-note', label: '10. About this project' },
  { id: 'contact', label: '11. Contact' },
]
</script>

<template>
  <article class="page-wrap narrow-page privacy-policy-page">
    <header class="page-heading privacy-policy-heading">
      <span class="eyebrow">Privacy and data</span>
      <h1>
        Privacy Policy
        <FileText
          :size="25"
          aria-hidden="true"
        />
      </h1>
      <p class="privacy-policy-intro">
        This policy explains what Jeyamohan Articles stores in your browser, what happens when you choose an external service, and the controls available to you.
      </p>
    </header>

    <section
      class="surface-card privacy-policy-contact"
      aria-label="Policy owner and contact details"
    >
      <p><strong>Effective date:</strong> <time :datetime="effectiveDate">November 19, 2026</time></p>
      <p><strong>Maintained by:</strong> Jeyamohan Manoharan</p>
      <p>
        <strong>Email:</strong>
        <a href="mailto:jeyamohan98@gmail.com"><Mail
          :size="15"
          aria-hidden="true"
        /> jeyamohan98@gmail.com</a>
      </p>
      <p>
        <strong>Phone:</strong>
        <a href="tel:+94754977449"><Phone
          :size="15"
          aria-hidden="true"
        /> +94 754 977 449</a>
      </p>
    </section>

    <nav
      class="privacy-policy-toc"
      aria-label="Privacy Policy contents"
    >
      <h2>In this policy</h2>
      <ol>
        <li
          v-for="item in contents"
          :key="item.id"
        >
          <a :href="`#${item.id}`">{{ item.label }}</a>
        </li>
      </ol>
    </nav>

    <div class="privacy-policy-content">
      <section id="overview">
        <h2>1. Overview and scope</h2>
        <p>Jeyamohan Articles is a browser-based writing workspace maintained by Jeyamohan Manoharan (“we,” “us,” or “our”). The app has no user account system, application backend, cloud synchronization, advertising, or analytics service configured. Articles, drafts, posts, and images you create are saved in the browser on your device; the app does not send that writing to an app backend.</p>
        <blockquote class="privacy-policy-quote">
          What you write is stored in your device’s browser, not sent to this app’s backend. A search query or AI prompt is sent to an external service only when you choose to submit it.
        </blockquote>
        <p>This policy covers the app itself. Google Search, Gemini, ChatGPT, Meta AI, the optional browser helper, and the website hosting provider are separate services with their own practices and policies.</p>
      </section>

      <section id="information">
        <h2>2. Information this app handles</h2>
        <h3>Writing and preferences saved locally</h3>
        <p>The app saves information you enter or create in browser storage. This can include articles and drafts, posts and attached images, bookmarks, highlights, profile details, accessibility and display preferences, search and prompt drafts, the selected Google search mode, and local article status. Posts and images use IndexedDB with a browser storage recovery copy; other workspace data and preferences use local browser storage.</p>
        <h3>Information processed while you use the app</h3>
        <p>The app may read browser-provided settings such as language, online status, and approximate connection quality when available. These are used to display the interface and connection status. The app does not request your precise location, contacts, microphone, or camera for its writing features.</p>
        <h3>Hosting and ordinary web requests</h3>
        <p>When you load the website, your browser makes network requests to the website host to retrieve the app. The host and network providers may process ordinary request and security data, such as an IP address, browser details, and request time, under their own terms. We do not operate an app server or receive writing content through a backend.</p>
      </section>

      <section id="use">
        <h2>3. How information is used</h2>
        <p>Information saved by the app is used in your browser to show and manage your workspace, restore unfinished drafts, create local backups, and remember your preferences. The app does not use your article or post content for advertising, profiling, or analytics.</p>
        <p>Browser storage estimates may be displayed when supported by your browser. They are estimates controlled by the browser, not a promise of reserved storage space.</p>
      </section>

      <section id="sharing">
        <h2>4. When information leaves this device</h2>
        <p>The app does not upload your articles, posts, images, or backups to us. Information leaves your device when you choose a feature that contacts another service or share it yourself:</p>
        <p>For example, the optional browser helper reads a JSON handoff parameter from the AI tab’s URL. It clears the parameter before filling the provider’s prompt box:</p>
        <pre class="privacy-policy-code"><code>{
  "version": 1,
  "prompt": "YOUR_PROMPT",
  "image": { "type": "image/jpeg", "dataUrl": "..." }
}</code></pre>
        <ul>
          <li><strong>Global Google Search:</strong> when you submit a query, it is sent to Google. The dropdown lets you choose regular Google Search or Google Search AI Mode.</li>
          <li><strong>Gemini, ChatGPT, and Meta AI:</strong> when you submit a prompt using Multi-AI Search, the selected provider tabs receive that prompt. If you attach an image, it is resized and included in the handoff. The app also copies the prompt text to your clipboard when browser permissions allow; clipboard copying does not include the image.</li>
          <li><strong>Optional browser helper:</strong> if installed, the helper reads the JSON handoff passed to the provider page, fills the provider’s composer, attaches the image when the page supports it, and submits. Without the helper, the prompt is copied and the image remains in the app for you to attach manually. Review the extension’s permissions and remove it from your browser if you do not want this behavior.</li>
          <li><strong>Connection speed test:</strong> when you start the test, the app requests small and approximately 2 MB download samples from Cloudflare to measure latency and download speed. The request does not include article or post text.</li>
          <li>
            <strong>Backups and exports:</strong> backup files are generated and downloaded in your browser. Depending on what you export, they may contain:
            <ul>
              <li>Articles, drafts, and local writing preferences.</li>
              <li>Posts and their attached images.</li>
              <li>Bookmarks, highlights, and related saved workspace data.</li>
            </ul>
            You choose whether to upload or share downloaded files elsewhere.
          </li>
          <li><strong>Contact links:</strong> choosing an email, phone, or social link opens the corresponding app or website and shares any information you include there.</li>
        </ul>
        <p>
          After information reaches a third-party service, that service handles it under its own terms. Review the current policies for <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >Google</a>, <a
            href="https://openai.com/policies/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
          >OpenAI</a>, and <a
            href="https://www.facebook.com/privacy/policy/"
            target="_blank"
            rel="noopener noreferrer"
          >Meta</a> before submitting information. Provider settings and practices can change.
        </p>
      </section>

      <section id="storage">
        <h2>5. Browser storage, retention, and deletion</h2>
        <p>Your local content remains in browser storage until you remove it, clear the website’s data, reset or uninstall the browser, or the browser otherwise removes stored data. The app requests persistent storage where the browser supports it, but approval is not guaranteed. There is no automatic cloud backup or cross-device recovery.</p>
        <p>You can delete content using the app’s available editing and removal controls, or clear this site’s stored data in your browser settings. Downloaded backup files are separate copies; deleting an in-app item does not delete copies you have downloaded or shared. Keep backups somewhere secure and delete them when you no longer need them.</p>
        <p>Search and prompt drafts may be kept locally so you can resume work. Clear the relevant draft in the app or clear the site’s browser data to remove the local copy.</p>
      </section>

      <section id="security">
        <h2>6. Security and service limits</h2>
        <p>Local-first storage means content is held by your browser on your device; it is not an encrypted vault or a substitute for a secure device account. Anyone who can access your browser profile or device may be able to access its stored content. Use a device lock, keep browser software current, and avoid entering sensitive information into external AI services unless you have reviewed their terms and privacy controls.</p>
        <p>Browser resets, device failure, storage limits, or browser bugs can result in data loss. Export backups regularly and store them somewhere separate from this device.</p>
      </section>

      <section id="rights">
        <h2>7. Your choices and privacy rights</h2>
        <p>You choose whether to use external search, AI, speed-test, and contact features. You can avoid sending a query or prompt, use the app without the optional helper, remove local content, or clear browser storage. You can also manage clipboard, pop-up, and extension permissions through your browser.</p>
        <p>Privacy rights depend on where you live and the applicable law. Because the app does not maintain a server-side account or writing database, we generally cannot retrieve or erase content stored only in your browser. For a policy question or a request related to information we may handle as the site maintainer, contact us below.</p>
      </section>

      <section id="children">
        <h2>8. Children’s privacy</h2>
        <p>This writing workspace is not designed to collect personal information from children through an account or online submission form. If you believe a child has sent personal information to us by email, contact us so we can review the request.</p>
      </section>

      <section id="changes">
        <h2>9. Policy updates</h2>
        <p>We may revise this policy when the app or its data practices change. The effective date at the top identifies the latest revision. Material changes will be reflected on this page.</p>
      </section>

      <section id="project-note">
        <h2>10. About this project</h2>
        <p><strong>Creator’s original writing (reproduced unchanged):</strong></p>
        <blockquote class="privacy-policy-quote privacy-policy-original-quote">
          Frameworks are huge network over the earth that have sattilite connection starlink connection ultra waves connection maxmium power unit by multiple dimenssion of power reality in the modern world update by one person pen and name by its power ; he have the true dedciation and work way canvas to executive any victicms thourgh all over the world by internationl connection of multiple layer through every device feed in moden world
        </blockquote>
        <p>This is the creator’s personal writing. The app’s actual data and network practices are described in the sections above.</p>
      </section>

      <section id="contact">
        <h2>11. Contact</h2>
        <p>For questions about this policy or the app’s privacy practices, contact Jeyamohan Manoharan at <a href="mailto:jeyamohan98@gmail.com">jeyamohan98@gmail.com</a> or call <a href="tel:+94754977449">+94 754 977 449</a>.</p>
      </section>
    </div>
  </article>
</template>
