// import  *  as dbQuery  from "../database/dbQuery.js";

// async function restartCronJobs() {
//   let jobs = await fetch(
//     `http://localhost:${process.env.PORT}/api/getScheduledNotifications`,
//     {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   )
//     .then((res) => res.json())
//     .catch((err) => console.log(err));

//   console.log("restartCronJobs ~ jobs:", jobs);
//   if(!jobs || jobs.length === 0) {
//     console.log("No jobs to schedule.");
//     return;
//   }
//   jobs.forEach(async (element) => {
//     await scheduleJobs(element.id, element.data);
//     dbQuery.deleteNotificationDataById(element.id);
//   });
// }

// async function scheduleJobs(id, data) {
//   let jobs = await fetch(
//     `http://localhost:${process.env.PORT}/api/scheduleNotification`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ ...data, id: id }),
//     }
//   )
//     .then((res) => res.json())
//     .catch((err) => console.log(err));

//   console.log("scheduleJobs ~ jobs:", jobs);
// }

// export default restartCronJobs;
