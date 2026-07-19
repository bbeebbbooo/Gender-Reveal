(() => {
  "use strict";

  const TIME_KEY = "babyRevealMusicTime";
  const ENABLED_KEY = "babyRevealMusicEnabled";

  const audio = document.getElementById("backgroundMusic");
  const musicToggle = document.getElementById("musicToggle");
  const openInvitation = document.getElementById("openInvitation");
  const tapToOpen = document.getElementById("tapToOpen");
  const autoplayMessage = document.getElementById("autoplayMessage");

  let leaving = false;

  function prepareAnimatedTitle() {
    const title = document.getElementById("invitationTitle");
    if (!title) return 0;

    const text = title.textContent || "";
    title.textContent = "";

    Array.from(text).forEach((character, index) => {
      const letter = document.createElement("span");
      letter.className = character === " " ? "title-letter title-space" : "title-letter";
      letter.style.setProperty("--letter-index", String(index));
      letter.setAttribute("aria-hidden", "true");
      letter.textContent = character === " " ? "\u00A0" : character;
      title.appendChild(letter);
    });

    return Math.max(0, text.length - 1) * 35 + 400;
  }

  function runInvitationEntranceSequence() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const tagline = document.getElementById("invitationTagline");
    const date = document.getElementById("invitationDate");
    const tap = document.getElementById("tapToOpen");
    const sequenceItems = [tagline, date, tap].filter(Boolean);

    if (reducedMotion) {
      sequenceItems.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const titleDuration = prepareAnimatedTitle();
    const startDelay = titleDuration + 90;
    const stepDelay = 520;

    sequenceItems.forEach((element, index) => {
      window.setTimeout(() => {
        element.classList.add("is-visible");
      }, startDelay + index * stepDelay);
    });
  }



  function runDetailsEntranceSequence() {
    const items = Array.from(
      document.querySelectorAll("[data-details-reveal]")
    );

    if (!items.length) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const initialDelay = 150;
    const stepDelay = 155;

    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add("is-visible");
      }, initialDelay + index * stepDelay);
    });
  }

  function setMusicUi(playing) {
    if (!musicToggle) return;

    musicToggle.classList.toggle("is-playing", playing);
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute(
      "aria-label",
      playing ? "Pause background music" : "Play background music"
    );
  }

  function saveAudioPosition() {
    if (!audio || !Number.isFinite(audio.currentTime)) return;
    sessionStorage.setItem(TIME_KEY, String(audio.currentTime));
  }

  function restoreAudioPosition() {
    if (!audio) return;

    const stored = Number(sessionStorage.getItem(TIME_KEY));
    if (!Number.isFinite(stored) || stored <= 0) return;

    const applyStoredTime = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = stored % audio.duration;
      } else {
        audio.currentTime = stored;
      }
    };

    if (audio.readyState >= 1) {
      applyStoredTime();
    } else {
      audio.addEventListener("loadedmetadata", applyStoredTime, { once: true });
    }
  }

  async function playMusic() {
    if (!audio) return false;

    try {
      await audio.play();
      sessionStorage.setItem(ENABLED_KEY, "true");
      setMusicUi(true);

      if (autoplayMessage) {
        autoplayMessage.hidden = true;
      }

      return true;
    } catch {
      setMusicUi(false);

      if (autoplayMessage) {
        autoplayMessage.textContent = "Tap the invitation once to start the music";
      }

      return false;
    }
  }

  function pauseMusic() {
    if (!audio) return;

    audio.pause();
    saveAudioPosition();
    sessionStorage.setItem(ENABLED_KEY, "false");
    setMusicUi(false);
  }

  async function toggleMusic() {
    if (!audio) return;

    if (audio.paused) {
      await playMusic();
    } else {
      pauseMusic();
    }
  }

  async function goToSecondPage() {
    if (leaving) return;
    leaving = true;

    await playMusic();
    saveAudioPosition();
    document.body.classList.add("is-leaving");

    window.setTimeout(() => {
      saveAudioPosition();
      window.location.href = "page2.html";
    }, 650);
  }

  if (audio) {
    audio.volume = 0.58;
    restoreAudioPosition();

    audio.addEventListener("play", () => setMusicUi(true));
    audio.addEventListener("pause", () => setMusicUi(false));

    window.setInterval(saveAudioPosition, 900);
    window.addEventListener("pagehide", saveAudioPosition);
    window.addEventListener("beforeunload", saveAudioPosition);

    const shouldPlay = sessionStorage.getItem(ENABLED_KEY) !== "false";
    if (shouldPlay) {
      // Attempt autoplay as early as possible and retry at normal page lifecycle points.
      playMusic();
      document.addEventListener("DOMContentLoaded", playMusic, { once: true });
      window.addEventListener("load", playMusic, { once: true });
      window.addEventListener("pageshow", playMusic, { once: true });

      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          audio.paused &&
          sessionStorage.getItem(ENABLED_KEY) !== "false"
        ) {
          playMusic();
        }
      });
    }
  }

  musicToggle?.addEventListener("click", toggleMusic);
  openInvitation?.addEventListener("click", goToSecondPage);
  tapToOpen?.addEventListener("click", goToSecondPage);

  runInvitationEntranceSequence();
  runDetailsEntranceSequence();

  document.addEventListener(
    "pointerdown",
    () => {
      if (audio?.paused && sessionStorage.getItem(ENABLED_KEY) !== "false") {
        playMusic();
      }
    },
    { once: true }
  );
})();
