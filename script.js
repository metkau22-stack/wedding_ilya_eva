const enableRevealAnimations = true;
const revealInitDelayMs = 120;
let revealInitialized = false;

if (enableRevealAnimations) {
  document.documentElement.classList.add("reveal-ready");
}

const weddingDate = new Date("2026-08-05T17:00:00+03:00");
const targetEmail = "smirnova.island@yandex.ru";
const formEndpoint = `https://formsubmit.co/ajax/${targetEmail}`;
const formPostEndpoint = `https://formsubmit.co/${targetEmail}`;
const formRequestTimeoutMs = 9000;
const formRequestRetries = 0;
const formSuccessParam = "rsvp_sent";
const formSuccessMessage = "Анкета отправлена. Спасибо, мы всё получили.";

const countdownRoot = document.querySelector("[data-countdown]");
const countdownUnits = {
  days: countdownRoot ? countdownRoot.querySelector('[data-unit="days"]') : null,
  hours: countdownRoot ? countdownRoot.querySelector('[data-unit="hours"]') : null,
  minutes: countdownRoot ? countdownRoot.querySelector('[data-unit="minutes"]') : null,
  seconds: countdownRoot ? countdownRoot.querySelector('[data-unit="seconds"]') : null,
};

function formatValue(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdownRoot) {
    return;
  }

  if (!countdownUnits.days || !countdownUnits.hours || !countdownUnits.minutes || !countdownUnits.seconds) {
    return;
  }

  const diff = weddingDate.getTime() - Date.now();

  if (diff <= 0) {
    countdownRoot.innerHTML =
      '<p class="hero__text">Этот день уже наступил. Ждем вас на празднике!</p>';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownUnits.days.textContent = formatValue(days);
  countdownUnits.hours.textContent = formatValue(hours);
  countdownUnits.minutes.textContent = formatValue(minutes);
  countdownUnits.seconds.textContent = formatValue(seconds);
}

function buildCalendarFile() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invite//RU",
    "BEGIN:VEVENT",
    "UID:wedding-ilya-eva-20260805@example.com",
    "DTSTAMP:20260503T000000Z",
    "DTSTART:20260805T140000Z",
    "DTEND:20260805T210000Z",
    "SUMMARY:Свадьба Ильи и Евы",
    "DESCRIPTION:Будем счастливы разделить этот день вместе с вами.",
    "LOCATION:ЗАГС, затем бар «Элла», веранда",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
}

function downloadCalendar() {
  const file = buildCalendarFile();
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);

  link.href = url;
  link.download = "ilya-eva-wedding.ics";
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function initCalendarButtons() {
  document.querySelectorAll("[data-calendar-button]").forEach((button) => {
    button.addEventListener("click", downloadCalendar);
  });
}

function initBackgroundVideo() {
  const video = document.querySelector("[data-background-video]");

  if (!video) {
    return;
  }

  const container = video.closest(".video-background");

  const safePlay = () => {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const restartVideo = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = 0;
    }

    safePlay();
  };

  const markPlaying = () => {
    if (container) {
      container.classList.add("is-playing");
    }
  };

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  video.addEventListener("ended", restartVideo);
  video.addEventListener("loadeddata", markPlaying, { once: true });
  video.addEventListener("playing", markPlaying);
  video.addEventListener("canplay", safePlay);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      safePlay();
    }
  });

  safePlay();
}

function initReveal() {
  if (revealInitialized) {
    return;
  }

  revealInitialized = true;

  const autoRevealGroups = [
    [".section-head > *", 50],
    [".showcase-card__main > *", 70],
    [".invitation-card__text > *", 70],
    [".calendar-card > *", 60],
    [".venue-card > *", 70],
    [".timeline__text > *", 50],
    [".rsvp-form > *:not(.rsvp-form__actions)", 50],
    [".rsvp-form__actions > *", 60],
    [".site-footer > *", 70],
  ];

  autoRevealGroups.forEach(([selector, step]) => {
    document.querySelectorAll(selector).forEach((item, index) => {
      if (item.matches(".reveal, [data-reveal]")) {
        return;
      }

      item.setAttribute("data-reveal", "");
      item.style.setProperty("--reveal-delay", `${index * step}ms`);
    });
  });

  const items = Array.from(document.querySelectorAll(".reveal, [data-reveal]"));

  function showItem(item) {
    item.classList.add("is-visible");
  }

  function isAlreadyInView(item) {
    const rect = item.getBoundingClientRect();

    return rect.top < window.innerHeight * 0.88;
  }

  const initialItems = items.filter(isAlreadyInView);
  const initialItemsSet = new Set(initialItems);
  const showInitialItems = () => {
    initialItems.forEach(showItem);
  };

  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(showInitialItems);
    });
  } else {
    showInitialItems();
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => {
      if (!initialItemsSet.has(item)) {
        showItem(item);
      }
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showItem(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -60px 0px",
    },
  );

  items.forEach((item) => {
    if (!initialItemsSet.has(item)) {
      observer.observe(item);
    }
  });
}

function scheduleRevealAnimations() {
  if (!enableRevealAnimations) {
    return;
  }

  window.setTimeout(initReveal, revealInitDelayMs);
}

function initMobileMenu() {
  const details = document.querySelector(".mobile-menu");

  if (!details) {
    return;
  }

  details.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      details.removeAttribute("open");
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendRsvpPayload(payload) {
  let lastError = null;

  for (let attempt = 0; attempt <= formRequestRetries; attempt += 1) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), formRequestTimeoutMs)
      : null;

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
        signal: controller ? controller.signal : undefined,
      });

      let responseJson = null;

      try {
        responseJson = await response.json();
      } catch (parseError) {
        responseJson = null;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (
        responseJson &&
        Object.prototype.hasOwnProperty.call(responseJson, "success")
      ) {
        const isSuccess = responseJson.success === true || responseJson.success === "true";

        if (!isSuccess) {
          throw new Error(responseJson.message || "Submission was rejected");
        }
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt === formRequestRetries) {
        break;
      }

      await wait(700 * (attempt + 1));
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  throw lastError || new Error("Submission failed");
}

function getFormReturnUrl() {
  const url = new URL(window.location.href);

  url.searchParams.set(formSuccessParam, "1");
  url.hash = "rsvp";

  return url.toString();
}

function setFormHiddenValue(form, name, value) {
  let input = form.querySelector(`input[name="${name}"]`);

  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.prepend(input);
  }

  input.value = value;
}

function syncNativeFormSubmitFields(form, guestName = "") {
  form.action = formPostEndpoint;
  form.method = "POST";

  setFormHiddenValue(form, "_subject", `Анкета гостя: ${guestName || "без имени"}`);
  setFormHiddenValue(form, "_template", "table");
  setFormHiddenValue(form, "_next", getFormReturnUrl());
  setFormHiddenValue(form, "_url", window.location.href);
}

function submitFormNatively(form) {
  if (window.HTMLFormElement && window.HTMLFormElement.prototype.submit) {
    window.HTMLFormElement.prototype.submit.call(form);
    return;
  }

  form.submit();
}

function showReturnedFormStatus(status) {
  const url = new URL(window.location.href);

  if (url.searchParams.get(formSuccessParam) !== "1") {
    return;
  }

  if (status) {
    status.textContent = formSuccessMessage;
  }

  url.searchParams.delete(formSuccessParam);

  if (window.history && typeof window.history.replaceState === "function") {
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

function initRsvpForm() {
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-form-status]");
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const initialButtonLabel = submitButton ? submitButton.textContent : "";

  if (!form) {
    return;
  }

  let isSubmitting = false;

  syncNativeFormSubmitFields(form);
  showReturnedFormStatus(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;

    if (status) {
      status.textContent = "Отправляем анкету...";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Отправляем...";
    }

    const formData = new FormData(form);
    const guestName = (formData.get("guest_name") || "").toString().trim();
    const attendance = (formData.get("attendance") || "").toString().trim();
    const plusOne = (formData.get("plus_one") || "").toString().trim();
    const drinks = formData.getAll("drinks");
    const withChild = (formData.get("with_child") || "").toString().trim();
    const honey = (formData.get("_honey") || "").toString().trim();

    syncNativeFormSubmitFields(form, guestName);

    const payload = new FormData();
    payload.append("Имя гостя", guestName || "Не указано");
    payload.append("Присутствие", attendance || "Не указано");
    payload.append("Спутник или спутница", plusOne || "Не указано");
    payload.append("Напитки", drinks.length ? drinks.join(", ") : "Не указано");
    payload.append("Будет ли с вами ребёнок", withChild || "Не указано");
    payload.append("_subject", `Анкета гостя: ${guestName || "без имени"}`);
    payload.append("_template", "table");
    payload.append("_captcha", "false");
    payload.append("_next", getFormReturnUrl());
    payload.append("_url", window.location.href);
    payload.append("_honey", honey);

    let nativeFallbackStarted = false;

    try {
      await sendRsvpPayload(payload);

      form.reset();
      syncNativeFormSubmitFields(form);

      if (status) {
        status.textContent = formSuccessMessage;
      }
    } catch (error) {
      if (status) {
        status.textContent = "Автоотправка не прошла. Откроется резервная отправка анкеты...";
      }

      nativeFallbackStarted = true;
      window.setTimeout(() => submitFormNatively(form), 120);
    } finally {
      if (!nativeFallbackStarted) {
        isSubmitting = false;
      }

      if (submitButton && !nativeFallbackStarted) {
        submitButton.disabled = false;
        submitButton.textContent = initialButtonLabel;
      }
    }
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);
initBackgroundVideo();
initCalendarButtons();
scheduleRevealAnimations();
initMobileMenu();
initRsvpForm();
