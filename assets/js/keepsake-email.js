/* ==========================================================
   Keepsake email sign-up

   Renders the optional "keep me posted" form wherever a
   [data-email-signup] placeholder exists, and posts it to the
   Keepsake list in Brevo (double opt-in is handled by Brevo).

   Privacy and performance:
   - No Brevo script or frame is loaded. The only request is the
     sign-up itself, made when the visitor presses the button.
   - Only the email address is sent. It is never sent to analytics.

   SWITCHED OFF BY DEFAULT. Turn ENABLED on only when all of these
   are done: the privacy policy mentions the email list, Brevo's
   confirmation email and thank-you page are designed, and a real
   test sign-up has been checked from the live site.
   ========================================================== */

(function keepsakeEmailSignup() {
  "use strict";

  const ENABLED = false;

  // Public form endpoint from Brevo (Forms > Keepsake list > share). Not a secret.
  const ENDPOINT =
    "https://1d228e13.sibforms.com/v2/serve/MUIFABMCiPK4HbwxSj8in7-do2XYM1NIqTZm4myVaSj6l2x246C1Vp1BkaAhnwrQuPUNh6jxd6-uLD9LVPn_nkr_i1RxhnM6I4Nfrn6aSOCjQ4StwlNC1YY3H9Ic9Io68zx5vO-mqfqVw9oowK6N54MGPJV7gdvNnVvN24nQdEvJZceds8o33sHL4AWXE2VFfmP8DceR8lhHMM7CKQ==";

  const PRIVACY_URL = "https://chaoticgoodcreations.co/privacy/keepsake-privacy";

  const COPY = {
    title: "A short note, now and then.",
    lead: "When there’s a new article, we’ll send a short version. No promotions, no streaks, no noise.",
    label: "Your email",
    button: "Keep me posted",
    sending: "Sending…",
    success: "Thank you. Please check your email to confirm.",
    invalid: "Please enter a valid email address.",
    unchecked: "Please check the box to confirm you\u2019d like to receive these.",
    error: "That didn’t work. Please try again, or write to hello@chaoticgoodcreations.co.",
    notice:
      "By subscribing you agree to receive occasional notes from Keepsake. Unsubscribe any time. " +
      "We’ll never share your address. Your keepsakes are never part of this list. They stay in your own iCloud."
  };

  if (!ENABLED) {
    return;
  }

  const placeholders = document.querySelectorAll("[data-email-signup]");

  if (!placeholders.length) {
    return;
  }

  let instance = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text) {
      node.textContent = text;
    }

    return node;
  }

  function report(placement, result) {
    // Picked up by the telemetry script. Only the placement and the outcome are sent.
    document.dispatchEvent(new CustomEvent("keepsake:email", {
      detail: { placement, result }
    }));
  }

  function build(placeholder) {
    instance += 1;

    const placement = placeholder.dataset.placement || "unknown";
    const inputId = `ks-signup-email-${instance}`;

    const card = element("div", "ks-signup");
    card.append(element("h2", "ks-signup-title", COPY.title));
    card.append(element("p", "ks-signup-lead", COPY.lead));

    const form = element("form", "ks-signup-form");
    form.noValidate = true;

    const label = element("label", "ks-visually-hidden", COPY.label);
    label.htmlFor = inputId;

    const input = element("input", "ks-signup-input");
    input.type = "email";
    input.id = inputId;
    input.name = "EMAIL";
    input.autocomplete = "email";
    input.placeholder = COPY.label;
    input.required = true;

    // Spam trap: real visitors never see or fill this in
    const trap = element("input", "ks-signup-trap");
    trap.type = "text";
    trap.name = "email_address_check";
    trap.tabIndex = -1;
    trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");

    const fieldRow = element("div", "ks-signup-field-row");
    fieldRow.append(label, input, trap);

    // Explicit, unticked consent checkbox (GDPR: consent must be an
    // active, affirmative choice, never assumed or pre-ticked)
    const consentId = `ks-signup-consent-${instance}`;
    const consentRow = element("label", "ks-signup-consent");
    consentRow.htmlFor = consentId;

    const consent = element("input", "");
    consent.type = "checkbox";
    consent.id = consentId;
    consent.name = "OPT_IN";
    consent.value = "1";
    consent.required = true;

    const consentText = element("span", "", COPY.consent);
    consentRow.append(consent, consentText);

    const button = element("button", "ks-signup-button", COPY.button);
    button.type = "submit";

    form.append(fieldRow, consentRow, button);

    const status = element("p", "ks-signup-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const notice = element("p", "ks-signup-note", `${COPY.notice} `);
    const privacy = element("a", "", "Privacy policy");
    privacy.href = PRIVACY_URL;
    notice.append(privacy);

    card.append(form, status, notice);
    placeholder.replaceChildren(card);

    const section = placeholder.closest(".ks-signup-section");

    if (section) {
      section.hidden = false;
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      status.className = "ks-signup-status";
      status.textContent = "";

      const email = input.value.trim();

      if (!input.checkValidity() || !email) {
        status.classList.add("is-error");
        status.textContent = COPY.invalid;
        input.focus();
        return;
      }

      if (!consent.checked) {
        status.classList.add("is-error");
        status.textContent = COPY.unchecked;
        consent.focus();
        return;
      }

      // A filled-in trap means a bot: pretend it worked and send nothing
      if (trap.value) {
        status.classList.add("is-success");
        status.textContent = COPY.success;
        return;
      }

      button.disabled = true;
      button.textContent = COPY.sending;

      try {
        const data = new FormData();
        data.set("EMAIL", email);
        data.set("OPT_IN", "1"); // form-level guard above already requires this to be checked
        data.set("email_address_check", "");
        data.set("locale", "en");

        const response = await fetch(ENDPOINT, { method: "POST", body: data });
        let succeeded = response.ok;

        try {
          const body = await response.json();

          if (body && body.success === false) {
            succeeded = false;
          }
        } catch {
          // A non-JSON body is fine when the request itself succeeded
        }

        if (!succeeded) {
          throw new Error("Sign-up was not accepted");
        }

        form.hidden = true;
        status.classList.add("is-success");
        status.textContent = COPY.success;
        report(placement, "success");
      } catch (error) {
        button.disabled = false;
        button.textContent = COPY.button;
        status.classList.add("is-error");
        status.textContent = COPY.error;
        report(placement, "error");
      }
    });
  }

  placeholders.forEach(build);
})();
