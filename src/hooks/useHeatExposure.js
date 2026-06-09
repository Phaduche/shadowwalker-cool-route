import { useState, useEffect } from "react";

import { tempShelters } from "../data/mockShelters";

// tis for calculating distances (now inside hook, no utils needed)
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function useHeatExposure(currentLat, currentLng) {
  const [seconds, setSeconds] = useState(0); // time passed(seconds)
  const [isOutdoor, setIsOutdoor] = useState(true); // user status (outdoor/indoor)

// tis for testing without waiting ;)
const triggerTestNotification = () => {
  if (Notification.permission === "granted") {
    new Notification("Test Alert", {
      body: "This is a demo notification for testing (1-hour alert simulation).",
    });
  } else {
    console.log("Notification permission not granted");
  }
};

//ask for notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // calculate distance whenever user moves
  useEffect(() => {
    let isInside = false;

    tempShelters.forEach((shelter) => {
      const distance = getDistanceInMeters(
        currentLat,
        currentLng,
        shelter.lat,
        shelter.lng
      );

      // for now ive set inside as being within 15 meters of a shelter. could chage later (demo logic)
      if (distance <= 15) {
        isInside = true;
      }
    });

    setIsOutdoor(!isInside);
  }, [currentLat, currentLng]);

  // timer logic here :)
  useEffect(() => {
    let timer;

    if (isOutdoor) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;

          const currentHour = Math.floor(next / 3600);

          if (
            next % 3600 === 0 &&
            Notification.permission === "granted"
          ) {
            new Notification("Time for water and rest!", {
              body: `You've been exposed to heat for ${currentHour} hour(s). Take a break in the shade!`,
            });
          }

          return next;
        });
      }, 1000);
    } else {
      setSeconds(0); // reset timer indoor
    }

    return () => clearInterval(timer);
  }, [isOutdoor]);

  return {
    seconds,
    isOutdoor,
    triggerTestNotification,
  };
}