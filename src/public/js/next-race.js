const socket = io({
  autoConnect: false,
});

const nextRace = {};
const role = "public";
socket.auth = { role };
socket.connect();

socket.on("connect_error", (err) => {
  console.log(err);
  const warning = document.getElementById("warnings");
  warning.innerHTML = "Connection error, no realtime data.";
  warning.classList.remove("hidden");
}); // --- FULL SCREEN ---
const screen = document.getElementById("panel");
const fullScreenButton = document.getElementById("full-screen-button");
fullScreenButton.onclick = () => {
  screen.style = "border-radius:unset";

  const raceName = document.getElementById("scrolling-text");

  //if text wont fit to screen, scroll
  if (raceName.offsetWidth > raceName.parentElement.offsetWidth) {
    const scrollingTextInner = document.getElementsByClassName(
      "scrolling-text-inner",
    );
    scrollingTextInner.style = "--marquee-speed: 10s; --direction: scroll-left";
    const copy = raceName.cloneNode(true);
    copy.id = "race-name-copy";
    raceName.parentNode.insertBefore(copy, raceName);

    const observer = new MutationObserver(() => {
      const text = raceName.innerHTML;
      copy.innerHTML = text;
      if (raceName.offsetWidth > raceName.parentElement.offsetWidth) {
        scrollingTextInner.style =
          "--marquee-speed: 10s; --direction: scroll-left";
      }
    });
    observer.observe(raceName, {
      characterData: false,
      childList: true,
      attributes: false,
    });
  } else {
    const observer = new MutationObserver(() => {
      if (raceName.offsetWidth > raceName.parentElement.offsetWidth) {
        const scrollingTextInner = document.getElementsByClassName(
          "scrolling-text-inner",
        );
        scrollingTextInner.style =
          "--marquee-speed: 10s; --direction: scroll-left";
        const copy = raceName.cloneNode(true);
        copy.id = "race-name-copy";
        raceName.parentNode.insertBefore(copy, raceName);
        const text = raceName.innerHTML;
        copy.innerHTML = text;
      }
    });
    observer.observe(raceName, {
      characterData: false,
      childList: true,
      attributes: false,
    });
  }

  screen.requestFullscreen();
  fullScreenButton.classList.add("hidden");
};
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement !== screen) {
    screen.style = "";
    try {
      const copy = document.getElementById("race-name-copy");
      copy.remove();
    } catch (err) {}

    const scrollingTextInner = document.getElementsByClassName(
      "scrolling-text-inner",
    );
    scrollingTextInner.style = "";
    fullScreenButton.classList.remove("hidden");
  }
});

// --- Connection established ---
socket.on("auth:ok", (role) => {
  if (role === "public") {
    // Request initial data
    socket.emit("state:request");

    // Hide warnings if exists
    try {
      const warning = document.getElementById("warnings");
      warning.innerHTML = "";
      warning.classList.add("hidden");
    } catch (err) {}
  }
});

// --- UPDATE VIEW HELPER ---
const updateView = (sessions) => {
  //update state data if found one, else clear
  if (sessions.find((session) => session.status === "next")) {
    Object.assign(
      nextRace,
      sessions.find((session) => session.status === "next"),
    );
  } else {
    for (let key in nextRace) {
      delete nextRace[key];
    }
  }

  //update view
  try {
    const raceName = document.getElementById("race-name");
    const warning = document.getElementById("warnings");
    if (nextRace.name) {
      //hide warning
      raceName.innerHTML = nextRace.name;
      warning.innerHTML = "";
      warning.classList.add("hidden");

      const driversTable = document.getElementById("cars-table");
      //empty drivers table
      driversTable.innerHTML = "<thead><th>Car nr.</th><th>Driver</th></thead>";
      //update drivers table
      nextRace.drivers.forEach(({ name, carNum }) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${carNum}</td><td>${name}</td>`;
        driversTable.appendChild(row);
      });
    } else {
      //show no next race warning
      warning.innerHTML = "No next race coming";
      warning.classList.remove("hidden");
      raceName.innerHTML = "";
      //empty drivers table
      const driversTable = document.getElementById("cars-table");
      driversTable.innerHTML = "<thead><th>Car nr.</th><th>Driver</th></thead>";
    }
  } catch (err) {}
};

socket.on("session:update", (sessions) => {
  updateView(sessions);
});
socket.on("state:update", (state) => {
  updateView(state.sessions);
});
