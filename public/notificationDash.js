// window.addEventListener("DOMContentLoaded", async () => {
//   const apiResponse = document.getElementById("apiResponse");
//   const games = ["basketline", "sliceMaster", "tenten", "2048", "snakeblitz"];
//   let users = [];

//   // Fetch users from the backend
//   async function fetchUsers() {
//     try {
//       const response = await fetch(`/api/users`);
//       if (!response.ok) {
//         throw new Error("Failed to fetch users");
//       }
//       users = await response.json();
//       console.log(users);
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   }

//   // Call fetchUsers when the page loads
//   await fetchUsers();

//   async function sendNotificationNow() {
//     const myHeaders = new Headers();
//     myHeaders.append("Content-Type", "application/json");

//     const raw = JSON.stringify({
//       telegramIds: telegramIds,
//       message: message,
//       gameType: selectedGame,
//       scheduleFrom: scheduleFrom,
//       scheduleTo: scheduleTo,
//       autoSchedule: autoSchedule,
//       scheduleTime: scheduleTimeValue,
//     });

//     const requestOptions = {
//       method: "POST",
//       headers: myHeaders,
//       body: raw,
//       redirect: "follow",
//     };

//     fetch("/api/scheduleNotification", requestOptions)
//       .then((response) => response.text())
//       .then((result) => console.log(result))
//       .catch((error) => console.error(error));
//   }

//   // games.forEach((game) => {
//   //   const gamePanel = document.getElementById(game);
//   //   const numberSelect = gamePanel.querySelector(".numberSelect");
//   //   const customNumber = gamePanel.querySelector(".customNumber");
//   //   const customText = gamePanel.querySelector(".customText");
//   //   const scheduleTimeFrom = gamePanel.querySelector(".scheduleTimeFrom");
//   //   const scheduleTimeTo = gamePanel.querySelector(".scheduleTimeTo");
//   //   const autoScheduleCheckbox = gamePanel.querySelector(
//   //     ".autoScheduleCheckbox"
//   //   );
//   //   const scheduleTime = gamePanel.querySelector(".scheduleTime");
//   //   const totalUsersSelected = gamePanel.querySelector(".totalUsersSelected");
//   //   const scheduleButton = gamePanel.querySelector(".scheduleButton");

//   //   numberSelect.addEventListener("change", (event) => {
//   //     if (event.target.value !== "Custom") {
//   //       const percentage = parseInt(event.target.value) / 100;
//   //       const count = Math.ceil(users.length * percentage);
//   //       totalUsersSelected.textContent = `Total Users Selected: ${count}`;
//   //     } else {
//   //       totalUsersSelected.textContent = "";
//   //     }
//   //   });

//   //   scheduleButton.addEventListener("click", async () => {
//   //     const selectedGame = game;
//   //     const message = customText.value;
//   //     let telegramIds = [];

//   //     if (numberSelect.value === "Custom") {
//   //       telegramIds = customNumber.value.split(",").map((id) => id.trim());
//   //     } else {
//   //       const percentage = parseInt(numberSelect.value) / 100;
//   //       const count = Math.ceil(users.length * percentage);
//   //       telegramIds = users.slice(0, count).map((user) => user.tgid);
//   //     }

//   //     const scheduleFrom = autoScheduleCheckbox.checked
//   //       ? null
//   //       : new Date(scheduleTimeFrom.value).toISOString();
//   //     const scheduleTo = autoScheduleCheckbox.checked
//   //       ? null
//   //       : new Date(scheduleTimeTo.value).toISOString();
//   //     const autoSchedule = autoScheduleCheckbox.checked;
//   //     const scheduleTimeValue = scheduleTime.value;

//   //     const myHeaders = new Headers();
//   //     myHeaders.append("Content-Type", "application/json");

//   //     const raw = JSON.stringify({
//   //       telegramIds: telegramIds,
//   //       message: message,
//   //       gameType: selectedGame,
//   //       scheduleFrom: scheduleFrom,
//   //       scheduleTo: scheduleTo,
//   //       autoSchedule: autoSchedule,
//   //       scheduleTime: scheduleTimeValue,
//   //     });

//   //     const requestOptions = {
//   //       method: "POST",
//   //       headers: myHeaders,
//   //       body: raw,
//   //       redirect: "follow",
//   //     };

//   //     fetch("/api/scheduleNotification", requestOptions)
//   //       .then((response) => response.text())
//   //       .then((result) => console.log(result))
//   //       .catch((error) => console.error(error));
//   //   });
//   // });
// });
